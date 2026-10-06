import torch.nn as nn


def weights_init(m):
    """Paper: initialise all weights from Normal(mean=0, std=0.02)."""
    name = m.__class__.__name__
    if "Conv" in name:
        nn.init.normal_(m.weight, 0.0, 0.02)
    elif "BatchNorm" in name:
        nn.init.normal_(m.weight, 1.0, 0.02)
        nn.init.zeros_(m.bias)


def _bn(channels, use_bn):
    return nn.BatchNorm2d(channels) if use_bn else nn.Identity()


class Generator(nn.Module):
    """noise (nz x 1 x 1) -> image (3 x 64 x 64), values in [-1, 1]."""

    def __init__(self, nz=100, ngf=64, nc=3, use_bn=True):
        super().__init__()
        self.net = nn.Sequential(
            # 1x1 -> 4x4
            nn.ConvTranspose2d(nz, ngf * 8, 4, 1, 0, bias=False),
            _bn(ngf * 8, use_bn), nn.ReLU(True),
            # 4x4 -> 8x8
            nn.ConvTranspose2d(ngf * 8, ngf * 4, 4, 2, 1, bias=False),
            _bn(ngf * 4, use_bn), nn.ReLU(True),
            # 8x8 -> 16x16
            nn.ConvTranspose2d(ngf * 4, ngf * 2, 4, 2, 1, bias=False),
            _bn(ngf * 2, use_bn), nn.ReLU(True),
            # 16x16 -> 32x32
            nn.ConvTranspose2d(ngf * 2, ngf, 4, 2, 1, bias=False),
            _bn(ngf, use_bn), nn.ReLU(True),
            # 32x32 -> 64x64 (no BatchNorm on the output layer)
            nn.ConvTranspose2d(ngf, nc, 4, 2, 1, bias=False),
            nn.Tanh(),
        )

    def forward(self, z):
        return self.net(z)


class Discriminator(nn.Module):
    """image (3 x 64 x 64) -> one logit per image (real vs fake).
    The paper ends with a Sigmoid; we output raw logits and use BCEWithLogitsLoss,
    which is mathematically the same but numerically safer."""

    def __init__(self, ndf=64, nc=3, use_bn=True):
        super().__init__()
        self.net = nn.Sequential(
            # 64 -> 32 (no BatchNorm on the input layer)
            nn.Conv2d(nc, ndf, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            # 32 -> 16
            nn.Conv2d(ndf, ndf * 2, 4, 2, 1, bias=False),
            _bn(ndf * 2, use_bn), nn.LeakyReLU(0.2, inplace=True),
            # 16 -> 8
            nn.Conv2d(ndf * 2, ndf * 4, 4, 2, 1, bias=False),
            _bn(ndf * 4, use_bn), nn.LeakyReLU(0.2, inplace=True),
            # 8 -> 4
            nn.Conv2d(ndf * 4, ndf * 8, 4, 2, 1, bias=False),
            _bn(ndf * 8, use_bn), nn.LeakyReLU(0.2, inplace=True),
            # 4 -> 1
            nn.Conv2d(ndf * 8, 1, 4, 1, 0, bias=False),
        )

    def forward(self, x):
        return self.net(x).view(-1)
