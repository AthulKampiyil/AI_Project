#!/bin/bash
source .venv/bin/activate
set -e

# Task 3: Extra figures
python plot_results.py --run exp_beta0.9 --epochs 1 5 10
python plot_results.py --run exp_bs64 --epochs 1 5 10
python plot_results.py --compare base_10ep exp_bs64 exp_w128 --name compare_width_vs_batch
python plot_results.py --compare celeba_baseline exp_nobn exp_lr5e-4 exp_beta0.9 --name compare_failures

ls -l results/

# Task 5: Nearest neighbor check
python nn_check.py
