import argparse

import gradio as gr
import torch
from PIL import Image
from torchvision.transforms.functional import to_pil_image
from torchvision.utils import make_grid

from generate import load_generator

parser = argparse.ArgumentParser()
parser.add_argument("--ckpt", default="checkpoints/celeba_baseline/latest.pt")
args = parser.parse_args()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
G, NZ = load_generator(args.ckpt, device)


@torch.no_grad()
def one_face():
    x = G(torch.randn(1, NZ, 1, 1, device=device))[0].cpu()
    img = to_pil_image((x * 0.5 + 0.5).clamp(0, 1))
    return img.resize((384, 384), Image.Resampling.BICUBIC)


@torch.no_grad()
def sixteen_faces():
    x = G(torch.randn(16, NZ, 1, 1, device=device)).cpu()
    grid = make_grid(x, nrow=4, normalize=True, value_range=(-1, 1))
    return to_pil_image(grid).resize((512, 512), Image.Resampling.BICUBIC)


with gr.Blocks(title="DCGAN Face Generator") as demo:
    gr.Markdown("# DCGAN Face Generator\nEvery face below belongs to a person who does not exist.")
    with gr.Row():
        with gr.Column():
            btn1 = gr.Button("Generate new face", variant="primary")
            out1 = gr.Image(label="Generated face", type="pil")
        with gr.Column():
            btn2 = gr.Button("Generate 16 faces")
            out2 = gr.Image(label="16 generated faces", type="pil")
    btn1.click(one_face, inputs=None, outputs=out1)
    btn2.click(sixteen_faces, inputs=None, outputs=out2)

if __name__ == "__main__":
    demo.launch()
