"""Offline, experimental CLIP-proxy calibration; outputs are never runtime activated."""
import argparse
import hashlib
import json
import os
from pathlib import Path

import torch
import torch.nn.functional as F
from torchvision.utils import save_image


ATTRIBUTES = {
    "smile": ("a smiling face", "a neutral face"),
    "blond_hair": ("a person with blond hair", "a person with dark hair"),
    "left_yaw": ("a face looking to the left", "a face looking straight ahead"),
    "bright_lighting": ("a face in bright lighting", "a face in dim lighting"),
}


def fit_direction(z, scores, ridge=1.0):
    """Ridge regression of centered CLIP preference on standardized latent values."""
    x = z.float()
    x = (x - x.mean(0)) / x.std(0, unbiased=False).clamp_min(1e-6)
    y = scores.float() - scores.float().mean()
    direction = torch.linalg.solve(x.T @ x + ridge * torch.eye(x.shape[1]), x.T @ y)
    if not torch.isfinite(direction).all() or direction.norm() < 1e-12:
        raise ValueError("CLIP scores did not produce a finite, nonzero direction")
    direction = direction / direction.norm()
    if torch.dot((x @ direction), y) < 0:
        direction = -direction
    return direction


def _clip_scorer(cache, device):
    # Check the official CLIP cache path first: clip.load otherwise downloads weights.
    try:
        import clip
    except ImportError as exc:
        raise RuntimeError("Install the official clip package locally to use CLIP calibration") from exc
    cache = Path(cache)
    cache.mkdir(parents=True, exist_ok=True)
    checkpoint = cache / "ViT-B-32.pt"
    if not checkpoint.is_file():
        raise FileNotFoundError(f"Offline CLIP ViT-B/32 weights not found: {checkpoint}")
    model, preprocess = clip.load("ViT-B/32", device=device, download_root=str(cache))
    model.eval()
    prompts = [p for pair in ATTRIBUTES.values() for p in pair]
    with torch.no_grad():
        text = F.normalize(model.encode_text(clip.tokenize(prompts).to(device)), dim=-1)

    def score(images):
        # Generator output is [-1,1]; CLIP's canonical transform resizes/crops to 224.
        from torchvision.transforms.functional import to_pil_image
        pixels = [preprocess(to_pil_image((im.detach().cpu().clamp(-1, 1) + 1) / 2)) for im in images]
        pixels = torch.stack(pixels).to(device)
        with torch.no_grad():
            image_features = F.normalize(model.encode_image(pixels), dim=-1)
        similarities = image_features @ text.T
        return torch.stack([similarities[:, i * 2] - similarities[:, i * 2 + 1] for i in range(len(ATTRIBUTES))], dim=1).cpu()
    return score


def _sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _project_batch(modified, original):
    from latent_ops import project_to_sphere
    # Runtime helper expects one latent at a time; avoid coupling batch rows' norms.
    return torch.stack([project_to_sphere(modified[i], original[i]) for i in range(len(original))])


def render_triplets(generator, z_seeds, direction, nz, device, strength=3.0, batch=16):
    """Return seed-major images: seed 0 (-,0,+), seed 1 (-,0,+), ..."""
    output = []
    for start in range(0, len(z_seeds), batch):
        base = z_seeds[start:start + batch].to(device).view(-1, nz, 1, 1)
        vector = direction.to(device).view(1, nz, 1, 1)
        with torch.no_grad():
            variants = [generator(base if sign == 0 else _project_batch(base + sign * strength * vector, base)) for sign in (-1, 0, 1)]
        output.extend(torch.stack([image[i] for i in range(len(base)) for image in variants]).cpu().unbind(0))
    return torch.stack(output)


def calibrate(generator, nz, scorer, device, count=1024, heldout=128, batch=16, seed=0, strength=3.0):
    if count < 2 or heldout < 1 or batch < 1:
        raise ValueError("count must be >=2 and heldout/batch must be positive")
    rng = torch.Generator(device="cpu").manual_seed(seed)
    z_all = torch.randn(count + heldout, nz, generator=rng)
    train_z, test_z = z_all[:count], z_all[count:]

    def evaluate(z):
        scores = []
        for start in range(0, len(z), batch):
            latent = z[start:start + batch].to(device).view(-1, nz, 1, 1)
            with torch.no_grad():
                images = generator(latent)
            value = torch.as_tensor(scorer(images)).float()
            if value.shape != (len(latent), len(ATTRIBUTES)):
                raise ValueError(f"scorer must return [batch, {len(ATTRIBUTES)}] contrasts")
            scores.append(value.cpu())
        return torch.cat(scores)

    directions, records = {}, {}
    # Matched seed sets are used for fitting and held-out validation.
    train_scores = evaluate(train_z)
    for index, key in enumerate(ATTRIBUTES):
        directions[key] = fit_direction(train_z, train_scores[:, index])
        records[key] = {"scale": float(strength), "proxy_win_rate": 0.0, "proxy_mean_delta": 0.0, "cross_attribute_drift": {}}
    deltas = {key: [] for key in ATTRIBUTES}
    for start in range(0, len(test_z), batch):
        base = test_z[start:start + batch].to(device).view(-1, nz, 1, 1)
        images = []
        with torch.no_grad():
            for key in ATTRIBUTES:
                v = directions[key].to(device).view(1, nz, 1, 1)
                images.extend((generator(_project_batch(base - strength * v, base)), generator(_project_batch(base + strength * v, base))))
            # Each latent variant is generated once and all attribute scores share one CLIP pass.
            rendered = torch.cat(images)
        scored = torch.as_tensor(scorer(rendered)).float()
        if scored.shape != (len(rendered), len(ATTRIBUTES)):
            raise ValueError(f"scorer must return [batch, {len(ATTRIBUTES)}] contrasts")
        scored = scored.reshape(len(ATTRIBUTES), 2, len(base), len(ATTRIBUTES)).cpu()
        for i, key in enumerate(ATTRIBUTES):
            deltas[key].append(scored[i, 1] - scored[i, 0])
    for key in ATTRIBUTES:
        matrix = torch.cat(deltas[key])
        i = list(ATTRIBUTES).index(key)
        own = matrix[:, i]
        records[key]["proxy_win_rate"] = float((own > 0).float().mean())
        records[key]["proxy_mean_delta"] = float(own.mean())
        records[key]["cross_attribute_drift"] = {other: float(matrix[:, j].mean()) for j, other in enumerate(ATTRIBUTES) if other != key}
    return train_z, test_z, directions, records


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ckpt", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--count", type=int, default=1024)
    parser.add_argument("--heldout", type=int, default=128)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--strength", type=float, default=3.0)
    parser.add_argument("--clip-cache", default="/tmp/opencode/clip")
    args = parser.parse_args(argv)
    if args.count < 2 or args.heldout < 1 or args.batch < 1 or args.seed < 0 or args.strength <= 0:
        parser.error("count >= 2, heldout/batch > 0, seed >= 0, and strength > 0 are required")
    ckpt = Path(args.ckpt)
    if not ckpt.is_file():
        parser.error(f"checkpoint is not a file: {ckpt}")
    out = Path(args.out_dir)
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        parser.error(f"output directory must be empty: {out}")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    from generate import load_generator
    generator, nz = load_generator(str(ckpt), device)
    scorer = _clip_scorer(args.clip_cache, device)
    train, test, directions, records = calibrate(generator, nz, scorer, device, args.count, args.heldout, args.batch, args.seed, args.strength)
    out.mkdir(parents=True, exist_ok=True)
    # Render each fixed held-out seed as an adjacent minus/zero/plus triplet.
    for key, direction in directions.items():
        images = render_triplets(generator, test, direction, nz, device, records[key]["scale"], args.batch)
        save_image(images, out / f"{key}_triplets.png", nrow=3, normalize=True, value_range=(-1, 1))
    digest = _sha256(ckpt)
    metadata = {"checkpoint": str(ckpt), "checkpoint_sha256": digest, "clip": "OpenAI CLIP ViT-B/32 proxy", "count": args.count, "heldout": args.heldout, "batch": args.batch, "seed": args.seed, "strength": args.strength, "contact_sheet_columns": ["minus", "zero", "plus"] , "proxy_warning": "NOT independent semantic proof; no direction is validated automatically.", "status": "tentative; human review required; no runtime integration", "attributes": records}
    (out / "report.json").write_text(json.dumps(metadata, indent=2) + "\n")
    torch.save({"metadata": metadata, "directions": directions}, out / "directions.pt")


if __name__ == "__main__":
    main()
