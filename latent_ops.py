import os
import io
import base64
import hashlib
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from torchvision.transforms.functional import to_pil_image
from torchvision.utils import make_grid
import imageio.v2 as imageio


def slerp(z0, z1, t):
    """
    Spherical Linear Interpolation (Slerp) between two latent vectors.
    Travels along the curved surface of the 100-dimensional hypersphere,
    maintaining constant vector length and preventing blurry intermediate faces.
    """
    z0_flat = z0.view(1, -1)
    z1_flat = z1.view(1, -1)

    norm0 = torch.norm(z0_flat, dim=-1, keepdim=True)
    norm1 = torch.norm(z1_flat, dim=-1, keepdim=True)

    z0_unit = z0_flat / (norm0 + 1e-8)
    z1_unit = z1_flat / (norm1 + 1e-8)

    dot = torch.sum(z0_unit * z1_unit, dim=-1, keepdim=True).clamp(-0.9999, 0.9999)
    theta = torch.acos(dot)
    sin_theta = torch.sin(theta)

    if sin_theta.item() < 1e-4:
        z_t = (1.0 - t) * z0_flat + t * z1_flat
    else:
        scale0 = torch.sin((1.0 - t) * theta) / sin_theta
        scale1 = torch.sin(t * theta) / sin_theta
        target_norm = (1.0 - t) * norm0 + t * norm1
        z_t = (scale0 * z0_unit + scale1 * z1_unit) * target_norm

    return z_t.view_as(z0)


def lerp(z0, z1, t):
    """Standard Euclidean linear interpolation (walks through interior of sphere)."""
    return (1.0 - t) * z0 + t * z1


def load_attribute_vectors(device, vector_path="weights/attribute_vectors.pt"):
    """
    Loads precomputed Radford-style attribute vectors for CelebA.
    """
    if os.path.exists(vector_path):
        data = torch.load(vector_path, map_location=device)
        return {k: v.to(device) for k, v in data.items()}
    return {}


def tensor_to_pil(tensor, size=(384, 384), enhance=True):
    """
    Converts a generated PyTorch image in [-1, 1] to a crisp, high-definition PIL Image.
    Uses Lanczos resampling with micro-edge contrast enhancement to bring out sharp facial contours,
    eyes, and hair boundaries without noise amplification.
    """
    from PIL import ImageFilter, ImageEnhance
    clamped = (tensor * 0.5 + 0.5).clamp(0, 1)
    img = to_pil_image(clamped.cpu())
    if size:
        img = img.resize(size, Image.Resampling.LANCZOS)
    if enhance and size and size[0] >= 256:
        # Subtle unsharp edge restoration for eye, lip, and hair sharpness
        img = img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))
        img = ImageEnhance.Contrast(img).enhance(1.06)
    return img


def project_to_sphere(z_modified, z_original):
    """
    Preserves the exact norm of the original vector on the Gaussian hypersphere.
    Prevents out-of-distribution blowing out or degradation when adding attributes.
    """
    orig_norm = torch.norm(z_original.view(1, -1), dim=-1, keepdim=True)
    mod_norm = torch.norm(z_modified.view(1, -1), dim=-1, keepdim=True) + 1e-8
    return (z_modified / mod_norm * orig_norm).view_as(z_original)


def generate_morph_animation(
    G, nz, device, z0, z1, steps=25, mode="slerp", fps=18, out_path="results/morph.gif"
):
    """
    Generates a smooth ping-pong looping animated GIF between two latent points.
    """
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    frames = []

    for step in range(steps):
        t = step / float(steps - 1)
        z = slerp(z0, z1, t) if mode == "slerp" else lerp(z0, z1, t)
        with torch.no_grad():
            img_tensor = G(z)[0]
        pil_frame = tensor_to_pil(img_tensor, size=(320, 320))
        frames.append(np.array(pil_frame))

    loop_frames = frames + frames[-2:0:-1]
    imageio.mimsave(out_path, loop_frames, fps=fps, loop=0)
    return out_path


def gif_to_html_embed(gif_path, max_width=320):
    """Encodes a GIF as base64 to ensure 100% reliable animated playback in Gradio."""
    if not os.path.exists(gif_path):
        return "<p>No animation generated yet.</p>"
    with open(gif_path, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("utf-8")
    return f"""
    <div style="display: flex; justify-content: center; align-items: center; padding: 10px; background: #0f172a; border-radius: 12px; margin-top: 8px;">
        <img src="data:image/gif;base64,{b64}" style="max-width: {max_width}px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);" />
    </div>
    """


def compare_slerp_vs_lerp(G, nz, device, z0, z1, steps=7):
    """
    Side-by-side visual comparison between:
    Row 1: Linear Interpolation (Lerp - straight line)
    Row 2: Spherical Interpolation (Slerp - curved hypersphere path)
    """
    lerp_tensors = []
    slerp_tensors = []

    with torch.no_grad():
        for i in range(steps):
            t = i / float(steps - 1)
            z_l = lerp(z0, z1, t)
            z_s = slerp(z0, z1, t)
            lerp_tensors.append(G(z_l)[0])
            slerp_tensors.append(G(z_s)[0])

    all_tensors = torch.stack(lerp_tensors + slerp_tensors, dim=0)
    grid = make_grid(all_tensors, nrow=steps, normalize=True, value_range=(-1, 1), padding=4)
    grid_pil = to_pil_image(grid)
    return grid_pil.resize((steps * 100, 2 * 100), Image.Resampling.BICUBIC)


def invert_face(G, nz, device, target_pil_img, steps=40, lr=0.10):
    """
    Fast & Robust Latent Inversion:
    1. Multi-candidate random sampling on the Gaussian hypersphere to find the best starting basin.
    2. Test-time backpropagation optimization on z to minimize reconstruction MSE.
    """
    G.eval()
    G.requires_grad_(False)
    w, h = target_pil_img.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    cropped = target_pil_img.crop((left, top, left + s, top + s)).resize((64, 64), Image.Resampling.LANCZOS)
    arr = np.array(cropped.convert("RGB"), dtype=np.float32) / 127.5 - 1.0
    target_tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(device)

    # Seed a local generator from the actual crop without changing global RNG state.
    seed = int.from_bytes(hashlib.sha256(arr.tobytes()).digest()[:8], "little")
    rng = torch.Generator(device=device).manual_seed(seed)

    # 1. Smart initialization: sample 30 candidates
    with torch.no_grad():
        candidates = torch.randn(30, nz, 1, 1, device=device, generator=rng)
        cand_imgs = G(candidates)
        mse_scores = ((cand_imgs - target_tensor) ** 2).mean(dim=[1, 2, 3])
        best_idx = torch.argmin(mse_scores)
        best_z = candidates[best_idx : best_idx + 1].clone()
        init_mse = mse_scores[best_idx].item()
        best_mse = init_mse
        best_z_snapshot = best_z.clone()

    # 2. Optimize latent vector
    best_z.requires_grad_(True)
    optimizer = torch.optim.Adam([best_z], lr=lr)

    for step in range(steps):
        optimizer.zero_grad()
        gen = G(best_z)
        loss = F.mse_loss(gen, target_tensor) + 0.001 * torch.mean(best_z ** 2)
        loss.backward()
        optimizer.step()
        with torch.no_grad():
            candidate = G(best_z)
            candidate_mse = F.mse_loss(candidate, target_tensor).item()
            if candidate_mse < best_mse:
                best_mse = candidate_mse
                best_z_snapshot = best_z.detach().clone()

    with torch.no_grad():
        reconstructed_tensor = G(best_z_snapshot)[0]
        final_mse = F.mse_loss(reconstructed_tensor.unsqueeze(0), target_tensor).item()

    rec_pil = tensor_to_pil(reconstructed_tensor, size=(384, 384))
    orig_pil = cropped.resize((384, 384), Image.Resampling.BICUBIC)
    return orig_pil, rec_pil, best_z_snapshot.detach(), init_mse, final_mse
