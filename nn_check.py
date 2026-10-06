import torch
import numpy as np
from torchvision.transforms.functional import to_pil_image
from PIL import Image
import os

from generate import load_generator

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Load generator
    G, nz = load_generator("checkpoints/celeba_baseline/latest.pt", device)
    
    # 2. Generate 16 faces with fixed seed
    torch.manual_seed(0)
    with torch.no_grad():
        z = torch.randn(16, nz, 1, 1, device=device)
        generated = G(z) # shape (16, 3, 64, 64), range [-1, 1]
    
    # 3. Load training data
    print("Loading data...")
    # shape (N, 64, 64, 3), dtype uint8
    real_data = np.load("data/celeba_64.npy", mmap_mode="r")
    N = real_data.shape[0]
    
    # 4. Find nearest neighbor
    # We will compute L2 distance.
    # Gen is (16, 3, 64, 64) in [-1, 1]
    # Real is (N, 64, 64, 3) in [0, 255]
    
    # To save VRAM, process real data in chunks
    chunk_size = 10000
    
    # Reshape gen to (16, 3*64*64)
    gen_flat = generated.view(16, -1)
    
    min_dists = torch.full((16,), float('inf'), device=device)
    best_indices = torch.zeros((16,), dtype=torch.long, device=device)
    
    print("Finding nearest neighbors...")
    for i in range(0, N, chunk_size):
        end = min(N, i + chunk_size)
        
        # Load chunk into memory, normalize to [-1, 1], shape (batch, 3, 64, 64)
        chunk_numpy = np.array(real_data[i:end]).copy()
        chunk_tensor = torch.from_numpy(chunk_numpy).permute(0, 3, 1, 2).contiguous().to(device)
        chunk_tensor = chunk_tensor.float().div_(127.5).sub_(1.0)
        
        # Flatten to (batch, 3*64*64)
        chunk_flat = chunk_tensor.view(chunk_tensor.size(0), -1)
        
        # Compute L2 distance squared: ||a - b||^2 = ||a||^2 + ||b||^2 - 2<a,b>
        # (16, D) and (B, D) -> dists (16, B)
        # We can just do torch.cdist(gen_flat, chunk_flat)
        dists = torch.cdist(gen_flat, chunk_flat, p=2)
        
        # Find min in this chunk
        chunk_min_dists, chunk_best_idx = dists.min(dim=1)
        
        # Update global min
        update_mask = chunk_min_dists < min_dists
        min_dists[update_mask] = chunk_min_dists[update_mask]
        best_indices[update_mask] = chunk_best_idx[update_mask] + i
        
    print("Nearest neighbor distances:")
    for j in range(16):
        print(f"Face {j}: {min_dists[j].item():.4f}")
        
    # 5. Save results/nn_check.png with 16 rows
    # Generated on left, nearest real on right
    # (16, 2, 3, 64, 64)
    
    out_images = []
    for j in range(16):
        # Gen
        g_img = generated[j].cpu()
        # Real
        idx = best_indices[j].item()
        r_numpy = np.array(real_data[idx]).copy()
        r_tensor = torch.from_numpy(r_numpy).permute(2, 0, 1).float().div_(127.5).sub_(1.0)
        
        out_images.append(g_img)
        out_images.append(r_tensor)
        
    out_tensor = torch.stack(out_images) # (32, 3, 64, 64)
    from torchvision.utils import make_grid
    
    # nrow=2 means 2 columns: left (gen), right (real). 16 rows.
    grid = make_grid(out_tensor, nrow=2, normalize=True, value_range=(-1, 1))
    
    os.makedirs("results", exist_ok=True)
    img = to_pil_image(grid)
    img.save("results/nn_check.png")
    print("Saved results/nn_check.png")

if __name__ == "__main__":
    main()
