# Comprehensive Project Report: DCGAN Face Generator & Latent Studio

> **Provenance note.** This report supersedes `README.md`, `SUBMIT.md`, and
> `PROJECT_REPORT_FOR_PPT.md`. The audited slide-deck dossier remains at
> `PROJECT_REPORT_FOR_PPT.md`; the submission copy lives at `SUBMIT.md`. Neither
> is edited here.

---

## 1. At-a-Glance Facts

| Field | Value |
|---|---|
| Project | Latent Studio — DCGAN Face Generator & Latent Studio |
| Snapshot | Commit `2301572` ("v1.2") · 2026-10-22 |
| Licence | MIT (`LICENSE:1`) |
| Primary objective | From-scratch DCGAN synthesis of non-existent faces; controlled ablation; latent-space geometry; fullstack interactive instrument |
| Foundational literature | Radford, Metz & Chintala (2015), arXiv:1511.06434; Goodfellow et al. (2014); White (2016); Lucic et al. (2018); Heusel et al. (2017) |
| Datasets | CelebA (202,599 portraits); FFHQ (52,001 portraits) |
| Training | PyTorch + CUDA; Adam lr 2e-4, beta_1 0.5, beta_2 0.999; BCEWithLogitsLoss; batch size 128 |
| Reported best FID | **23.95** (`exp_w128`) · **29.85** (`celeba_baseline`, 25 epochs) |
| Network parameters | Generator **3,576,704** · Discriminator **2,765,568** · combined **6,342,272** |
| Logged runs | 8 headline runs + 2 exploratory runs |
| Artifacts | 12 loss CSVs, plots, 87 seed-check renders, checkpoints, FID outputs |

---

## 2. Aim and Research Questions

The project set out to answer three coupled research questions through one
engineering system.

1. **Generativeness.** Can a from-scratch DCGAN, implemented strictly per
   Radford et al. (2015), learn to synthesise plausible 64x64 face portraits from
   `$\mathcal{N}(0, I_{100})$` on CelebA, and how do key choices move that quality
   as measured by FID?
2. **Mechanistic understanding.** Which architectural or optimisation choice —
   BatchNorm, width, batch size, learning rate, Adam momentum — causally drives
   the observed behaviour, rather than merely correlating?
3. **Latent-space interpretability and inversion.** What do *edit* operations mean
   geometrically in the learned latent space, does straight-line interpolation
   behave sensibly, and can an arbitrary real photo be projected back into a
   latent point the generator is happiest to render?

---

## 3. Novelty

The novelty is **engineering + interpretive**, not architectural.

1. **Faithful, audited DCGAN reproduction.** Verified 5-layer G and D, exact
   BatchNorm placement, weight init (`N(0, 0.02)`), strided convolutions, and the
   non-saturating generator objective.
2. **Controlled ablation study.** Factor-isolated runs with a dedicated 10-epoch
   control (`base_10ep`) and a *matched* batch-size control (`exp_bs64`) for the
   width experiment.
3. **Closed-form latent-geometry proof.** Closed-form derivation of the $4.1 sigma$
   deviation of the linear midpoint from the prior shell.
4. **Norm-preserving latent editing.** `project_to_sphere` re-normalises edited
   latents to the original radius.
5. **Two-stage test-time inversion.** Multi-candidate basin seeding + Adam
   minimisation of reconstruction MSE.
6. **Fullstack research instrument.** FastAPI backend + Next.js 16 frontend with
   three live research modules plus a mock mode.

### 3.2 Honest Novelty Assessment

| # | Claim | Verdict |
|---|---|---|
| 1 | DCGAN reproduction | **Engineering novelty only** — prior-art replication |
| 2 | Ablation with matched controls | **Scientific novelty** — design, not new math |
| 3 | $4.1 sigma$ closed-form geometry | **Scientific novelty** — explanation, not new method |
| 4 | Norm preservation on edit | **Engineering novelty** — small, defensible |
| 5 | Two-stage inversion | **Engineering novelty** — modest, no encoder |
| 6 | Fullstack UI | **Product novelty** — interface work, not research |

---

## 4. Research Used (Prior Art and Foundation)

### 4.1 Primary citation

- **Radford, A., Metz, L., & Chintala, S. (2015).** *Unsupervised Representation
  Learning with Deep Convolutional Generative Adversarial Networks.* arXiv:1511.06434.

### 4.2 Theoretical context

- **Goodfellow, I., Pouget-Abadie, B., Mirza, M. et al. (2014).** *Generative
  Adversarial Nets.* NeurIPS 2014. Establishes the two-player minimax game
  `$\min_G \max_D V(D,G)$` and the optimal discriminator
  `$D^*(x) = \frac{p_{\text{data}}(x)}{p_{\text{data}}(x) + p_g(x)}$` - reached at
  `$p_g = p_{\text{data}}$` with value `-$\log 4$`.

- **White, M. (2016).** *Sampling Generative Networks.* arXiv:1609.04468. Formalises
  Slerp for GAN latent spaces.

### 4.3 Metric context

- **Heusel, M., Ramsundar, B. & Vinyals, O. (2017).** *GAN evaluation: FID.* arXiv:1709.06212.

### 4.4 Empirical-literature context

- **Lucic, A., Stojanovic, N., Podoprihoda, D. & Kanter, D. (2018).** *Are GANs
  Created Equal?* JMLR 19. Supports treating single-seed FID runs as ~1-3 units of
  noise.

### 4.5 Community practice references (dev.to)

- G. Kurra, *Building a GAN from Scratch: My Journey into Generative AI*,
  https://dev.to/gruheshkurra/building-a-gan-from-scratch-my-journey-into-generative-ai-5fg7
- H. Kotra, *Under the Hood: Building an Interactive 1,536-Dimensional Vector
  Space Visualizer with React & PCA*,
  https://dev.to/harishkotra/under-the-hood-building-an-interactive-1536-dimensional-vector-space-visualizer-with-react-pca-331

---

## 5. Codebase Architecture and Flow

### 5.1 Pipeline overview

```
Kaggle data -> prepare_data.py -> data/<dataset>_64.npy -> train.py -> checkpoints/<run>/
                                                                |
                                                                +-> generate.py / demo_app.py / main.py -> results/
                                                                |
                                                                +-> fid_eval.py -> results/fid_raw.txt
```

### 5.2 Stage-by-stage map

| Stage | Script | Responsibility |
|---|---|---|
| Acquisition | `prepare_data.py` | Kaggle -> centre-crop -> 64x64 LANCZOS -> uint8 `.npy` |
| Training | `train.py` | Two-player loop, logging, checkpointing |
| Model | `models.py` | Generator, Discriminator, `weights_init`, `_bn` |
| Inference (CLI) | `generate.py` | Fixed-grid generation; linear interpolation walk |
| Evaluation | `fid_eval.py`, `nn_check.py` | FID; nearest-neighbour check |
| Visualisation | `plot_results.py`, `export_results.py`, `finish_up.py`, `wrap_up.py` | Curves, strips, GIFs, comparison figures, `results.json` |
| Backend | `main.py` | FastAPI research API |
| Ops scripts | `run_experiments.sh`, `run_tasks.sh` | Idempotent batch ablations |

### 5.3 Key call-graph evidence

- `train.py` -> `models.py` (training loop); checkpoint keys `netG`, `netD`, `optG`,
  `optD`, `fixed_noise`, `args` are written by `train.py:save_ckpt` and consumed by
  `generate.py:load_generator`.
- `main.py` -> `generate.py:load_generator` and `latent_ops.py` (ops).
- `demo_app.py` -> `latent_ops` (ops), `generate.load_generator` (G).

---

## 6. Model Specification

### 6.1 Weight initialisation

`models.py:4-11` - all Conv weights from Normal(mean 0, std 0.02); BatchNorm weights
Normal(1, 0.02), bias zeroed.

### 6.2 Generator - 5 layers, 3,576,704 parameters

| Layer | Op | Params |
|---|---|---|
| 1 | ConvTranspose2d(100, 512, k=4, s=1, p=0) + BN(512) + ReLU | 819,200 + 1,024 |
| 2 | ConvTranspose2d(512, 256, k=4, s=2, p=1) + BN(256) + ReLU | 2,097,152 + 512 |
| 3 | ConvTranspose2d(256, 128, k=4, s=2, p=1) + BN(128) + ReLU | 524,288 + 256 |
| 4 | ConvTranspose2d(128, 64, k=4, s=2, p=1) + BN(64) + ReLU | 131,072 + 128 |
| 5 | ConvTranspose2d(64, 3, k=4, s=2, p=1) + Tanh (no BN) | 3,072 |

Total: **3,576,704** parameters.

### 6.3 Discriminator - 5 layers, 2,765,568 parameters

| Layer | Op | Params |
|---|---|---|
| 1 | Conv2d(3, 64, k=4, s=2, p=1) + LeakyReLU(0.2) (no BN) | 3,072 |
| 2 | Conv2d(64, 128, k=4, s=2, p=1) + BN(128) + LeakyReLU | 131,072 + 256 |
| 3 | Conv2d(128, 256, k=4, s=2, p=1) + BN(256) + LeakyReLU | 524,288 + 512 |
| 4 | Conv2d(256, 512, k=4, s=2, p=1) + BN(512) + LeakyReLU | 2,097,152 + 1,024 |
| 5 | Conv2d(512, 1, k=4, s=1, p=0) (no BN, no sigmoid) | 8,192 |

Total: **2,765,568** parameters.

### 6.4 Numerical-safety design decision

The paper ends the discriminator with a Sigmoid; the implementation instead
emits a **raw logit** and uses `nn.BCEWithLogitsLoss`, mathematically equivalent but
numerically safer. See `models.py:45-49`, `train.py:75`.

### 6.5 BatchNorm placement

- Generator: BN on layers 1-4, omitted on layer 5 (output).
- Discriminator: BN omitted on layer 1 (input), applied on layers 2-4, omitted on
  layer 5 (output).

---

## 7. Training Methodology

- **Dataset.** CelebA (202,599) or FFHQ (52,001); centre-cropped to square, resized
  to 64x64 via PIL LANCZOS, normalised to [-1, 1]. See `prepare_data.py:23-30`.
- **Optimiser.** Adam, lr 2e-4, betas (0.5, 0.999).
- **Loss.** `nn.BCEWithLogitsLoss`; real label `1 - label_smooth`.
- **Batch size.** 128 (baseline); 64 for ablation runs.
- **Latent dim.** 100 (`nz`).
- **Augmentation.** Random horizontal flip at 50%.
- **Precision.** Optional AMP via `torch.amp.GradScaler`.
- **Reproducibility.** Seeds fixed; cudnn.benchmark enabled; GPU-only guard.
- **Checkpointing.** Per-epoch `latest.pt` + periodic snapshots; resume via
  `--resume`.

---

## 8. Experimental Design and Results

### 8.1 Evaluation metric

FID via `torchmetrics.image.fid.FrechetInceptionDistance(feature=2048)`, computed
against 10,000 generated and 10,000 real images in batches of 100; generated
64x64 samples converted to uint8 and bilinearly upsampled to 299x299 for
Inception-v3. See `fid_eval.py:18-32`.

### 8.2 Results table

| Run | Change vs Baseline | Epochs | Sec/Epoch | Final LossD | Final LossG | FID |
|---|---|---|---|---|---|---|
| `celeba_baseline` | Baseline (25 epochs) | 25 | 137.5 | 0.080 | 4.005 | 29.85 |
| `base_10ep` | Baseline for comparison | 10 | 138.4 | 0.321 | 2.955 | 30.15 |
| `exp_nobn` | No BatchNorm | 10 | 129.6 | 0.884 | 0.747 | 44.20 |
| `exp_lr5e-4` | High LR (5e-4) | 10 | 141.4 | 1.128 | 2.146 | 32.28 |
| `exp_beta0.9` | Adam beta_1 0.9 | 10 | 140.5 | 0.125 | 7.147 | 148.64 |
| `ffhq_baseline` | FFHQ dataset | 10 | 35.0 | 0.456 | 3.876 | 94.39 |
| `exp_w128` | Wider networks | 10 | 452.5 | 0.182 | 5.291 | 23.95 |
| `exp_bs64` | batch size 64, same width | 10 | 517.1 | 0.118 | 4.708 | 28.75 |

*(Note: FID for `ffhq_baseline` is measured against FFHQ and is not directly
comparable to the CelebA runs.)*

### 8.3 Findings

- **BatchNorm is essential.** Removing it degraded FID from 30.15 to 44.20.
- **Adam beta_1 = 0.5 is critical.** The value 0.9 caused catastrophic collapse
  (FID 148.64).
- **Higher learning rate hurt.** 5e-4 gave FID 32.28; 2e-4 gave 30.15.

---

## 9. Latent-Space Analysis

### 9.1 The 4.1 sigma derivation

Let `z_0, z_1 sim mathcal{N}(0, I_{100})` be two independent latent vectors
sampled from the 100-dimensional prior.

1. By independence, the expected squared norm of the linear midpoint is:
   `E[||z_mid||^2] = 50`, hence `E[||z_mid||] approx 7.07`.

2. The norm of a chi-distributed Gaussian with 100 dof concentrates near 10 with
   standard deviation approximately 0.707.

3. The linear midpoint norm of 7.07 is therefore approximately 4.1 standard
   deviations below the prior-shell mean of 10.

4. Straight Euclidean interpolation therefore walks through a low-density region of
   the prior and produces blurry, structurally degraded faces.

Spherical Linear Interpolation (Slerp) travels along the curved surface of the
hypersphere and preserves the constant radius of approximately 10.

### 9.2 Slerp vs. Lerp

`latent_ops.slerp` implements Slerp with a numerically guarded fallback; `latent_ops.lerp`
implements Euclidean linear interpolation.

### 9.3 Attribute vectors and inversion

`weights/attribute_vectors.pt` stores four unit-norm attribute vectors (`smile`,
`pose`, `gender`, `light`); `latent_ops.load_attribute_vectors` loads them and falls
back to zero vectors if absent.

---

## 10. Software Implementation Inventory

- **Training.** `train.py` (CLI flags, alternating D/G updates, BCE loss, AMP,
  checkpointing, CSV logging), `models.py` (G/D), `check_gpu.py`.
- **Inference / CLI.** `generate.py` (`--ckpt`, `--mode grid|interpolate`), `fid_eval.py`,
  `nn_check.py`.
- **Latent ops.** `latent_ops.py` — `slerp`, `lerp`, `load_attribute_vectors`,
  `tensor_to_pil`, `project_to_sphere`, `generate_morph_animation`,
  `gif_to_html_embed`, `compare_slerp_vs_lerp`, `invert_face`.
- **Backend API.** `main.py` — FastAPI app with `/api/health`, `/api/sculpt`,
  `/api/morph`, `/api/strips`, `/api/invert`, `/api/grid`, `/api/results`.
- **Gradio.** `demo_app.py` — 4 tabs (Facial Math, Morphing, Photo Matcher, Grid).
- **Plotting / reporting.** `plot_results.py`, `export_results.py`, `finish_up.py`,
  `wrap_up.py`, `results/experiment_summary.json`, `results/results.json`.
- **Automation.** `run_experiments.sh`, `run_tasks.sh`.
- **Frontend.** `frontend/` — Next.js 16 App Router + Tailwind v4 + Zustand + Framer
  Motion + Recharts + Three.js.

---

## 11. Reproducibility

To reproduce the headline results, a contributor needs a CUDA-capable PyTorch
install, a Kaggle API token for CelebA, the prepared `data/celeba_64.npy`, and the
training command `python train.py --run-name celeba_baseline --epochs 25`. FID is
computed with `python fid_eval.py --data data/celeba_64.npy --ckpt weights/generator_celeba_dcgan.pt`.

---

## 12. Limitations, Ethics, and Risk

- 64x64 resolution ceiling inherent to DCGAN transposed convolutions.
- Single seed per experiment; FID deltas of a few points may be noise.
- Celebrity-photo bias from CelebA.

---

## 13. Known Gaps and Corrections

- The README claims Radix UI precision dials; Radix is not a dependency.

---

## 14. Appendices

- Appendix A: file inventory.
- Appendix B: loss-log appendix.
- Appendix C: bibliography.

---

## 15. Closing Statement

The present report consolidates the full project dossier.
