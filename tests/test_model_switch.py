import tempfile
import unittest
from unittest import mock

import torch
from fastapi import HTTPException
from PIL import Image
from torch import nn

import latent_ops
import main


class TinyGenerator(nn.Module):
    def __init__(self):
        super().__init__()
        self.weight = nn.Parameter(torch.tensor(1.0))

    def forward(self, z):
        value = (z[:, :1] * self.weight).tanh()
        return value.expand(-1, 3, 64, 64)


class ModelSwitchTests(unittest.TestCase):
    def test_legacy_and_new_models_never_load_vectors_or_enable_semantic_edits(self):
        for checkpoint in ("weights/generator_celeba_dcgan.pt", "candidate.pt"):
            with self.subTest(checkpoint=checkpoint):
                generator = TinyGenerator()
                with (
                    mock.patch.object(main, "CKPT_PATH", checkpoint),
                    mock.patch.object(main, "load_generator", return_value=(generator, 100)),
                    mock.patch.object(main.latent_ops, "load_attribute_vectors", side_effect=AssertionError("vectors must not load")),
                    mock.patch.object(main, "BENCHMARK_LATENCY_MS", 0.0),
                ):
                    main.load_model()

                self.assertFalse(generator.training)
                self.assertTrue(all(not parameter.requires_grad for parameter in generator.parameters()))
                self.assertFalse(main.health().sculptAvailable)
                self.assertEqual(main.health().modelId, checkpoint.split("/")[-1])
                response = main.sculpt(main.SculptRequest(seed=42))
                self.assertEqual(response.base, response.sculpted)
                with self.assertRaises(HTTPException) as error:
                    main.sculpt(main.SculptRequest(seed=42, smile=0.2))
                self.assertEqual(error.exception.status_code, 422)

    def test_invalid_explicit_checkpoint_clears_model_id_and_health(self):
        with (
            mock.patch.object(main, "CKPT_PATH", "/explicit/missing.pt"),
            mock.patch.object(main, "load_generator", side_effect=FileNotFoundError("missing")),
        ):
            main.load_model()

        status = main.health()
        self.assertFalse(status.weightsLoaded)
        self.assertIsNone(status.modelId)
        self.assertFalse(status.sculptAvailable)

    def test_missing_vectors_do_not_affect_legacy_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            generator = TinyGenerator()
            with (
                mock.patch.object(main, "CKPT_PATH", "weights/generator_celeba_dcgan.pt"),
                mock.patch.object(main, "load_generator", return_value=(generator, 100)),
                mock.patch.object(latent_ops.os.path, "exists", return_value=False),
                mock.patch.object(main, "BENCHMARK_LATENCY_MS", 0.0),
            ):
                main.load_model()
            self.assertTrue(main.health().weightsLoaded)
            self.assertFalse(main.health().sculptAvailable)
            response = main.sculpt(main.SculptRequest(seed=7))
            self.assertEqual(response.base, response.sculpted)

    def test_inversion_freezes_generator_but_returns_pure_final_mse(self):
        generator = TinyGenerator()
        target = Image.new("RGB", (64, 64), (128, 128, 128))
        _, _, z, _, final_mse = latent_ops.invert_face(generator, 100, "cpu", target, steps=1)

        self.assertFalse(generator.training)
        self.assertTrue(all(parameter.grad is None for parameter in generator.parameters()))
        with torch.no_grad():
            expected = torch.nn.functional.mse_loss(
                generator(z), torch.full((1, 3, 64, 64), 128 / 127.5 - 1)
            ).item()
        self.assertAlmostEqual(final_mse, expected)


if __name__ == "__main__":
    unittest.main()
