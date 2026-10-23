import os
import subprocess
import pandas as pd
import json


SUMMARY_PATH = "results/experiment_summary.json"


def update_experiment_summary(summary_path, experiment):
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    experiments = summary.setdefault("experiments", [])
    for index, current in enumerate(experiments):
        if current.get("run_name") == experiment["run_name"]:
            experiments[index] = {**current, **experiment}
            break
    else:
        experiments.append(experiment)

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
        f.write("\n")

def main():
    print("Running tasks...")
    subprocess.run(["chmod", "+x", "run_tasks.sh"])
    subprocess.run(["./run_tasks.sh"], check=True)
    
    print("Tasks finished. Updating experiment summary...")
    
    # 1. Parse exp_bs64 log and FID
    run = "exp_bs64"
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
            print("Error parsing logs:", e)
            
    fid_val = "N/A"
    with open("results/fid_raw.txt", "r") as f:
        lines = f.readlines()
        for i in range(len(lines)-1, -1, -1):
            if "FID (checkpoints/exp_bs64/latest.pt):" in lines[i]:
                fid_val = lines[i].strip().split()[-1]
                break

    update_experiment_summary(SUMMARY_PATH, {
        "run_name": run,
        "change": "batch size 64, same width as baseline",
        "epochs": int(epochs_done),
        "sec_per_epoch": float(sec_per_epoch.removesuffix("s")) if sec_per_epoch != "N/A" else None,
        "loss_d": float(final_lossD) if final_lossD != "N/A" else None,
        "loss_g": float(final_lossG) if final_lossG != "N/A" else None,
        "fid": float(fid_val) if fid_val not in ("N/A", "Error") else None,
    })
        
    print("Experiment summary updated!")
    print(f"exp_bs64 FID: {fid_val}")
    print(f"exp_bs64 LossD: {final_lossD}, LossG: {final_lossG}, Sec/epoch: {sec_per_epoch}")
    
    # Print new files
    print("\nNew files in results/:")
    for f in sorted(os.listdir("results")):
        print(f" - {f}")
    
if __name__ == "__main__":
    main()
