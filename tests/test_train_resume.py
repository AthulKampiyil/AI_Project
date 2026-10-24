import random
import tempfile
import unittest
from types import SimpleNamespace

import numpy as np
import torch

from train import _resume_config, _restore_rng_state, _rng_state


class TrainResumeTests(unittest.TestCase):
    def test_rng_state_round_trip_and_resume_config_guard(self):
        random.seed(17)
        np.random.seed(17)
        torch.manual_seed(17)
        saved_rng = _rng_state()
        expected = (random.random(), np.random.random(), torch.rand(1))
        with tempfile.NamedTemporaryFile() as checkpoint_file:
            torch.save({"rng_state": saved_rng}, checkpoint_file.name)
            loaded = torch.load(checkpoint_file.name, weights_only=True)
        _restore_rng_state(loaded["rng_state"])
        actual = (random.random(), np.random.random(), torch.rand(1))

        self.assertEqual(actual[0], expected[0])
        self.assertEqual(actual[1], expected[1])
        torch.testing.assert_close(actual[2], expected[2])

        args = SimpleNamespace(
            data="dataset.npy", batch_size=64, lr=2e-4, beta1=0.5, nz=100,
            ngf=64, ndf=64, no_bn=False, label_smooth=0.0, amp=False,
            seed=17, max_images=0,
        )
        config = _resume_config(args, "dataset-hash")
        self.assertEqual(_resume_config(args, "dataset-hash"), config)
        args.seed = 18
        self.assertNotEqual(_resume_config(args, "dataset-hash"), config)


if __name__ == "__main__":
    unittest.main()
