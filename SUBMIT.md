# DCGAN Face Generator — Project Submission

**A Deep Convolutional Generative Adversarial Network that learns to synthesize realistic 64×64 face images of people who do not exist.**

---

## 1. Overview

This project implements a DCGAN (Radford, Metz & Chintala, 2015 — arXiv 1511.06434) from scratch in PyTorch. A generator network and a discriminator network are trained in competition: the discriminator learns to tell real celebrity photos from fake ones, while the generator learns to produce increasingly convincing faces to fool it.

The submission goes beyond a baseline implementation. It includes a full experimental study (8 training runs with controlled ablations), quantitative evaluation (FID), a memorization check (nearest-neighbour analysis), qualitative analyses (latent-space interpolation, training-progress strips), an interactive web demo, and reproducible automation scripts.

**Tech stack:** Python 3 · PyTorch (CUDA) · Gradio · NumPy · Pillow · Matplotlib · Pandas · torchmetrics · kagglehub

---

## 2. Model Architecture

Defined in `models.py`.

### Generator (`models.py:18`)

Maps a 100-dimensional noise vector `z` to a 3×64×64 RGB image in [-1, 1]:

| Layer | Operation | Output size |
|---|---|---|
| Input | Noise vector z | 100 × 1 × 1 |
| 1 | ConvTranspose2d 100→512, stride 1 + BatchNorm + ReLU | 512 × 4 × 4 |
| 2 | ConvTranspose2d 512→256, stride 2 + BatchNorm + ReLU | 256 × 8 × 8 |
| 3 | ConvTranspose2d 256→128, stride 2 + BatchNorm + ReLU | 128 × 16 × 16 |
| 4 | ConvTranspose2d 128→64, stride 2 + BatchNorm + ReLU | 64 × 32 × 32 |
| 5 | ConvTranspose2d 64→3, stride 2 + Tanh | 3 × 64 × 64 |

### Discriminator (`models.py:45`)

Maps an image to a single real/fake logit:

| Layer | Operation | Output size |
|---|---|---|
| Input | RGB image | 3 × 64 × 64 |
| 1 | Conv2d 3→64, stride 2 + LeakyReLU(0.2) *(no BatchNorm on input layer)* | 64 × 32 × 32 |
| 2 | Conv2d 64→128, stride 2 + BatchNorm + LeakyReLU | 128 × 16 × 16 |
| 3 | Conv2d 128→256, stride 2 + BatchNorm + LeakyReLU | 256 × 8 × 8 |
| 4 | Conv2d 256→512, stride 2 + BatchNorm + LeakyReLU | 512 × 4 × 4 |
| 5 | Conv2d 512→1, stride 1 | 1 logit |

**Paper-faithful details:**
- All weights initialised from Normal(0, 0.02); BatchNorm weights from Normal(1, 0.02) with zero bias (`weights_init`, `models.py:4`)
- No BatchNorm on the generator's output layer or the discriminator's input layer
- Strided convolutions instead of max-pooling; ReLU in G, LeakyReLU(0.2) in D
- Discriminator outputs raw logits and uses `BCEWithLogitsLoss` — mathematically equivalent to the paper's Sigmoid + BCE, but numerically safer

---

## 3. Training Methodology (`train.py`)

### Hyperparameters (baseline)

| Parameter | Value | Flag |
|---|---|---|
| Optimizer | Adam | — |
| Learning rate | 2e-4 | `--lr` |
| Adam β1 | 0.5 | `--beta1` |
| Batch size | 128 | `--batch-size` |
| Latent dim (nz) | 100 | `--nz` |
| Generator/Discriminator width | 64 | `--ngf` / `--ndf` |
| Epochs | 25 | `--epochs` |
| Seed | 42 | `--seed` |
| Loss | BCEWithLogitsLoss | — |

### Training techniques implemented

- **Alternating updates** — discriminator step first (real + fake batches, fake detached), then generator step (`train.py:117-137`)
- **Horizontal-flip augmentation** — 50% random flip of real images each batch (`train.py:114`)
- **Label smoothing** — optional, via `--label-smooth` (real label = 1 − value)
- **Mixed precision** — optional AMP with `torch.amp.GradScaler` via `--amp` to reduce VRAM use
- **Reproducibility** — Python, NumPy and PyTorch seeds all fixed to `--seed`
- **Checkpointing & resume** — `latest.pt` saved every epoch (models + optimizers + fixed noise + args), full resume via `--resume`; periodic snapshots every `--save-every` epochs
- **Per-epoch sample grids** — fixed noise batch rendered after each epoch to visually track progress
- **CSV loss logging** — `lossD`, `lossG`, `D(x)`, `D(G(z))` every 100 steps to `logs/<run>/losses.csv`
- **GPU-only training** — refuses to run on CPU with a clear diagnostic message (`train.py:39`)
- **Data pipeline** — entire dataset preloaded as uint8 tensors in CPU RAM, normalized on the fly to [-1, 1], transferred to GPU with `non_blocking=True`; `cudnn.benchmark` enabled

---

## 4. Data Pipeline (`prepare_data.py`)

1. Downloads CelebA or FFHQ from Kaggle via `kagglehub` (or uses a local folder via `--root`)
2. Recursively finds all JPG/JPEG/PNG images
3. Center-crops each image to a square, resizes to 64×64 with LANCZOS
4. Parallelized with an 8-worker `ThreadPoolExecutor`
5. Saves a single NumPy array `(N, 64, 64, 3)` uint8 to `data/<dataset>_64.npy`

Datasets (not included in the repo):
- CelebA — ~200K celebrity face images (non-commercial research use only)
- FFHQ — 52,001 high-quality faces at 1024×1024

---

## 5. Experiments & Results

Eight runs were executed on a single GPU with one fixed seed, varying one factor at a time against a 10-epoch baseline (`base_10ep`, FID 30.15):

| Run | Change vs Baseline | Epochs | Sec/Epoch | Final LossD | Final LossG | FID |
|---|---|---|---|---|---|---|
| celeba_baseline | Baseline (25 epochs) | 25 | 137.5s | 0.080 | 4.005 | **29.85** |
| base_10ep | Baseline for comparison | 10 | 138.4s | 0.321 | 2.955 | 30.15 |
| exp_nobn | No BatchNorm | 10 | 129.6s | 0.884 | 0.747 | 44.20 |
| exp_lr5e-4 | High LR (5e-4) | 10 | 141.4s | 1.128 | 2.146 | 32.28 |
| exp_beta0.9 | Adam beta1 = 0.9 | 10 | 140.5s | 0.125 | 7.147 | 148.64 |
| ffhq_baseline | FFHQ dataset | 10 | 35.0s | 0.456 | 3.876 | 94.39* |
| exp_w128 | Wider nets (ngf=128, ndf=128, batch=64) | 10 | 452.5s | 0.182 | 5.291 | **23.95** |
| exp_bs64 | Batch size 64, baseline width | 10 | 517.1s | 0.118 | 4.708 | 28.75 |

*FFHQ FID is measured against FFHQ images and is not directly comparable to the CelebA runs.

### Key findings

- **BatchNorm is essential** — removing it degraded FID from 30.15 → 44.20.
- **β1 = 0.5 is critical** — the paper's default β1 = 0.9 collapsed training (FID 148.64), the worst result by far.
- **Larger batch size helps most** — batch 64 improved FID to 28.75 at the same model width; wider networks (exp_w128) reached 23.95 but cost 3–4× more time per epoch, and its gain must be read alongside exp_bs64 since both width and batch changed.
- **Higher learning rate (5e-4) hurt** (FID 32.28) — 2e-4 remains the right choice.
- **More training helps modestly** — 25 epochs barely edged out 10 (29.85 vs 30.15), suggesting saturation near this FID level.

All results are single runs with one seed; small FID differences (a few points) may be noise.

![Final grid of generated faces](results/final_grid.png)

![Latent-space interpolation](results/interpolation.png)

---

## 6. Evaluation

### Quantitative: FID (`fid_eval.py`)
- Uses `torchmetrics.image.fid.FrechetInceptionDistance` with 2048-dim Inception features
- Compares 10,000 generated images against 10,000 real images, batched on GPU
- Best result: **FID 29.85** (25-epoch CelebA baseline), **23.95** (wider model)

### Memorization check: nearest-neighbour (`nn_check.py`)
- Generates 16 faces with a fixed seed and searches the full training set for each one's closest match under L2 distance
- Purpose: verifies the model generates novel faces rather than recalling training images

### Qualitative
- Loss-curve and discriminator-belief plots (`plot_results.py`)
- Epoch-by-epoch progress strips and animated GIFs of training
- Architecture, learning-rate/batch, width, and failure-case comparison figures
- Latent-space interpolation walks between two random noise points (paper Section 6)

---

## 7. Interfaces

### Interactive web demo (`demo_app.py`)
A Gradio app with two buttons — "Generate new face" and "Generate 16 faces":

```bash
python demo_app.py --ckpt weights/generator_celeba_dcgan.pt
```

Launches at `http://127.0.0.1:7860`. Runs on CPU or GPU.

### Command-line generation (`generate.py`)

```bash
# 64-face grid
python generate.py --ckpt weights/generator_celeba_dcgan.pt --mode grid --out results/generated.png

# Smooth interpolation between two noise points
python generate.py --ckpt weights/generator_celeba_dcgan.pt --mode interpolate --out results/interp.png
```

### Experiment automation
- `run_experiments.sh` — runs the full ablation suite, skipping runs whose sample outputs already exist (idempotent)
- `run_tasks.sh` — regenerates comparison figures and runs the nearest-neighbour check
- `finish_up.py` / `wrap_up.py` — orchestrate tasks and rebuild the summary table from logs

---

## 8. Repository Structure

```
├── models.py              # Generator & Discriminator definitions + weight init
├── train.py               # Training loop (AMP, resume, logging, checkpointing)
├── generate.py            # CLI: face grid and latent interpolation
├── demo_app.py            # Gradio web demo
├── prepare_data.py        # Kaggle download → center-crop → 64×64 .npy
├── fid_eval.py            # FID evaluation (torchmetrics)
├── nn_check.py            # Nearest-neighbour memorization check
├── plot_results.py        # Loss curves, comparisons, GIFs
├── check_gpu.py           # CUDA availability + matmul smoke test
├── finish_up.py           # Orchestrates final tasks and summary rebuild
├── wrap_up.py             # Inventory/checkpoint verification + summaries
├── run_experiments.sh     # Batch ablation runner (idempotent)
├── run_tasks.sh           # Figures + memorization check runner
├── weights/               # Pre-trained generator (generator_celeba_dcgan.pt, ~14 MB)
├── logs/                  # Per-run losses.csv (10 runs)
├── results/               # Grids, plots, GIFs, summary table
├── requirements.txt       # Python dependencies
└── README.md              # Full project documentation
```

---

## 9. Reproduction Steps

```bash
# 1. Install CUDA PyTorch from https://pytorch.org, then:
pip install -r requirements.txt

# 2. Verify the GPU
python check_gpu.py

# 3a. Run the demo with pre-trained weights
python demo_app.py --ckpt weights/generator_celeba_dcgan.pt

# 3b. Or train from scratch (requires Kaggle API token: kaggle.json)
python prepare_data.py --dataset celeba
python train.py --run-name celeba_baseline --epochs 25

# 4. Evaluate
python fid_eval.py --data data/celeba_64.npy --ckpt weights/generator_celeba_dcgan.pt
```

**Requirements:** NVIDIA GPU with CUDA for training (CPU is sufficient for the demo), Python 3.10+, ~16 GB RAM for the preprocessed CelebA array.

---

## 10. Limitations & Ethical Notes

- Output resolution is fixed at 64×64
- Single seed per experiment; small FID gaps may be noise
- Occasional distorted or artifacted faces
- CelebA-derived celebrity bias in generated faces
- **CelebA and the provided weights are for non-commercial research and education use only**
- All generated faces are synthetic; no real person is depicted
- **Security:** only load `.pt` checkpoint files from trusted sources

---

## 11. Reference

Radford, A., Metz, L., & Chintala, S. (2015). *Unsupervised Representation Learning with Deep Convolutional Generative Adversarial Networks.* arXiv:1511.06434.
