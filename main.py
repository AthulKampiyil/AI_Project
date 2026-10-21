import os
import io
import time
import base64
import json
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import torch
import numpy as np
from PIL import Image

from generate import load_generator
import latent_ops

app = FastAPI(
    title="Latent Studio API",
    description="High-performance backend for DCGAN Face Lab",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount results directory to serve static experiment plots & artifacts
if os.path.exists("results"):
    app.mount("/results", StaticFiles(directory="results"), name="results")

# Model state
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CKPT_PATH = "weights/generator_celeba_dcgan.pt"
if not os.path.exists(CKPT_PATH):
    if os.path.exists("checkpoints/celeba_baseline/latest.pt"):
        CKPT_PATH = "checkpoints/celeba_baseline/latest.pt"

G = None
NZ = 100
ATTR_VECTORS = {}
MODEL_LOADED = False
BENCHMARK_LATENCY_MS = 0.0

def pil_to_base64_data_url(pil_img: Image.Image, format: str = "PNG") -> str:
    buffered = io.BytesIO()
    pil_img.save(buffered, format=format)
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    mime = "image/gif" if format.upper() == "GIF" else "image/png"
    return f"data:{mime};base64,{encoded}"

def get_latent_vector(seed: int) -> torch.Tensor:
    gen = torch.Generator(device="cpu").manual_seed(int(seed))
    return torch.randn(1, NZ, 1, 1, generator=gen, dtype=torch.float32).to(device)

@app.on_event("startup")
def load_model():
    global G, NZ, ATTR_VECTORS, MODEL_LOADED, BENCHMARK_LATENCY_MS
    try:
        print(f"Loading DCGAN generator on {device} from {CKPT_PATH}...")
        G, NZ = load_generator(CKPT_PATH, device)
        ATTR_VECTORS = latent_ops.load_attribute_vectors(device)
        MODEL_LOADED = True
        
        # Benchmark single inference
        t0 = time.perf_counter()
        with torch.no_grad():
            dummy = torch.randn(1, NZ, 1, 1, device=device)
            _ = G(dummy)
        if device.type == "cuda":
            torch.cuda.synchronize()
        BENCHMARK_LATENCY_MS = round((time.perf_counter() - t0) * 1000.0, 1)
        print(f"Model successfully loaded. Benchmark latency: {BENCHMARK_LATENCY_MS} ms")
    except Exception as e:
        print(f"Error loading model weights: {e}")
        MODEL_LOADED = False

# Request / Response Schemas
class SculptRequest(BaseModel):
    seed: int
    smile: float = 0.0
    pose: float = 0.0
    hair: float = 0.0
    light: float = 0.0

class SculptResponse(BaseModel):
    base: str
    sculpted: str
    zNorm: float

class MorphRequest(BaseModel):
    seedA: int
    seedB: int
    mode: str = "slerp"
    steps: int = 25
    fps: int = 18

class MorphResponse(BaseModel):
    gifUrl: str
    frames: List[str]

class StripsRequest(BaseModel):
    seedA: int
    seedB: int
    steps: int = 7

class StripsResponse(BaseModel):
    lerp: List[str]
    slerp: List[str]

class GridRequest(BaseModel):
    n: int = 16
    seed: Optional[int] = None

class GridResponse(BaseModel):
    image: str
    seeds: List[int]

class HealthResponse(BaseModel):
    weightsLoaded: bool
    device: str
    latencyMs: float

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        weightsLoaded=MODEL_LOADED,
        device=str(device),
        latencyMs=BENCHMARK_LATENCY_MS
    )

@app.post("/api/sculpt", response_model=SculptResponse)
def sculpt(req: SculptRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model weights not loaded")
    
    with torch.no_grad():
        base_z = get_latent_vector(req.seed)
        v_smile = ATTR_VECTORS.get("smile", torch.zeros_like(base_z))
        v_pose = ATTR_VECTORS.get("pose", torch.zeros_like(base_z))
        v_gender = ATTR_VECTORS.get("gender", torch.zeros_like(base_z))
        v_light = ATTR_VECTORS.get("light", torch.zeros_like(base_z))

        delta = (
            float(req.smile) * v_smile
            + float(req.pose) * v_pose
            + float(req.hair) * v_gender
            + float(req.light) * v_light
        )

        modified_z = latent_ops.project_to_sphere(base_z + delta, base_z)
        z_norm = float(torch.norm(modified_z.view(-1)).item())

        base_img = latent_ops.tensor_to_pil(G(base_z)[0], size=(384, 384))
        sculpted_img = latent_ops.tensor_to_pil(G(modified_z)[0], size=(384, 384))

    return SculptResponse(
        base=pil_to_base64_data_url(base_img),
        sculpted=pil_to_base64_data_url(sculpted_img),
        zNorm=round(z_norm, 2)
    )

@app.post("/api/morph", response_model=MorphResponse)
def morph(req: MorphRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model weights not loaded")

    z_a = get_latent_vector(req.seedA)
    z_b = get_latent_vector(req.seedB)
    steps = max(5, min(req.steps, 60))
    fps = max(5, min(req.fps, 30))
    mode = req.mode.lower()

    frames = []
    frames_b64 = []
    with torch.no_grad():
        for step in range(steps):
            t = step / float(steps - 1)
            z = latent_ops.slerp(z_a, z_b, t) if mode == "slerp" else latent_ops.lerp(z_a, z_b, t)
            img_tensor = G(z)[0]
            pil_frame = latent_ops.tensor_to_pil(img_tensor, size=(320, 320))
            frames.append(np.array(pil_frame))
            frames_b64.append(pil_to_base64_data_url(pil_frame))

    # Ping-pong loop
    loop_frames = frames + frames[-2:0:-1]
    loop_b64 = frames_b64 + frames_b64[-2:0:-1]

    # Render GIF in memory
    import imageio.v2 as imageio
    gif_buf = io.BytesIO()
    imageio.mimsave(gif_buf, loop_frames, format="GIF", fps=fps, loop=0)
    gif_b64 = "data:image/gif;base64," + base64.b64encode(gif_buf.getvalue()).decode("utf-8")

    return MorphResponse(
        gifUrl=gif_b64,
        frames=loop_b64
    )

@app.post("/api/strips", response_model=StripsResponse)
def strips(req: StripsRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model weights not loaded")

    z_a = get_latent_vector(req.seedA)
    z_b = get_latent_vector(req.seedB)
    steps = max(3, min(req.steps, 15))

    lerp_list = []
    slerp_list = []

    with torch.no_grad():
        for i in range(steps):
            t = i / float(steps - 1)
            z_l = latent_ops.lerp(z_a, z_b, t)
            z_s = latent_ops.slerp(z_a, z_b, t)
            img_l = latent_ops.tensor_to_pil(G(z_l)[0], size=(128, 128))
            img_s = latent_ops.tensor_to_pil(G(z_s)[0], size=(128, 128))
            lerp_list.append(pil_to_base64_data_url(img_l))
            slerp_list.append(pil_to_base64_data_url(img_s))

    return StripsResponse(
        lerp=lerp_list,
        slerp=slerp_list
    )

@app.post("/api/invert")
async def invert(
    image: UploadFile = File(...),
    iterations: int = Form(35)
):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model weights not loaded")

    contents = await image.read()
    try:
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    steps = max(10, min(iterations, 80))
    orig_pil, rec_pil, _, init_mse, final_mse = latent_ops.invert_face(
        G, NZ, device, pil_img, steps=steps, lr=0.10
    )

    return {
        "target": pil_to_base64_data_url(orig_pil),
        "twin": pil_to_base64_data_url(rec_pil),
        "mseInitial": round(init_mse, 4),
        "mseFinal": round(final_mse, 4)
    }

@app.post("/api/grid", response_model=GridResponse)
def grid(req: GridRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model weights not loaded")

    from torchvision.utils import make_grid
    from torchvision.transforms.functional import to_pil_image

    n = 1 if req.n == 1 else 16
    seeds = []
    
    if req.seed is not None:
        base_seed = req.seed
    else:
        base_seed = np.random.randint(0, 100000)

    z_tensors = []
    for i in range(n):
        s = (base_seed + i * 37) % 100000
        seeds.append(s)
        gen = torch.Generator(device="cpu").manual_seed(s)
        z_tensors.append(torch.randn(1, NZ, 1, 1, generator=gen, dtype=torch.float32).to(device))

    with torch.no_grad():
        z_batch = torch.cat(z_tensors, dim=0)
        img_batch = G(z_batch)
        if n == 1:
            pil_grid = latent_ops.tensor_to_pil(img_batch[0], size=(384, 384))
        else:
            grid_tensor = make_grid(img_batch, nrow=4, normalize=True, value_range=(-1, 1), padding=2)
            pil_grid = to_pil_image(grid_tensor.cpu()).resize((512, 512), Image.Resampling.BICUBIC)

    return GridResponse(
        image=pil_to_base64_data_url(pil_grid),
        seeds=seeds
    )

@app.get("/api/results")
def get_results():
    results_path = "results/results.json"
    if os.path.exists(results_path):
        with open(results_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"experiments": [], "plots": [], "kpis": {}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
