import json


SUMMARY_PATH = "results/experiment_summary.json"
OUTPUT_PATH = "results/results.json"

with open(SUMMARY_PATH, "r", encoding="utf-8") as f:
    summary = json.load(f)

experiments = summary["experiments"]
valid_fids = [
    item["fid"] for item in experiments
    if "ffhq" not in item["run_name"] and isinstance(item.get("fid"), (int, float))
]
valid_epochs = [item["epochs"] for item in experiments if isinstance(item.get("epochs"), int)]
valid_sec_per_epoch = [
    item["sec_per_epoch"] for item in experiments
    if isinstance(item.get("sec_per_epoch"), (int, float))
]

data = {
    "experiments": experiments,
    "plots": summary.get("plots", []),
    "kpis": {
        "best_fid": min(valid_fids) if valid_fids else None,
        "total_epochs": sum(valid_epochs),
        "avg_sec_per_epoch": round(sum(valid_sec_per_epoch) / len(valid_sec_per_epoch), 1)
        if valid_sec_per_epoch else None,
        "params_g": "3,576,704",
        "params_d": "2,765,568",
    },
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")

print(f"Exported {OUTPUT_PATH} successfully!")
