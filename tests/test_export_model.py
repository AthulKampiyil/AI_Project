import tempfile
import unittest
from pathlib import Path
from unittest import mock

import torch

from export_model import export_checkpoint
from generate import load_generator
from models import Generator


class ExportModelTests(unittest.TestCase):
    def test_export_is_weights_only_safe_and_generates_matching_outputs(self):
        torch.manual_seed(42)
        generator = Generator(nz=8, ngf=4, use_bn=True).eval()
        checkpoint = {
            "args": {"nz": 8, "ngf": 4, "no_bn": False, "unneeded": "discard me"},
            "netG": generator.state_dict(),
            "netD": {"unused": torch.ones(1)},
        }
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "training.pt"
            exported = Path(directory) / "generator.pt"
            torch.save(checkpoint, source)
            with mock.patch("export_model.torch.load", wraps=torch.load) as load:
                export_checkpoint(source, exported)
            load.assert_called_once_with(source, map_location="cpu", weights_only=True)

            loaded = torch.load(exported, map_location="cpu", weights_only=True)
            self.assertEqual(set(loaded), {"args", "netG"})
            self.assertEqual(loaded["args"], {"nz": 8, "ngf": 4, "no_bn": False})
            loaded_generator, nz = load_generator(exported, "cpu")
            noise = torch.randn(3, nz, 1, 1)
            with torch.no_grad():
                expected = generator(noise)
                actual = loaded_generator(noise)
            torch.testing.assert_close(actual, expected, rtol=0, atol=0)
            self.assertLess(exported.stat().st_size, 100 * 1024 * 1024)

    def test_export_refuses_to_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "training.pt"
            output = Path(directory) / "generator.pt"
            torch.save({"args": {}, "netG": {}}, source)
            output.write_bytes(b"keep")
            with self.assertRaises(FileExistsError):
                export_checkpoint(source, output)
            self.assertEqual(output.read_bytes(), b"keep")

    def test_selected_checkpoint_export_matches_when_available(self):
        source = Path(__file__).resolve().parents[1] / "checkpoints/celeba_w128_seed42/epoch_020.pt"
        if not source.is_file():
            self.skipTest(f"selected checkpoint is unavailable: {source}")

        with tempfile.TemporaryDirectory() as directory:
            exported = Path(directory) / "generator.pt"
            export_checkpoint(source, exported)
            original_generator, nz = load_generator(source, "cpu")
            exported_generator, exported_nz = load_generator(exported, "cpu")
            self.assertEqual(exported_nz, nz)
            torch.manual_seed(42)
            noise = torch.randn(2, nz, 1, 1)
            with torch.no_grad():
                torch.testing.assert_close(
                    exported_generator(noise), original_generator(noise), rtol=0, atol=0
                )


if __name__ == "__main__":
    unittest.main()
