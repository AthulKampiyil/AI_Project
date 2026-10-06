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


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", choices=["celeba", "ffhq"], required=True)
    p.add_argument("--root", default=None, help="folder with already-downloaded images (skips Kaggle download)")
    p.add_argument("--size", type=int, default=64)
    p.add_argument("--limit", type=int, default=0, help="only use the first N images (0 = all)")
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

    out = np.empty((len(files), args.size, args.size, 3), dtype=np.uint8)
    with ThreadPoolExecutor(max_workers=8) as ex:
        for i, arr in enumerate(tqdm(ex.map(lambda f: load_and_resize(f, args.size), files), total=len(files))):
            out[i] = arr

    os.makedirs("data", exist_ok=True)
    out_path = f"data/{args.dataset}_{args.size}.npy"
    np.save(out_path, out)
    print("Saved", out_path, out.shape)


if __name__ == "__main__":
    main()
