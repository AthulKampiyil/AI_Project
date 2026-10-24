import argparse

import numpy as np
import torch
from torchmetrics.image.fid import FrechetInceptionDistance

from generate import load_generator


def validate_eval_args(n, batch):
    if n <= 0:
        raise ValueError("n must be positive")
    if batch <= 0:
        raise ValueError("batch must be positive")


def make_batches(n, batch):
    return (min(batch, n - start) for start in range(0, n, batch))


def validate_real_count(available, requested):
    if available < requested:
        raise ValueError(f"requested {requested} real images, but only {available} are available")


def make_noise_generator(device, seed):
    return torch.Generator(device=device).manual_seed(seed)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/celeba_val_64.npy")
    p.add_argument("--ckpt", default="checkpoints/celeba_baseline/latest.pt")
    p.add_argument("--n", type=int, default=10000)
    p.add_argument("--batch", type=int, default=100)
    p.add_argument("--seed", type=int, default=42)
    a = p.parse_args()
    validate_eval_args(a.n, a.batch)

    real_array = np.load(a.data, mmap_mode="r")
    try:
        validate_real_count(len(real_array), a.n)
    except ValueError as exc:
        raise ValueError(f"{exc} in {a.data}") from exc

    device = torch.device("cuda")
    G, nz = load_generator(a.ckpt, device)
    fid = FrechetInceptionDistance(feature=2048).to(device)  # expects uint8 images in [0, 255]

    real = torch.from_numpy(real_array[: a.n].copy()).permute(0, 3, 1, 2)
    for i in range(0, a.n, a.batch):
        fid.update(real[i:i + a.batch].to(device), real=True)

    generator = make_noise_generator(device, a.seed)
    with torch.no_grad():
        for batch_size in make_batches(a.n, a.batch):
            x = G(torch.randn(batch_size, nz, 1, 1, device=device, generator=generator))
            x = ((x * 0.5 + 0.5).clamp(0, 1) * 255).to(torch.uint8)
            fid.update(x, real=False)

    print(f"FID ({a.ckpt}): {fid.compute().item():.2f}")


if __name__ == "__main__":
    main()
