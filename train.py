import argparse
import csv
import hashlib
import os
import random
import time

import numpy as np
import torch
import torch.nn as nn
from torchvision.utils import save_image

from models import Generator, Discriminator, weights_init


def _rng_state():
    numpy_state = np.random.get_state()
    return {
        "python": random.getstate(),
        "numpy": (numpy_state[0], numpy_state[1].tolist(), *numpy_state[2:]),
        "torch": torch.get_rng_state(),
        "cuda": [state.cpu() for state in torch.cuda.get_rng_state_all()]
        if torch.cuda.is_available() else [],
    }


def _restore_rng_state(state):
    random.setstate(state["python"])
    numpy_state = state["numpy"]
    np.random.set_state((numpy_state[0], np.asarray(numpy_state[1], dtype=np.uint32),
                         *numpy_state[2:]))
    torch.set_rng_state(state["torch"].cpu())
    if state["cuda"]:
        torch.cuda.set_rng_state_all([rng.cpu() for rng in state["cuda"]])


def _data_fingerprint(path):
    digest = hashlib.sha256()
    with open(path, "rb") as data_file:
        for chunk in iter(lambda: data_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _resume_config(args, data_fingerprint):
    return {
        "data": os.path.abspath(args.data),
        "data_sha256": data_fingerprint,
        **{key: getattr(args, key) for key in (
            "batch_size", "lr", "beta1", "nz", "ngf", "ndf", "no_bn",
            "label_smooth", "amp", "seed", "max_images",
        )},
    }


def get_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/celeba_train_64.npy")
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
    data_fingerprint = _data_fingerprint(args.data)
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
    if args.resume:
        if not os.path.exists(latest):
            raise SystemExit(f"Cannot resume: checkpoint not found: {latest}")
        ck = torch.load(latest, map_location=device)
        config = _resume_config(args, data_fingerprint)
        saved_config = ck.get("resume_config")
        if saved_config is None or saved_config != config:
            raise SystemExit("Cannot resume: checkpoint configuration is missing or incompatible "
                             "(data, seed, or training hyperparameters changed).")
        netG.load_state_dict(ck["netG"])
        netD.load_state_dict(ck["netD"])
        optG.load_state_dict(ck["optG"])
        optD.load_state_dict(ck["optD"])
        scaler_g.load_state_dict(ck["scaler_g"])
        scaler_d.load_state_dict(ck["scaler_d"])
        fixed_noise = ck["fixed_noise"].to(device)
        start_epoch = ck["epoch"]
        _restore_rng_state(ck["rng_state"])
        print(f"Resumed from epoch {start_epoch}")
    elif (os.path.exists(log_dir + "/losses.csv")
          or any(name.endswith(".pt") for name in os.listdir(ckpt_dir))):
        raise SystemExit(f"Run already has checkpoint/log data: {ckpt_dir}, {log_dir}. "
                         "Use --resume or choose a fresh --run-name.")

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
            "scaler_g": scaler_g.state_dict(), "scaler_d": scaler_d.state_dict(),
            "fixed_noise": fixed_noise.cpu(),
            "args": vars(args),
            "resume_config": _resume_config(args, data_fingerprint),
            "rng_state": _rng_state(),
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
