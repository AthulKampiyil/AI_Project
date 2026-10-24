import argparse
from pathlib import Path

import torch


def export_checkpoint(ckpt_path, out_path):
    out_path = Path(out_path)
    if out_path.exists():
        raise FileExistsError(f"Refusing to overwrite existing file: {out_path}")

    checkpoint = torch.load(ckpt_path, map_location="cpu", weights_only=True)
    args = checkpoint["args"]
    exported = {
        "args": {key: args[key] for key in ("nz", "ngf", "no_bn")},
        "netG": checkpoint["netG"],
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(exported, out_path)
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Export only a checkpoint's generator")
    parser.add_argument("--ckpt", required=True, help="Source training checkpoint")
    parser.add_argument("--out", required=True, help="Output generator-only checkpoint")
    args = parser.parse_args()
    path = export_checkpoint(args.ckpt, args.out)
    print(f"Saved generator checkpoint to {path}")


if __name__ == "__main__":
    main()
