import os
import subprocess
import pandas as pd
import time

def main():
    print("Running tasks...")
    subprocess.run(["chmod", "+x", "run_tasks.sh"])
    subprocess.run(["./run_tasks.sh"], check=True)
    
    print("Tasks finished. Updating summary table...")
    
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

    # 2. Update table
    table_path = "results/summary_table.md"
    with open(table_path, "r") as f:
        content = f.read()
    
    # Insert row before the Note
    row = f"| {run} | batch size 64, same width as baseline | {epochs_done} | {sec_per_epoch} | {final_lossD} | {final_lossG} | {fid_val} |\n"
    
    parts = content.split("\n*Note: ")
    new_table = parts[0] + "\n" + row + "\n*Note: " + parts[1]
    
    # Add notes
    notes = (
        "- FFHQ dataset contains 52,001 images.\n"
        "- exp_w128 changed both the width and the batch size (64), so its gain over base_10ep cannot be credited to width alone; compare it with exp_bs64.\n"
        "- Every result is a single run with one random seed, so small FID differences (a few points) may be noise.\n"
    )
    new_table += "\n" + notes
    
    with open(table_path, "w") as f:
        f.write(new_table)
        
    print("Table updated!")
    print(f"exp_bs64 FID: {fid_val}")
    print(f"exp_bs64 LossD: {final_lossD}, LossG: {final_lossG}, Sec/epoch: {sec_per_epoch}")
    
    # Print new files
    print("\nNew files in results/:")
    for f in sorted(os.listdir("results")):
        print(f" - {f}")
    
if __name__ == "__main__":
    main()
