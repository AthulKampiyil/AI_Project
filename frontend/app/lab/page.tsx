"use client";

import React, { useState, useEffect } from "react";
import { fetchResearchResults, ResultsResponse, ExperimentItem, PlotItem } from "@/lib/api";
import { MOCK_LOSS_CURVES } from "@/lib/mockData";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  FlaskConical,
  Activity,
  Layers,
  ArrowUpDown,
  Maximize2,
  X,
  Cpu,
  Boxes,
  Sparkles,
} from "lucide-react";

export default function LabPage() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string>("celeba_baseline");
  const [useEma, setUseEma] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof ExperimentItem>("fid");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [activeLightboxPlot, setActiveLightboxPlot] = useState<PlotItem | null>(null);

  useEffect(() => {
    fetchResearchResults().then((res) => setData(res));
  }, []);

  const experiments = data?.experiments || [];
  const plots = data?.plots || [];
  const kpis = data?.kpis || {
    best_fid: 23.95,
    total_epochs: 95,
    avg_sec_per_epoch: 211.5,
    params_g: "3,576,704",
    params_d: "2,765,568",
  };

  // Sort experiments
  const sortedExperiments = [...experiments].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof ExperimentItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Prepare FID Bar Chart data sorted ascending
  const fidBarData = [...experiments]
    .filter((e) => !e.run_name.includes("ffhq"))
    .sort((a, b) => a.fid - b.fid)
    .map((e) => ({
      name: e.run_name,
      fid: e.fid,
      isBaseline: e.run_name === "celeba_baseline",
      isSelected: e.run_name === selectedExperiment,
    }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research Lab & Diagnostics"
        subtitle="Empirical benchmarking of Radford et al. (2015) DCGAN architecture across learning rates, batch sizes, Batch Normalization ablations, and optimizer momentum."
        badge="Empirical Study"
      />

      {/* 1. KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Best CelebA FID"
          value={kpis.best_fid}
          unit="score"
          delta={5.9}
          deltaLabel="vs baseline"
          isReductionPositive={true}
        />
        <MetricCard
          label="Total Epochs Trained"
          value={kpis.total_epochs}
          unit="epochs"
          delta={0}
        />
        <MetricCard
          label="Mean Epoch Runtime"
          value={kpis.avg_sec_per_epoch}
          unit="sec"
          delta={0}
        />
        <MetricCard
          label="Model Parameters"
          value="6.34M"
          unit="G: 3.58M / D: 2.77M"
        />
      </div>

      {/* 2. Charts Section: Loss Curves (L_D vs L_G) & FID Horizontal Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Loss Curves */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8B7CFF]" />
                <h3 className="text-sm font-semibold text-[#EDEEF3]">
                  Adversarial Loss Equilibrium (L_D vs. L_G)
                </h3>
              </div>

              {/* EMA Smoothing Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#8B8FA3]">
                  EMA Smooth
                </span>
                <button
                  type="button"
                  onClick={() => setUseEma(!useEma)}
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    useEma ? "bg-[#8B7CFF]" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      useEma ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_LOSS_CURVES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="epoch"
                    stroke="#8B8FA3"
                    fontSize={11}
                    tickLine={false}
                    label={{ value: "Epoch", position: "insideBottomRight", offset: -5, fill: "#8B8FA3", fontSize: 10 }}
                  />
                  <YAxis stroke="#8B8FA3" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0E1018",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={useEma ? "loss_d_ema" : "loss_d"}
                    name="Loss D (Discriminator)"
                    stroke="#38E1FF"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={useEma ? "loss_g_ema" : "loss_g"}
                    name="Loss G (Generator)"
                    stroke="#8B7CFF"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#8B8FA3] pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38E1FF]" /> Loss D (Real vs Fake)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B7CFF]" /> Loss G (Fool Discriminator)
                </span>
              </div>
              <span>CelebA Baseline 25 Epochs</span>
            </div>
          </GlassCard>
        </div>

        {/* FID Bar Chart */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#38E1FF]" />
                <h3 className="text-sm font-semibold text-[#EDEEF3]">
                  Frechet Inception Distance (FID)
                </h3>
              </div>
              <Tooltip
                term="Lower is Better"
                content="FID measures Wasserstein-2 distance in Inception-v3 feature space between generated and real CelebA distributions. Lower score indicates superior fidelity and diversity."
              />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fidBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#8B8FA3" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#8B8FA3" fontSize={10} width={75} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0E1018",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Bar dataKey="fid" radius={[0, 6, 6, 0]}>
                    {fidBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === selectedExperiment
                            ? "#8B7CFF"
                            : entry.isBaseline
                            ? "#38E1FF"
                            : entry.fid > 50
                            ? "#FF6B7A"
                            : "rgba(255,255,255,0.2)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] font-mono text-[#8B8FA3] flex justify-between">
              <span className="text-[#38E1FF]">Cyan = Baseline</span>
              <span className="text-rose-400">Red = Mode Collapse / Divergence</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 3. Experiment Data Table */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B7CFF]" />
            <h3 className="text-sm font-semibold text-[#EDEEF3]">
              Ablation Matrix & Empirical Results (Click Row to Focus)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8B8FA3]">
            {sortedExperiments.length} Benchmark Runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#8B8FA3]">
                <th
                  onClick={() => handleSort("run_name")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  <div className="flex items-center gap-1">
                    <span>Run Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("change")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  Change vs Baseline
                </th>
                <th
                  onClick={() => handleSort("epochs")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  Epochs
                </th>
                <th
                  onClick={() => handleSort("sec_per_epoch")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  Sec/Epoch
                </th>
                <th
                  onClick={() => handleSort("loss_d")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  Final L_D
                </th>
                <th
                  onClick={() => handleSort("loss_g")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3]"
                >
                  Final L_G
                </th>
                <th
                  onClick={() => handleSort("fid")}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#EDEEF3] text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>FID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedExperiments.map((exp) => {
                const isSelected = exp.run_name === selectedExperiment;
                const isBaseline = exp.run_name === "celeba_baseline";

                return (
                  <tr
                    key={exp.run_name}
                    onClick={() => setSelectedExperiment(exp.run_name)}
                    className={`border-b border-white/[0.04] transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#8B7CFF]/15 text-[#EDEEF3]"
                        : "hover:bg-white/[0.03] text-[#8B8FA3] hover:text-[#EDEEF3]"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-1.5">
                      {isBaseline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38E1FF]" />
                      )}
                      <span>{exp.run_name}</span>
                    </td>
                    <td className="py-2.5 px-3">{exp.change}</td>
                    <td className="py-2.5 px-3">{exp.epochs}</td>
                    <td className="py-2.5 px-3">{exp.sec_per_epoch}s</td>
                    <td className="py-2.5 px-3">{exp.loss_d.toFixed(3)}</td>
                    <td className="py-2.5 px-3">{exp.loss_g.toFixed(3)}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        exp.fid < 30
                          ? "text-emerald-400"
                          : exp.fid > 50
                          ? "text-rose-400"
                          : "text-[#EDEEF3]"
                      }`}
                    >
                      {exp.fid.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 4. Ablation Artifacts & Visual Gallery */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#38E1FF]" />
            <h3 className="text-sm font-semibold text-[#EDEEF3]">
              Ablation Artifacts & Failure Analysis Gallery
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8B8FA3]">
            Click any plot for full-screen inspection
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => (
            <div
              key={plot.id}
              onClick={() => setActiveLightboxPlot(plot)}
              className="group rounded-2xl border border-white/[0.08] bg-[#0E1018]/80 overflow-hidden hover:border-[#8B7CFF]/50 transition-all cursor-pointer shadow-lg flex flex-col"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
                <img
                  src={`http://localhost:8000/results/${plot.filename}`}
                  alt={plot.title}
                  onError={(e) => {
                    // Fallback to placeholder if server is in offline mock mode
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225' width='400' height='225'><rect width='400' height='225' fill='%230e1018'/><text x='50%25' y='50%25' fill='%238B7CFF' font-family='monospace' font-size='12' text-anchor='middle'>Ablation Artifact: " +
                      plot.id +
                      "</text></svg>";
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <h4 className="text-xs font-semibold text-[#EDEEF3] leading-snug">
                  {plot.title}
                </h4>
                <p className="text-[11px] text-[#8B8FA3] line-clamp-2">
                  {plot.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 5. DCGAN Architecture Topology Diagram */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Cpu className="w-4 h-4 text-[#8B7CFF]" />
          <h3 className="text-sm font-semibold text-[#EDEEF3]">
            DCGAN Generator & Discriminator Architecture (Radford et al., 2015)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Generator */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#38E1FF]">
              <span>GENERATOR (G)</span>
              <span>3,576,704 Params</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#8B8FA3]">
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Input: z ~ N(0, I) ∈ ℝ¹⁰⁰
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                ConvTranspose2d(100, 512, 4, 1, 0) + BatchNorm + ReLU → 4×4×512
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                ConvTranspose2d(512, 256, 4, 2, 1) + BatchNorm + ReLU → 8×8×256
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                ConvTranspose2d(256, 128, 4, 2, 1) + BatchNorm + ReLU → 16×16×128
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                ConvTranspose2d(128, 64, 4, 2, 1) + BatchNorm + ReLU → 32×32×64
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-[#8B7CFF]/30 text-[#EDEEF3]">
                ConvTranspose2d(64, 3, 4, 2, 1) + Tanh → Output: 64×64×3
              </div>
            </div>
          </div>

          {/* Discriminator */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#8B7CFF]">
              <span>DISCRIMINATOR (D)</span>
              <span>2,765,568 Params</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#8B8FA3]">
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Input: x ∈ ℝ⁶⁴ˣ⁶⁴ˣ³ (Real CelebA or Synthetic)
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Conv2d(3, 64, 4, 2, 1) + LeakyReLU(0.2) → 32×32×64
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Conv2d(64, 128, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 16×16×128
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Conv2d(128, 256, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 8×8×256
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/5">
                Conv2d(256, 512, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 4×4×512
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-[#38E1FF]/30 text-[#EDEEF3]">
                Conv2d(512, 1, 4, 1, 0) + Sigmoid → P(real) ∈ [0, 1]
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lightbox Modal for Full-Screen Plot Inspection */}
      {activeLightboxPlot && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex items-center justify-center"
          onClick={() => setActiveLightboxPlot(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#0E1018] border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#EDEEF3]">
                  {activeLightboxPlot.title}
                </h3>
                <p className="text-xs text-[#8B8FA3] font-mono mt-0.5">
                  {activeLightboxPlot.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxPlot(null)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/60">
              <img
                src={`http://localhost:8000/results/${activeLightboxPlot.filename}`}
                alt={activeLightboxPlot.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <p className="text-xs text-[#EDEEF3] leading-relaxed font-mono">
              {activeLightboxPlot.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
