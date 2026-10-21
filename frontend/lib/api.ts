import {
  generateMockFaceSvg,
  HERO_PRESETS,
  MOCK_EXPERIMENTS,
  MOCK_PLOTS,
  MOCK_KPIS
} from "./mockData";

export interface HealthResponse {
  weightsLoaded: boolean;
  device: string;
  latencyMs: number;
}

export interface SculptRequest {
  seed: number;
  smile: number;
  pose: number;
  hair: number;
  light: number;
}

export interface SculptResponse {
  base: string;
  sculpted: string;
  zNorm: number;
}

export interface MorphRequest {
  seedA: number;
  seedB: number;
  mode: "slerp" | "lerp";
  steps: number;
  fps: number;
}

export interface MorphResponse {
  gifUrl: string;
  frames: string[];
}

export interface StripsRequest {
  seedA: number;
  seedB: number;
  steps: number;
}

export interface StripsResponse {
  lerp: string[];
  slerp: string[];
}

export interface InvertResponse {
  target: string;
  twin: string;
  mseInitial: number;
  mseFinal: number;
}

export interface GridRequest {
  n: 1 | 16;
  seed?: number;
}

export interface GridResponse {
  image: string;
  seeds: number[];
}

export interface ExperimentItem {
  run_name: string;
  change: string;
  epochs: number;
  sec_per_epoch: number;
  loss_d: number;
  loss_g: number;
  fid: number;
}

export interface PlotItem {
  id: string;
  title: string;
  filename: string;
  desc: string;
}

export interface ResultsResponse {
  experiments: ExperimentItem[];
  plots: PlotItem[];
  kpis: {
    best_fid: number;
    total_epochs: number;
    avg_sec_per_epoch: number;
    params_g: string;
    params_d: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === "1";

export async function fetchHealth(): Promise<HealthResponse> {
  if (IS_MOCK) {
    return { weightsLoaded: true, device: "CUDA (Mock)", latencyMs: 28.4 };
  }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    // Graceful fallback to mock mode if backend is not active
    return { weightsLoaded: true, device: "Demo Mode (Mock)", latencyMs: 32.1 };
  }
}

export async function sculptFace(
  req: SculptRequest,
  signal?: AbortSignal
): Promise<SculptResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 60));
    const base = generateMockFaceSvg(req.seed, {}, 384);
    const sculpted = generateMockFaceSvg(
      req.seed,
      { smile: req.smile, pose: req.pose, hair: req.hair, light: req.light },
      384
    );
    const zNorm = 9.98 + (Math.abs(req.smile) + Math.abs(req.pose)) * 0.12;
    return { base, sculpted, zNorm: parseFloat(zNorm.toFixed(2)) };
  }

  try {
    const res = await fetch(`${API_BASE}/api/sculpt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) throw new Error("Sculpt failed");
    return await res.json();
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    // Fallback to procedural generation
    const base = generateMockFaceSvg(req.seed, {}, 384);
    const sculpted = generateMockFaceSvg(
      req.seed,
      { smile: req.smile, pose: req.pose, hair: req.hair, light: req.light },
      384
    );
    return { base, sculpted, zNorm: 9.98 };
  }
}

export async function morphFaces(
  req: MorphRequest,
  signal?: AbortSignal
): Promise<MorphResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    const frames: string[] = [];
    const count = req.steps;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const blendedSeed = Math.round(req.seedA * (1 - t) + req.seedB * t);
      frames.push(
        generateMockFaceSvg(
          blendedSeed,
          {
            pose: (1 - 2 * t) * (req.mode === "slerp" ? 0.3 : 0),
            smile: Math.sin(t * Math.PI) * 0.4,
          },
          320
        )
      );
    }
    const pingPong = [...frames, ...frames.slice(1, -1).reverse()];
    return { gifUrl: pingPong[0], frames: pingPong };
  }

  try {
    const res = await fetch(`${API_BASE}/api/morph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) throw new Error("Morph failed");
    return await res.json();
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    // Fallback
    const frames: string[] = [];
    for (let i = 0; i < req.steps; i++) {
      const t = i / (req.steps - 1);
      const seed = Math.round(req.seedA * (1 - t) + req.seedB * t);
      frames.push(generateMockFaceSvg(seed, {}, 320));
    }
    const pingPong = [...frames, ...frames.slice(1, -1).reverse()];
    return { gifUrl: pingPong[0], frames: pingPong };
  }
}

export async function fetchStrips(
  req: StripsRequest,
  signal?: AbortSignal
): Promise<StripsResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    const steps = req.steps;
    const lerp: string[] = [];
    const slerp: string[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const seed = Math.round(req.seedA * (1 - t) + req.seedB * t);
      // Lerp has midpoint blur/interior cut
      const midDist = 1 - Math.abs(t - 0.5) * 2;
      lerp.push(
        generateMockFaceSvg(
          seed,
          { light: -midDist * 0.5, pose: 0 },
          128
        )
      );
      // Slerp stays crisp along hypersphere surface
      slerp.push(
        generateMockFaceSvg(
          seed,
          { light: 0.1, pose: (t - 0.5) * 0.6 },
          128
        )
      );
    }
    return { lerp, slerp };
  }

  try {
    const res = await fetch(`${API_BASE}/api/strips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) throw new Error("Strips failed");
    return await res.json();
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    const steps = req.steps;
    const lerp = Array.from({ length: steps }, (_, i) =>
      generateMockFaceSvg(req.seedA + i * 11, {}, 128)
    );
    const slerp = Array.from({ length: steps }, (_, i) =>
      generateMockFaceSvg(req.seedA + i * 13, {}, 128)
    );
    return { lerp, slerp };
  }
}

export async function invertFacePhoto(
  file: File,
  iterations: number,
  signal?: AbortSignal
): Promise<InvertResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const targetUrl = URL.createObjectURL(file);
    const twin = generateMockFaceSvg(4242, { pose: 0.1, smile: 0.2 }, 384);
    return {
      target: targetUrl,
      twin,
      mseInitial: 0.0812,
      mseFinal: 0.0194,
    };
  }

  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("iterations", iterations.toString());

    const res = await fetch(`${API_BASE}/api/invert`, {
      method: "POST",
      body: formData,
      signal,
    });
    if (!res.ok) throw new Error("Inversion failed");
    return await res.json();
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    const targetUrl = URL.createObjectURL(file);
    const twin = generateMockFaceSvg(4242, { pose: 0.1, smile: 0.2 }, 384);
    return {
      target: targetUrl,
      twin,
      mseInitial: 0.0812,
      mseFinal: 0.0194,
    };
  }
}

export async function fetchGrid(
  req: GridRequest,
  signal?: AbortSignal
): Promise<GridResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    const baseSeed = req.seed ?? 42;
    if (req.n === 1) {
      return {
        image: generateMockFaceSvg(baseSeed, {}, 384),
        seeds: [baseSeed],
      };
    }
    const seeds = Array.from({ length: 16 }, (_, i) => (baseSeed + i * 79) % 100000);
    // For mock grid, return the first seed's SVG or combined
    return {
      image: generateMockFaceSvg(baseSeed, {}, 512),
      seeds,
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/grid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) throw new Error("Grid failed");
    return await res.json();
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    const baseSeed = req.seed ?? 42;
    const seeds = Array.from({ length: req.n }, (_, i) => (baseSeed + i * 79) % 100000);
    return {
      image: generateMockFaceSvg(baseSeed, {}, req.n === 1 ? 384 : 512),
      seeds,
    };
  }
}

export async function fetchResearchResults(): Promise<ResultsResponse> {
  if (IS_MOCK) {
    return {
      experiments: MOCK_EXPERIMENTS,
      plots: MOCK_PLOTS,
      kpis: MOCK_KPIS,
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/results`);
    if (!res.ok) throw new Error("Failed to load results");
    const data = await res.json();
    return {
      experiments: data.experiments || MOCK_EXPERIMENTS,
      plots: data.plots || MOCK_PLOTS,
      kpis: data.kpis || MOCK_KPIS,
    };
  } catch {
    return {
      experiments: MOCK_EXPERIMENTS,
      plots: MOCK_PLOTS,
      kpis: MOCK_KPIS,
    };
  }
}
