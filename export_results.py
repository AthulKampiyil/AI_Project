import os
import json
import re

summary_path = "results/summary_table.md"
with open(summary_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

experiments = []
for line in lines:
    line = line.strip()
    if not line.startswith("|") or "Run Name" in line or "---" in line:
        continue
    parts = [p.strip() for p in line.split("|")[1:-1]]
    if len(parts) >= 7:
        run_name = parts[0]
        change = parts[1]
        epochs = int(parts[2]) if parts[2].isdigit() else parts[2]
        sec_epoch = float(parts[3].replace("s", "")) if "s" in parts[3] else float(parts[3])
        loss_d = float(parts[4])
        loss_g = float(parts[5])
        fid = float(parts[6])
        experiments.append({
            "run_name": run_name,
            "change": change,
            "epochs": epochs,
            "sec_per_epoch": sec_epoch,
            "loss_d": loss_d,
            "loss_g": loss_g,
            "fid": fid
        })

plots = [
    {"id": "celeba_baseline_curves", "title": "CelebA Baseline Loss Curves", "filename": "celeba_baseline_curves.png", "desc": "L_D vs L_G over 25 epochs showing healthy adversarial equilibrium."},
    {"id": "exp_nobn_curves", "title": "Ablation: No BatchNorm Loss Curves", "filename": "exp_nobn_curves.png", "desc": "Discriminator loss collapses and Generator loss explodes without batch normalization."},
    {"id": "exp_beta0.9_curves", "title": "Ablation: Adam Beta1=0.9 Loss Curves", "filename": "exp_beta0.9_curves.png", "desc": "Higher momentum creates oscillations and destabilizes training."},
    {"id": "compare_lr_beta", "title": "Learning Rate & Momentum Grid Comparison", "filename": "compare_lr_beta.png", "desc": "Visual matrix across LR (2e-4 vs 5e-4) and Beta1 (0.5 vs 0.9)."},
    {"id": "compare_width_vs_batch", "title": "Network Width vs Batch Size", "filename": "compare_width_vs_batch.png", "desc": "Comparing baseline vs wider networks (ngf=128, ndf=128) vs batch size 64."},
    {"id": "compare_failures", "title": "Failure Mode Analysis (Mode Collapse & Artifacts)", "filename": "compare_failures.png", "desc": "Analysis of pathological DCGAN failure modes across unstable configurations."},
    {"id": "celeba_baseline_epoch_strip", "title": "Evolution Strip (Epoch 1 to 25)", "filename": "celeba_baseline_epoch_strip.png", "desc": "Progressive facial emergence across 25 training epochs."}
]

kpis = {
    "best_fid": min(e["fid"] for e in experiments if "ffhq" not in e["run_name"]),
    "total_epochs": sum(e["epochs"] for e in experiments if isinstance(e["epochs"], int)),
    "avg_sec_per_epoch": round(sum(e["sec_per_epoch"] for e in experiments) / len(experiments), 1),
    "params_g": "3,576,704",
    "params_d": "2,765,568"
}

data = {
    "experiments": experiments,
    "plots": plots,
    "kpis": kpis
}

with open("results/results.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Exported results/results.json successfully!")
