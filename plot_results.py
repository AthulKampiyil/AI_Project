import argparse
import glob
import os

import imageio.v2 as imageio
import matplotlib.pyplot as plt
import pandas as pd
from PIL import Image

os.makedirs("results", exist_ok=True)


def smooth(s, w=20):
    return s.rolling(w, min_periods=1).mean()


def plot_curves(run):
    df = pd.read_csv(f"logs/{run}/losses.csv")
    fig, ax = plt.subplots(1, 2, figsize=(13, 4))
    ax[0].plot(df["step"], smooth(df["lossD"]), label="Discriminator loss")
    ax[0].plot(df["step"], smooth(df["lossG"]), label="Generator loss")
    ax[0].set_title(f"Losses ({run})"); ax[0].set_xlabel("training step"); ax[0].legend()
    ax[1].plot(df["step"], smooth(df["D_x"]), label="D(real)")
    ax[1].plot(df["step"], smooth(df["D_G_z"]), label="D(fake)")
    ax[1].set_title("Discriminator's belief that an image is real"); ax[1].set_xlabel("training step"); ax[1].legend()
    plt.tight_layout()
    plt.savefig(f"results/{run}_curves.png", dpi=150)
    plt.close()


def plot_epoch_strip(run, epochs):
    paths = [(e, f"samples/{run}/epoch_{e:03d}.png") for e in epochs]
    paths = [(e, p) for e, p in paths if os.path.exists(p)]
    fig, ax = plt.subplots(1, len(paths), figsize=(4 * len(paths), 4.4))
    if len(paths) == 1:
        ax = [ax]
    for a, (e, p) in zip(ax, paths):
        a.imshow(Image.open(p)); a.set_title(f"Epoch {e}"); a.axis("off")
    plt.tight_layout()
    plt.savefig(f"results/{run}_epoch_strip.png", dpi=150)
    plt.close()


def make_gif(run):
    files = sorted(glob.glob(f"samples/{run}/epoch_*.png"))
    frames = [imageio.imread(f) for f in files]
    imageio.mimsave(f"results/{run}_progress.gif", frames, duration=0.5)


def compare_runs(runs, name="comparison"):
    fig, ax = plt.subplots(1, len(runs), figsize=(4 * len(runs), 4.4))
    if len(runs) == 1:
        ax = [ax]
    for a, run in zip(ax, runs):
        files = sorted(glob.glob(f"samples/{run}/epoch_*.png"))
        a.imshow(Image.open(files[-1])); a.set_title(run, fontsize=9); a.axis("off")
    plt.tight_layout()
    plt.savefig(f"results/{name}.png", dpi=150)
    plt.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--run", help="make curves, epoch strip and GIF for one run")
    p.add_argument("--epochs", type=int, nargs="+", default=[1, 2, 5, 10, 25])
    p.add_argument("--compare", nargs="+", help="runs to compare side by side")
    p.add_argument("--name", default="comparison")
    a = p.parse_args()
    if a.run:
        plot_curves(a.run); plot_epoch_strip(a.run, a.epochs); make_gif(a.run)
    if a.compare:
        compare_runs(a.compare, a.name)
    print("Saved figures in results/")
