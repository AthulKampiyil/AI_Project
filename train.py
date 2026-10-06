import argparse
import csv
import os
import random
import time

import numpy as np
import torch
import torch.nn as nn
from torchvision.utils import save_image

from models import Generator, Discriminator, weights_init


def get_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/celeba_64.npy")
    p.add_argument("--run-name", default="celeba_baseline")
    p.add_argument("--epochs", type=int, default=25)
    p.add_argument("--batch-size", type=int, default=128)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--beta1", type=float, default=0.5)
    p.add_argument("--nz", type=int, default=100)
    p.add_argument("--ngf", type=int, default=64)
    p.add_argument("--ndf", type=int, default=64)
    p.add_argument("--no-bn", action="store_true", help="remove BatchNorm (ablation experiment)")
    p.add_argument("--label-smooth", type=float, default=0.0, help="real label becomes 1 - this value")
    p.add_argument("--amp", action="store_true", help="mixed precision (saves VRAM; off by default)")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--resume", action="store_true")
    p.add_argument("--save-every", type=int, default=5)
    p.add_argument("--max-images", type=int, default=0)
    return p.parse_args()


def main():
    args = get_args()

    if not torch.cuda.is_available():
        raise SystemExit("CUDA GPU not found. Refusing to train on CPU. "
                         "Run check_gpu.py and fix the PyTorch install (guide Step 3.3).")
    device = torch.device("cuda")
    torch.backends.cudnn.benchmark = True
    print("Training on:", torch.cuda.get_device_name(0))

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    ckpt_dir = f"checkpoints/{args.run_name}"
    sample_dir = f"samples/{args.run_name}"
    log_dir = f"logs/{args.run_name}"
    for d in (ckpt_dir, sample_dir, log_dir):
        os.makedirs(d, exist_ok=True)

    # ---- data: whole dataset lives in CPU RAM as uint8 (N, 3, 64, 64) ----
    data = torch.from_numpy(np.load(args.data)).permute(0, 3, 1, 2).contiguous()
    if args.max_images:
        data = data[: args.max_images]
    n = data.shape[0]
    bs = args.batch_size
    steps_per_epoch = n // bs
    print(f"Dataset: {n} images, {steps_per_epoch} steps per epoch")

    # ---- models ----
    netG = Generator(args.nz, args.ngf, use_bn=not args.no_bn).to(device)
    netD = Discriminator(args.ndf, use_bn=not args.no_bn).to(device)
    netG.apply(weights_init)
    netD.apply(weights_init)

    optD = torch.optim.Adam(netD.parameters(), lr=args.lr, betas=(args.beta1, 0.999))
    optG = torch.optim.Adam(netG.parameters(), lr=args.lr, betas=(args.beta1, 0.999))
    scaler_d = torch.amp.GradScaler("cuda", enabled=args.amp)
    scaler_g = torch.amp.GradScaler("cuda", enabled=args.amp)
    criterion = nn.BCEWithLogitsLoss()

    fixed_noise = torch.randn(64, args.nz, 1, 1, device=device)
    start_epoch = 0
    latest = f"{ckpt_dir}/latest.pt"
    if args.resume and os.path.exists(latest):
        ck = torch.load(latest, map_location=device)
        netG.load_state_dict(ck["netG"])
        netD.load_state_dict(ck["netD"])
        optG.load_state_dict(ck["optG"])
        optD.load_state_dict(ck["optD"])
        fixed_noise = ck["fixed_noise"].to(device)
        start_epoch = ck["epoch"]
        print(f"Resumed from epoch {start_epoch}")

    real_label = 1.0 - args.label_smooth

    log_path = f"{log_dir}/losses.csv"
    new_log = not os.path.exists(log_path)
    log_f = open(log_path, "a", newline="")
    writer = csv.writer(log_f)
    if new_log:
        writer.writerow(["epoch", "step", "lossD", "lossG", "D_x", "D_G_z"])

    def save_ckpt(epoch, path):
        torch.save({
            "epoch": epoch,
            "netG": netG.state_dict(), "netD": netD.state_dict(),
            "optG": optG.state_dict(), "optD": optD.state_dict(),
            "fixed_noise": fixed_noise.cpu(),
            "args": vars(args),
        }, path)

    for epoch in range(start_epoch, args.epochs):
        t0 = time.time()
        perm = torch.randperm(n)
        for it in range(steps_per_epoch):
            idx = perm[it * bs:(it + 1) * bs]
            real = data[idx].to(device, non_blocking=True).float().div_(127.5).sub_(1.0)
            flip = torch.rand(bs, device=device) < 0.5
            real = torch.where(flip.view(-1, 1, 1, 1), real.flip(3), real)

            # ---------- 1) train Discriminator ----------
            netD.zero_grad(set_to_none=True)
            noise = torch.randn(bs, args.nz, 1, 1, device=device)
            with torch.autocast("cuda", enabled=args.amp):
                out_real = netD(real)
                fake = netG(noise)
                out_fake = netD(fake.detach())
                lossD = (criterion(out_real, torch.full_like(out_real, real_label))
                         + criterion(out_fake, torch.zeros_like(out_fake)))
            scaler_d.scale(lossD).backward()
            scaler_d.step(optD)
            scaler_d.update()

            # ---------- 2) train Generator ----------
            netG.zero_grad(set_to_none=True)
            with torch.autocast("cuda", enabled=args.amp):
                out_g = netD(fake)
                lossG = criterion(out_g, torch.ones_like(out_g))
            scaler_g.scale(lossG).backward()
            scaler_g.step(optG)
            scaler_g.update()

            if it % 100 == 0:
                d_x = torch.sigmoid(out_real.float()).mean().item()
                d_gz = torch.sigmoid(out_fake.float()).mean().item()
                step = epoch * steps_per_epoch + it
                writer.writerow([epoch + 1, step, lossD.item(), lossG.item(), d_x, d_gz])
                print(f"[{epoch + 1}/{args.epochs}][{it}/{steps_per_epoch}] "
                      f"lossD {lossD.item():.3f}  lossG {lossG.item():.3f}  "
                      f"D(x) {d_x:.2f}  D(G(z)) {d_gz:.2f}")

        log_f.flush()

        # ---------- end of epoch: samples + checkpoints ----------
        netG.eval()
        with torch.no_grad():
            samples = netG(fixed_noise).float().cpu()
        netG.train()
        save_image(samples, f"{sample_dir}/epoch_{epoch + 1:03d}.png",
                   nrow=8, normalize=True, value_range=(-1, 1))

        save_ckpt(epoch + 1, latest)
        if (epoch + 1) % args.save_every == 0 or epoch + 1 == args.epochs:
            save_ckpt(epoch + 1, f"{ckpt_dir}/epoch_{epoch + 1:03d}.pt")
        print(f"=== epoch {epoch + 1} done in {time.time() - t0:.1f}s ===")

    log_f.close()
    print("Training finished.")


if __name__ == "__main__":
    main()
