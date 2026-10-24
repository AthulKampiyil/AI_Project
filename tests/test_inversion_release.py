import asyncio
import io
import math
import threading
import unittest
from unittest import mock

import numpy as np
import torch
from fastapi import HTTPException, UploadFile
from PIL import Image
from torch import nn

import latent_ops
import main


class SyntheticGenerator(nn.Module):
    def forward(self, z):
        return z[:, :1].tanh().expand(-1, 3, 64, 64)


def upload(data, filename="image.png"):
    return UploadFile(filename=filename, file=io.BytesIO(data))


class InversionReleaseTests(unittest.TestCase):
    def test_generated_target_keeps_or_improves_best_candidate_with_finite_true_mse(self):
        generator = SyntheticGenerator()
        with torch.no_grad():
            target = latent_ops.tensor_to_pil(generator(torch.tensor([[[[0.7]]]]))[0], size=None, enhance=False)

        _, _, z, initial, final = latent_ops.invert_face(generator, 1, "cpu", target, steps=20)
        pixels = torch.from_numpy(np.array(target.convert("RGB"), dtype="float32"))
        expected_target = pixels.permute(2, 0, 1).unsqueeze(0) / 127.5 - 1
        with torch.no_grad():
            expected = torch.nn.functional.mse_loss(generator(z), expected_target).item()

        self.assertTrue(math.isfinite(initial) and math.isfinite(final))
        self.assertLessEqual(final, initial)
        self.assertAlmostEqual(final, expected)

    def test_api_rejects_oversized_and_invalid_uploads(self):
        with mock.patch.object(main, "MODEL_LOADED", True):
            with mock.patch.object(main, "MAX_INVERSION_UPLOAD_BYTES", 8):
                with self.assertRaises(HTTPException) as error:
                    asyncio.run(main.invert(upload(b"x" * 9)))
                self.assertEqual(error.exception.status_code, 413)

            with mock.patch.object(main, "MAX_INVERSION_UPLOAD_BYTES", 1024):
                with self.assertRaises(HTTPException) as error:
                    asyncio.run(main.invert(upload(b"not an image")))
                self.assertEqual(error.exception.status_code, 400)

                unsupported = io.BytesIO()
                Image.new("RGB", (2, 2)).save(unsupported, format="GIF")
                with self.assertRaises(HTTPException) as error:
                    asyncio.run(main.invert(upload(unsupported.getvalue(), "image.gif")))
                self.assertEqual(error.exception.status_code, 415)

    def test_api_rejects_excessive_decoded_pixels(self):
        data = io.BytesIO()
        Image.new("RGB", (4, 4)).save(data, format="PNG")
        with (
            mock.patch.object(main, "MODEL_LOADED", True),
            mock.patch.object(main, "MAX_INVERSION_PIXELS", 15),
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(main.invert(upload(data.getvalue())))
        self.assertEqual(error.exception.status_code, 413)

    def test_api_runs_inversion_off_event_loop_thread(self):
        data = io.BytesIO()
        Image.new("RGB", (4, 4)).save(data, format="PNG")
        image = Image.new("RGB", (4, 4))
        caller_thread = threading.get_ident()
        inference_threads = []

        def fake_invert(*args, **kwargs):
            inference_threads.append(threading.get_ident())
            return image, image, None, 0.2, 0.1

        async def request():
            with (
                mock.patch.object(main, "MODEL_LOADED", True),
                mock.patch.object(main.latent_ops, "invert_face", side_effect=fake_invert),
            ):
                return await main.invert(upload(data.getvalue()), iterations=35)

        response = asyncio.run(request())
        self.assertEqual(set(response), {"target", "twin", "mseInitial", "mseFinal"})
        self.assertNotEqual(inference_threads[0], caller_thread)


if __name__ == "__main__":
    unittest.main()
