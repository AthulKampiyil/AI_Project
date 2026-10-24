import unittest

import torch

from fid_eval import make_batches, make_noise_generator, validate_eval_args, validate_real_count
from prepare_data import split_image_paths


class Stage1DataEvalTests(unittest.TestCase):
    def test_path_split_is_seeded_disjoint_and_complete(self):
        paths = [f"image-{i}.jpg" for i in range(20)]
        train, val = split_image_paths(paths, val_fraction=0.25, seed=7)

        self.assertEqual((train, val), split_image_paths(paths, val_fraction=0.25, seed=7))
        self.assertTrue(set(train).isdisjoint(val))
        self.assertEqual(set(train) | set(val), set(paths))
        self.assertEqual(len(val), 5)

    def test_path_split_rejects_impossible_parameters(self):
        with self.assertRaises(ValueError):
            split_image_paths(["only.jpg"])
        with self.assertRaises(ValueError):
            split_image_paths(["a.jpg", "b.jpg"], val_fraction=1)

    def test_fid_requires_positive_count_and_batch(self):
        for n, batch in ((0, 1), (1, 0), (-1, 2), (2, -1)):
            with self.subTest(n=n, batch=batch), self.assertRaises(ValueError):
                validate_eval_args(n, batch)

    def test_fid_batches_include_exact_partial_batch(self):
        self.assertEqual(list(make_batches(10, 4)), [4, 4, 2])
        self.assertEqual(sum(make_batches(10, 4)), 10)

    def test_fid_rejects_too_short_validation_data(self):
        with self.assertRaises(ValueError):
            validate_real_count(9, 10)
        validate_real_count(10, 10)

    def test_fake_noise_seed_is_repeatable(self):
        a = torch.randn(3, 5, generator=make_noise_generator("cpu", 13))
        b = torch.randn(3, 5, generator=make_noise_generator("cpu", 13))
        self.assertTrue(torch.equal(a, b))


if __name__ == "__main__":
    unittest.main()
