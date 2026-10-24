import argparse
import glob
import os
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image
from tqdm import tqdm

SLUGS = {
    "celeba": "jessicali9530/celeba-dataset",
    "ffhq": "arnaud58/flickrfaceshq-dataset-ffhq",
}


def find_images(root):
    files = []
    for pattern in ("*.jpg", "*.jpeg", "*.png"):
        files += glob.glob(os.path.join(root, "**", pattern), recursive=True)
    return sorted(files)


def load_and_resize(path, size):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    img = img.crop((left, top, left + s, top + s))
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return np.asarray(img, dtype=np.uint8)


def split_image_paths(files, val_fraction=0.1, seed=42):
    if not 0 < val_fraction < 1:
        raise ValueError("val_fraction must be between 0 and 1")
    if len(files) < 2:
        raise ValueError("at least two images are required for a train/validation split")
    indices = np.random.default_rng(seed).permutation(len(files))
    n_val = min(len(files) - 1, max(1, int(round(len(files) * val_fraction))))
    val_indices = set(indices[:n_val])
    train = [path for i, path in enumerate(files) if i not in val_indices]
    val = [path for i, path in enumerate(files) if i in val_indices]
    return train, val


def preprocess(files, size):
    out = np.empty((len(files), size, size, 3), dtype=np.uint8)
    with ThreadPoolExecutor(max_workers=8) as ex:
        for i, arr in enumerate(tqdm(ex.map(lambda f: load_and_resize(f, size), files), total=len(files))):
            out[i] = arr
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", choices=["celeba", "ffhq"], required=True)
    p.add_argument("--root", default=None, help="folder with already-downloaded images (skips Kaggle download)")
    p.add_argument("--size", type=int, default=64)
    p.add_argument("--limit", type=int, default=0, help="only use the first N images (0 = all)")
    p.add_argument("--val-fraction", type=float, default=0.1)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    root = args.root
    if root is None:
        import kagglehub
        print("Downloading from Kaggle (first time can take a few minutes)...")
        root = kagglehub.dataset_download(SLUGS[args.dataset])
    print("Image root:", root)

    files = find_images(root)
    if args.limit:
        files = files[: args.limit]
    if not files:
        raise SystemExit(f"No images found under {root}")
    print(f"Found {len(files)} images")

    os.makedirs("data", exist_ok=True)
    if args.dataset == "celeba":
        train_files, val_files = split_image_paths(files, args.val_fraction, args.seed)
        for split, split_files in (("train", train_files), ("val", val_files)):
            out_path = f"data/celeba_{split}_{args.size}.npy"
            out = preprocess(split_files, args.size)
            np.save(out_path, out)
            print("Saved", out_path, out.shape)
    else:
        out = preprocess(files, args.size)
        out_path = f"data/{args.dataset}_{args.size}.npy"
        np.save(out_path, out)
        print("Saved", out_path, out.shape)


if __name__ == "__main__":
    main()
