#!/bin/bash
source .venv/bin/activate
set -e

# 1. base_10ep
if [ ! -f samples/base_10ep/epoch_010.png ]; then
    echo "Running base_10ep"
    python train.py --run-name base_10ep --epochs 10 --resume
fi

# 2. exp_nobn
if [ ! -f samples/exp_nobn/epoch_010.png ]; then
    echo "Running exp_nobn"
    python train.py --run-name exp_nobn --epochs 10 --no-bn --resume
fi

# 3. exp_lr5e-4
if [ ! -f samples/exp_lr5e-4/epoch_010.png ]; then
    echo "Running exp_lr5e-4"
    python train.py --run-name exp_lr5e-4 --epochs 10 --lr 5e-4 --resume
fi

# 4. exp_beta0.9
if [ ! -f samples/exp_beta0.9/epoch_010.png ]; then
    echo "Running exp_beta0.9"
    python train.py --run-name exp_beta0.9 --epochs 10 --beta1 0.9 --resume
fi

# 5. ffhq_baseline
if [ ! -f samples/ffhq_baseline/epoch_010.png ]; then
    if [ ! -f data/ffhq_64.npy ]; then
        echo "Preparing FFHQ data"
        python prepare_data.py --dataset ffhq
    fi
    echo "Running ffhq_baseline"
    python train.py --run-name ffhq_baseline --data data/ffhq_64.npy --epochs 10 --resume
fi

# 6. exp_w128 (last)
if [ ! -f samples/exp_w128/epoch_010.png ]; then
    echo "Running exp_w128"
    set +e
    python train.py --run-name exp_w128 --epochs 10 --ngf 128 --ndf 128 --batch-size 64 --resume
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "exp_w128 failed. Likely OOM. Retrying with --amp"
        python train.py --run-name exp_w128 --epochs 10 --ngf 128 --ndf 128 --batch-size 64 --amp --resume
    fi
    set -e
fi

echo "Plotting Results"
python plot_results.py --run exp_nobn --epochs 1 5 10
python plot_results.py --compare base_10ep exp_lr5e-4 exp_beta0.9 --name compare_lr_beta
python plot_results.py --compare base_10ep exp_nobn exp_w128 --name compare_arch

echo "All Done!"
