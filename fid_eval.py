import argparse

import numpy as np
import torch
from torchmetrics.image.fid import FrechetInceptionDistance

from generate import load_generator


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/celeba_64.npy")
    p.add_argument("--ckpt", default="checkpoints/celeba_baseline/latest.pt")
    p.add_argument("--n", type=int, default=10000)
    p.add_argument("--batch", type=int, default=100)
    a = p.parse_args()

    device = torch.device("cuda")
    G, nz = load_generator(a.ckpt, device)
    fid = FrechetInceptionDistance(feature=2048).to(device)  # expects uint8 images in [0, 255]

    real = torch.from_numpy(np.load(a.data, mmap_mode="r")[: a.n].copy()).permute(0, 3, 1, 2)
    for i in range(0, a.n, a.batch):
        fid.update(real[i:i + a.batch].to(device), real=True)

    with torch.no_grad():
        for i in range(0, a.n, a.batch):
            x = G(torch.randn(a.batch, nz, 1, 1, device=device))
            x = ((x * 0.5 + 0.5).clamp(0, 1) * 255).to(torch.uint8)
            fid.update(x, real=False)

    print(f"FID ({a.ckpt}): {fid.compute().item():.2f}")


if __name__ == "__main__":
    main()
