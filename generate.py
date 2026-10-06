import argparse

import torch
from torchvision.utils import save_image

from models import Generator


def load_generator(ckpt_path, device):
    ck = torch.load(ckpt_path, map_location=device)
    a = ck["args"]
    G = Generator(a["nz"], a["ngf"], use_bn=not a["no_bn"]).to(device)
    G.load_state_dict(ck["netG"])
    G.eval()
    return G, a["nz"]


@torch.no_grad()
def make_grid_images(G, nz, device, n=64):
    return G(torch.randn(n, nz, 1, 1, device=device)).cpu()


@torch.no_grad()
def make_interpolation(G, nz, device, rows=8, steps=10):
    """Smoothly walk between two random points in noise space (Section 6 of the paper)."""
    z0 = torch.randn(rows, 1, nz, device=device)
    z1 = torch.randn(rows, 1, nz, device=device)
    alphas = torch.linspace(0, 1, steps, device=device).view(1, steps, 1)
    z = ((1 - alphas) * z0 + alphas * z1).reshape(-1, nz, 1, 1)
    return G(z).cpu()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ckpt", default="checkpoints/celeba_baseline/latest.pt")
    p.add_argument("--mode", choices=["grid", "interpolate"], default="grid")
    p.add_argument("--out", default="results/generated.png")
    args = p.parse_args()

    import os
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    G, nz = load_generator(args.ckpt, device)

    if args.mode == "grid":
        imgs = make_grid_images(G, nz, device)
        save_image(imgs, args.out, nrow=8, normalize=True, value_range=(-1, 1))
    else:
        imgs = make_interpolation(G, nz, device)
        save_image(imgs, args.out, nrow=10, normalize=True, value_range=(-1, 1))
    print("Saved", args.out)


if __name__ == "__main__":
    main()
