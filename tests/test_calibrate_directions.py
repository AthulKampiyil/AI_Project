import unittest

import torch
from torch import nn

from calibrate_directions import ATTRIBUTES, calibrate, fit_direction, render_triplets
from latent_ops import project_to_sphere


class TinyGenerator(nn.Module):
    def forward(self, z):
        return z[:, :1].tanh().expand(-1, 3, 64, 64)


class CalibrationTests(unittest.TestCase):
    def test_fit_orients_direction_toward_positive_scores(self):
        z = torch.arange(60, dtype=torch.float32).reshape(20, 3) / 10
        scores = z[:, 1] * 2 - z[:, 0]
        direction = fit_direction(z, scores)
        x = (z - z.mean(0)) / z.std(0, unbiased=False).clamp_min(1e-6)
        self.assertGreater(torch.dot(x @ direction, scores - scores.mean()), 0)
        self.assertAlmostEqual(float(direction.norm()), 1.0, places=6)

    def test_calibration_is_deterministic_and_uses_runtime_sphere_projection(self):
        generator = TinyGenerator()

        def scorer(images):
            # Every mocked prompt pair has a deterministic preference for channel intensity.
            return images[:, 0, 0, 0, None].expand(-1, len(ATTRIBUTES))

        results = [calibrate(generator, 3, scorer, torch.device("cpu"), 16, 4, 5, seed=19) for _ in range(2)]
        _, test, directions, report = results[0]
        self.assertTrue(torch.equal(test, results[1][1]))
        for key in ATTRIBUTES:
            self.assertTrue(torch.equal(directions[key], results[1][2][key]))
            self.assertGreaterEqual(report[key]["proxy_win_rate"], 0)
            self.assertIn("cross_attribute_drift", report[key])
        z = test[0].view(3, 1, 1)
        edited = project_to_sphere(z + directions["smile"].view(3, 1, 1), z)
        self.assertAlmostEqual(float(edited.norm()), float(z.norm()), places=5)

    def test_triplet_sheet_images_are_seed_major_across_batches(self):
        generator = TinyGenerator()
        seeds = torch.tensor([[0.2, 0.3, 0.4], [1.0, 0.1, 0.5], [0.4, 0.7, 0.2]])
        direction = torch.tensor([1.0, 0.0, 0.0])
        actual = render_triplets(generator, seeds, direction, 3, torch.device("cpu"), strength=0.5, batch=2)
        expected = []
        for seed in seeds:
            base = seed.view(1, 3, 1, 1)
            for sign in (-1, 0, 1):
                z = base if sign == 0 else project_to_sphere(base + sign * 0.5 * direction.view(1, 3, 1, 1), base)
                expected.append(generator(z)[0])
        self.assertTrue(torch.equal(actual, torch.stack(expected)))


if __name__ == "__main__":
    unittest.main()
