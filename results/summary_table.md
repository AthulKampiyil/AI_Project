| Run Name | Change vs Baseline | Epochs | Sec/Epoch | Final LossD | Final LossG | FID |
|---|---|---|---|---|---|---|
| celeba_baseline | Baseline (25 epochs) | 25 | 137.5s | 0.080 | 4.005 | 29.85 |
| base_10ep | Baseline for comparison | 10 | 138.4s | 0.321 | 2.955 | 30.15 |
| exp_nobn | No BatchNorm | 10 | 129.6s | 0.884 | 0.747 | 44.20 |
| exp_lr5e-4 | High LR (5e-4) | 10 | 141.4s | 1.128 | 2.146 | 32.28 |
| exp_beta0.9 | Adam beta1=0.9 | 10 | 140.5s | 0.125 | 7.147 | 148.64 |
| ffhq_baseline | FFHQ dataset | 10 | 35.0s | 0.456 | 3.876 | 94.39 |
| exp_w128 | Wider networks (ngf=128, ndf=128, batch=64) | 10 | 452.5s | 0.182 | 5.291 | 23.95 |

| exp_bs64 | batch size 64, same width as baseline | 10 | 517.1s | 0.118 | 4.708 | 28.75 |

*Note: FID for ffhq_baseline is measured against FFHQ images and is not directly comparable to the CelebA runs.*

- FFHQ dataset contains 52,001 images.
- exp_w128 changed both the width and the batch size (64), so its gain over base_10ep cannot be credited to width alone; compare it with exp_bs64.
- Every result is a single run with one random seed, so small FID differences (a few points) may be noise.
