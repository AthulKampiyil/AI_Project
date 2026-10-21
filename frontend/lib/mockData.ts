// Procedural SVG Face Generator for zero-dependency realistic mock mode
export function generateMockFaceSvg(
  seed: number,
  params: { smile?: number; pose?: number; hair?: number; light?: number } = {},
  size: number = 384
): string {
  const smile = params.smile ?? 0;
  const pose = params.pose ?? 0;
  const hair = params.hair ?? 0;
  const light = params.light ?? 0;

  // Pseudorandom based on seed
  const s = Math.abs(seed);
  const hue = (s * 37) % 360;
  const skinToneBase = 20 + ((s * 13) % 25);
  const skinSat = 45 + ((s * 7) % 30);
  const skinLight = Math.max(15, Math.min(85, 55 + (s % 20) + light * 15));
  const skinColor = `hsl(${skinToneBase}, ${skinSat}%, ${skinLight}%)`;
  const skinShadow = `hsl(${skinToneBase}, ${skinSat + 10}%, ${Math.max(10, skinLight - 20)}%)`;

  // Pose offset
  const headShiftX = pose * 18;
  const eyeShiftX = pose * 12;

  // Smile mouth curve: smile > 0 curves down in SVG path for mouth arc
  const mouthCurveY = 245 + smile * 18;
  const mouthOpen = Math.max(2, smile * 8);

  // Hair style
  const hairHue = (s * 41) % 60;
  const hairColor = hair > 0.3 ? `hsl(${hairHue}, 35%, 20%)` : `hsl(${hairHue}, 20%, 35%)`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width="${size}" height="${size}">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="hsl(${hue}, 40%, 25%)" />
        <stop offset="100%" stop-color="#0a0c14" />
      </radialGradient>
      <radialGradient id="faceShine" cx="${50 + pose * 15}%" cy="${40 - light * 10}%" r="45%">
        <stop offset="0%" stop-color="rgba(255,255,255,${Math.max(0.1, 0.25 + light * 0.15)})" />
        <stop offset="100%" stop-color="rgba(0,0,0,0)" />
      </radialGradient>
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0.05 0"/>
        <feComposite operator="in" in2="SourceGraphic"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="384" height="384" fill="url(#bgGrad)" />

    <!-- Shoulders -->
    <path d="M 70 384 C 70 310, 140 280, 192 280 C 244 280, 314 310, 314 384 Z" fill="hsl(${(hue + 180) % 360}, 25%, 18%)" />

    <!-- Neck -->
    <rect x="160" y="230" width="64" height="60" rx="8" fill="${skinShadow}" />

    <!-- Hair Back -->
    <ellipse cx="${192 + headShiftX * 0.5}" cy="170" rx="${hair > 0 ? 100 : 85}" ry="${hair > 0 ? 120 : 95}" fill="${hairColor}" />

    <!-- Head / Face -->
    <ellipse cx="${192 + headShiftX}" cy="180" rx="72" ry="92" fill="${skinColor}" />
    <ellipse cx="${192 + headShiftX}" cy="180" rx="72" ry="92" fill="url(#faceShine)" />

    <!-- Hair Front Top -->
    <path d="M ${110 + headShiftX} 160 Q ${192 + headShiftX} ${80 - hair * 15} ${274 + headShiftX} 160 Q ${192 + headShiftX} 120 ${110 + headShiftX} 160 Z" fill="${hairColor}" />

    <!-- Eyes -->
    <g transform="translate(${eyeShiftX}, 0)">
      <!-- Left Eye -->
      <ellipse cx="162" cy="170" rx="14" ry="8" fill="#ffffff" />
      <circle cx="${162 + pose * 4}" cy="170" r="5" fill="#2d3748" />
      <circle cx="${160 + pose * 4}" cy="168" r="1.5" fill="#ffffff" />
      <path d="M 148 158 Q 162 153 176 158" stroke="#1a202c" stroke-width="3" fill="none" stroke-linecap="round" />

      <!-- Right Eye -->
      <ellipse cx="222" cy="170" rx="14" ry="8" fill="#ffffff" />
      <circle cx="${222 + pose * 4}" cy="170" r="5" fill="#2d3748" />
      <circle cx="${220 + pose * 4}" cy="168" r="1.5" fill="#ffffff" />
      <path d="M 208 158 Q 222 153 236 158" stroke="#1a202c" stroke-width="3" fill="none" stroke-linecap="round" />
    </g>

    <!-- Nose -->
    <path d="M ${192 + headShiftX * 0.8} 175 L ${189 + headShiftX} 205 Q ${192 + headShiftX} 210 ${198 + headShiftX} 205" stroke="${skinShadow}" stroke-width="2.5" fill="none" stroke-linecap="round" />

    <!-- Mouth / Smile -->
    <path d="M ${166 + headShiftX} 240 Q ${192 + headShiftX} ${mouthCurveY} ${218 + headShiftX} 240" stroke="#742a2a" stroke-width="${3 + mouthOpen * 0.3}" fill="${smile > 0.4 ? "#ffffff" : "none"}" stroke-linecap="round" />

    <!-- Micro-details: Specimen HUD Overlay -->
    <text x="14" y="368" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.4)">DCGAN-64 [SEED:${seed}]</text>
    <text x="310" y="368" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.4)">z:100D</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const HERO_PRESETS = [
  { id: "757", name: "Clear Male", seed: 757, tag: "Clear Male", desc: "Short dark hair, sharp masculine contours" },
  { id: "979", name: "Smiling Male", seed: 979, tag: "Smiling Male", desc: "Expressive smile, dark hair, studio backdrop" },
  { id: "333", name: "Clear Female", seed: 333, tag: "Clear Female", desc: "Frontal gaze, high clarity studio portrait" },
  { id: "42", name: "Warm Smile", seed: 42, tag: "Warm Smile", desc: "Blonde hair, warm smile, balanced lighting" },
  { id: "114", name: "Classic Contrast", seed: 114, tag: "Classic Contrast", desc: "Sharp eyes and lips, brunette curls" },
];

export const MOCK_EXPERIMENTS = [
  { run_name: "celeba_baseline", change: "Baseline (25 epochs)", epochs: 25, sec_per_epoch: 137.5, loss_d: 0.080, loss_g: 4.005, fid: 29.85 },
  { run_name: "base_10ep", change: "Baseline for comparison", epochs: 10, sec_per_epoch: 138.4, loss_d: 0.321, loss_g: 2.955, fid: 30.15 },
  { run_name: "exp_nobn", change: "No BatchNorm", epochs: 10, sec_per_epoch: 129.6, loss_d: 0.884, loss_g: 0.747, fid: 44.20 },
  { run_name: "exp_lr5e-4", change: "High LR (5e-4)", epochs: 10, sec_per_epoch: 141.4, loss_d: 1.128, loss_g: 2.146, fid: 32.28 },
  { run_name: "exp_beta0.9", change: "Adam beta1=0.9", epochs: 10, sec_per_epoch: 140.5, loss_d: 0.125, loss_g: 7.147, fid: 148.64 },
  { run_name: "ffhq_baseline", change: "FFHQ dataset", epochs: 10, sec_per_epoch: 35.0, loss_d: 0.456, loss_g: 3.876, fid: 94.39 },
  { run_name: "exp_w128", change: "Wider networks (ngf=128, ndf=128, batch=64)", epochs: 10, sec_per_epoch: 452.5, loss_d: 0.182, loss_g: 5.291, fid: 23.95 },
  { run_name: "exp_bs64", change: "Batch size 64, same width as baseline", epochs: 10, sec_per_epoch: 517.1, loss_d: 0.118, loss_g: 4.708, fid: 28.75 },
];

export const MOCK_PLOTS = [
  { id: "celeba_baseline_curves", title: "CelebA Baseline Loss Curves", filename: "celeba_baseline_curves.png", desc: "L_D vs L_G over 25 epochs showing healthy adversarial equilibrium." },
  { id: "exp_nobn_curves", title: "Ablation: No BatchNorm Loss Curves", filename: "exp_nobn_curves.png", desc: "Discriminator loss collapses and Generator loss explodes without batch normalization." },
  { id: "exp_beta0.9_curves", title: "Ablation: Adam Beta1=0.9 Loss Curves", filename: "exp_beta0.9_curves.png", desc: "Higher momentum creates oscillations and destabilizes training." },
  { id: "compare_lr_beta", title: "Learning Rate & Momentum Grid Comparison", filename: "compare_lr_beta.png", desc: "Visual matrix across LR (2e-4 vs 5e-4) and Beta1 (0.5 vs 0.9)." },
  { id: "compare_width_vs_batch", title: "Network Width vs Batch Size", filename: "compare_width_vs_batch.png", desc: "Comparing baseline vs wider networks (ngf=128, ndf=128) vs batch size 64." },
  { id: "compare_failures", title: "Failure Mode Analysis (Mode Collapse & Artifacts)", filename: "compare_failures.png", desc: "Analysis of pathological DCGAN failure modes across unstable configurations." },
  { id: "celeba_baseline_epoch_strip", title: "Evolution Strip (Epoch 1 to 25)", filename: "celeba_baseline_epoch_strip.png", desc: "Progressive facial emergence across 25 training epochs." }
];

export const MOCK_KPIS = {
  best_fid: 23.95,
  total_epochs: 95,
  avg_sec_per_epoch: 211.5,
  params_g: "3,576,704",
  params_d: "2,765,568"
};

// Synthetic loss series for the loss curves chart
export const MOCK_LOSS_CURVES = Array.from({ length: 25 }, (_, i) => {
  const epoch = i + 1;
  const raw_ld = 0.5 * Math.exp(-epoch / 8) + 0.08 + Math.sin(epoch * 1.5) * 0.03;
  const raw_lg = 2.0 + 2.0 * (1 - Math.exp(-epoch / 6)) + Math.cos(epoch * 1.5) * 0.2;
  return {
    epoch,
    loss_d: parseFloat(raw_ld.toFixed(3)),
    loss_g: parseFloat(raw_lg.toFixed(3)),
    loss_d_ema: parseFloat((0.45 * Math.exp(-epoch / 9) + 0.08).toFixed(3)),
    loss_g_ema: parseFloat((2.0 + 2.0 * (1 - Math.exp(-epoch / 7))).toFixed(3)),
  };
});
