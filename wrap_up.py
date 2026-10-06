import os
import subprocess
import pandas as pd
import torch
from torchvision.utils import make_grid
from torchvision.transforms.functional import to_pil_image
import shutil

runs = [
    ("celeba_baseline", 25, "Baseline (25 epochs)"),
    ("base_10ep", 10, "Baseline for comparison"),
    ("exp_nobn", 10, "No BatchNorm"),
    ("exp_lr5e-4", 10, "High LR (5e-4)"),
    ("exp_beta0.9", 10, "Adam beta1=0.9"),
    ("ffhq_baseline", 10, "FFHQ dataset"),
    ("exp_w128", 10, "Wider networks (ngf=128, ndf=128, batch=64)"),
    ("exp_lr1e-4", 10, "Low LR (1e-4)"),
    ("smoke_test", 1, "Smoke test")
]

inventory_lines = []
summary_rows = []

for run, expected_epochs, desc in runs:
    if not os.path.isdir(f"checkpoints/{run}"): continue
    
    sample_file = f"samples/{run}/epoch_{expected_epochs:03d}.png"
    sample_exists = os.path.exists(sample_file)
    ckpt_file = f"checkpoints/{run}/latest.pt"
    ckpt_exists = os.path.exists(ckpt_file)
    
    losses_file = f"logs/{run}/losses.csv"
    final_lossD, final_lossG = "N/A", "N/A"
    sec_per_epoch = "N/A"
    epochs_done = 0
    if os.path.exists(losses_file):
        try:
            df = pd.read_csv(losses_file)
            if len(df) > 0:
                final_lossD = f"{df['lossD'].iloc[-1]:.3f}"
                final_lossG = f"{df['lossG'].iloc[-1]:.3f}"
                epochs_done = df['epoch'].max()
            
            times = []
            for e in range(1, epochs_done + 1):
                f = f"samples/{run}/epoch_{e:03d}.png"
                if os.path.exists(f):
                    times.append(os.path.getmtime(f))
            if len(times) >= 2:
                diffs = [times[i] - times[i-1] for i in range(1, len(times))]
                diffs = [d for d in diffs if d < 3600]
                if diffs:
                    sec_per_epoch = f"{sum(diffs)/len(diffs):.1f}s"
        except Exception as e:
            pass

    inventory_lines.append(f"Run: {run} | Sample {expected_epochs} exists: {sample_exists} | latest.pt exists: {ckpt_exists} | Est. sec/epoch: {sec_per_epoch}")
    
    summary_rows.append({
        "Run": run,
        "Change": desc,
        "Epochs": epochs_done,
        "Sec/Epoch": sec_per_epoch,
        "Loss D": final_lossD,
        "Loss G": final_lossG,
        "FID": "N/A"
    })

inventory_lines.append("\nFiles in results/:")
for f in os.listdir("results"):
    inventory_lines.append(f" - {f}")

print("\n".join(inventory_lines))

fid_runs = ["celeba_baseline", "base_10ep", "exp_nobn", "exp_lr5e-4", "exp_beta0.9", "exp_w128", "ffhq_baseline"]
fids = {}

with open("results/fid_raw.txt", "w") as f:
    for run in fid_runs:
        if not os.path.exists(f"checkpoints/{run}/latest.pt"):
            print(f"Skipping FID for {run}, missing checkpoint")
            continue
        
        cmd = ["python", "fid_eval.py", "--ckpt", f"checkpoints/{run}/latest.pt"]
        if run == "ffhq_baseline":
            cmd = ["python", "fid_eval.py", "--data", "data/ffhq_64.npy", "--ckpt", f"checkpoints/{run}/latest.pt"]
        
        try:
            print(f"Running FID for {run}...")
            out = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
            f.write(out)
            fid_val = out.strip().split()[-1]
            fids[run] = fid_val
        except subprocess.CalledProcessError as e:
            err = f"FID for {run} failed:\n{e.output}"
            f.write(err + "\n")
            fids[run] = "Error"
            print(err)

for r in summary_rows:
    if r["Run"] in fids:
        r["FID"] = fids[r["Run"]]

with open("results/summary_table.md", "w") as f:
    f.write("| Run Name | Change vs Baseline | Epochs | Sec/Epoch | Final LossD | Final LossG | FID |\n")
    f.write("|---|---|---|---|---|---|---|\n")
    for r in summary_rows:
        if r["Run"] in ["smoke_test", "exp_lr1e-4"]: continue
        f.write(f"| {r['Run']} | {r['Change']} | {r['Epochs']} | {r['Sec/Epoch']} | {r['Loss D']} | {r['Loss G']} | {r['FID']} |\n")
    f.write("\n*Note: FID for ffhq_baseline is measured against FFHQ images and is not directly comparable to the CelebA runs.*\n")

from generate import load_generator
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Demo Check Device: {device}")
G, nz = load_generator("checkpoints/celeba_baseline/latest.pt", device)
with torch.no_grad():
    x = G(torch.randn(16, nz, 1, 1, device=device)).cpu()
grid = make_grid(x, nrow=4, normalize=True, value_range=(-1, 1))
img = to_pil_image(grid)
img.save("results/demo_check_grid.png")
print("Saved demo_check_grid.png")

os.makedirs("backup", exist_ok=True)
os.makedirs("backup/checkpoints/celeba_baseline", exist_ok=True)
shutil.copy("checkpoints/celeba_baseline/latest.pt", "backup/checkpoints/celeba_baseline/latest.pt")
shutil.copytree("results", "backup/results", dirs_exist_ok=True)
shutil.copytree("logs", "backup/logs", dirs_exist_ok=True)
shutil.copytree("samples", "backup/samples", dirs_exist_ok=True)

shutil.make_archive("backup", "zip", "backup")
size_mb = os.path.getsize("backup.zip") / (1024*1024)
print(f"Backup created: backup.zip ({size_mb:.2f} MB), Path: {os.path.abspath('backup.zip')}")
