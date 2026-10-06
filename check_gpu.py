import sys
import torch

print("PyTorch:", torch.__version__, "| built for CUDA:", torch.version.cuda)

if not torch.cuda.is_available():
    print("ERROR: no CUDA GPU visible to PyTorch.")
    print("Most likely you installed the CPU-only PyTorch build. Redo Step 3.3.")
    sys.exit(1)

props = torch.cuda.get_device_properties(0)
print("GPU:", props.name)
print(f"VRAM: {props.total_memory / 1024**3:.1f} GB")

x = torch.randn(2000, 2000, device="cuda")
y = (x @ x).sum().item()
print("GPU matmul test OK:", y != 0)
print("GPU OK")
