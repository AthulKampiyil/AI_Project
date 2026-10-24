"use client";

import React, { useState, useEffect } from "react";
import { fetchResearchResults, ResultsResponse, ExperimentItem, PlotItem } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { Tooltip } from "@/components/ui/Tooltip";
import {
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
} from "lucide-react";

export default function LabPage() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string>("celeba_baseline");
  const [sortField, setSortField] = useState<keyof ExperimentItem>("fid");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [activeLightboxPlot, setActiveLightboxPlot] = useState<PlotItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResearchResults().then((res) => setData(res)).catch(() => setError("Could not load research results. Check the connection and try again."));
  }, []);

  const experiments = data?.experiments || [];
  const plots = data?.plots || [];
  const kpis = data?.kpis;

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
    <div className="space-y-6">
      <PageHeader
        title="Research Lab & Diagnostics"
        subtitle="Empirical benchmarking of Radford et al. (2015) DCGAN architecture across learning rates, batch sizes, Batch Normalization ablations, and optimizer momentum."
        badge="Empirical Study"
      />
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <p className="rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-text-muted">The results below are historical training benchmarks, not live measurements for the currently loaded model.</p>

      {/* 1. KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Best CelebA FID"
          value={kpis?.best_fid ?? "—"}
          unit="score"
          delta={5.9}
          deltaLabel="vs baseline"
          isReductionPositive={true}
        />
        <MetricCard
          label="Total Epochs Trained"
          value={kpis?.total_epochs ?? "—"}
          unit="epochs"
          delta={0}
        />
        <MetricCard
          label="Mean Epoch Runtime"
          value={kpis?.avg_sec_per_epoch ?? "—"}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Loss Curves */}
        <div className="lg:col-span-7">
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Historical Adversarial Loss (L_D vs. L_G)
                </h3>
              </div>

            </div>

            <div className="h-64 w-full flex items-center justify-center rounded-lg border border-dashed border-border-subtle text-center text-sm text-text-muted">
              Training loss curves are not available from this results endpoint.
            </div>
          </Card>
        </div>

        {/* FID Bar Chart */}
        <div className="lg:col-span-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.6} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} width={80} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  />
                  <Bar dataKey="fid" radius={[0, 4, 4, 0]}>
                    {fidBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === selectedExperiment
                            ? "var(--accent)"
                            : entry.isBaseline
                            ? "var(--accent-secondary)"
                            : entry.fid > 50
                            ? "var(--danger)"
                            : "var(--border-strong)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] font-mono text-text-muted flex justify-between">
              <span className="text-accent-secondary font-medium">Secondary = Baseline</span>
              <span className="text-rose-500 font-medium">Red = Divergence</span>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Experiment Data Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              Ablation Matrix & Empirical Results
            </h3>
          </div>
          <span className="text-xs font-mono text-text-muted">
            {sortedExperiments.length} Benchmark Runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th
                  onClick={() => handleSort("run_name")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center gap-1">
                    <span>Run Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("change")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  Change vs Baseline
                </th>
                <th
                  onClick={() => handleSort("epochs")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  Epochs
                </th>
                <th
                  onClick={() => handleSort("sec_per_epoch")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  Sec/Epoch
                </th>
                <th
                  onClick={() => handleSort("loss_d")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  Final L_D
                </th>
                <th
                  onClick={() => handleSort("loss_g")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                >
                  Final L_G
                </th>
                <th
                  onClick={() => handleSort("fid")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary text-right"
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
                    className={`border-b border-border-subtle/50 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-accent-subtle text-text-primary font-medium"
                        : "hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-1.5">
                      {isBaseline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary" />
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
                          ? "text-emerald-600 dark:text-emerald-400"
                          : exp.fid > 50
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-text-primary"
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
      </Card>

      {/* 4. Ablation Artifacts & Visual Gallery */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              Ablation Artifacts & Failure Analysis Gallery
            </h3>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Click any plot for full-screen inspection
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => (
            <div
              key={plot.id}
              onClick={() => setActiveLightboxPlot(plot)}
              className="group rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-accent transition-all cursor-pointer shadow-xs flex flex-col"
            >
              <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center">
                <img
                  src={`http://localhost:8000/results/${plot.filename}`}
                  alt={plot.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225' width='400' height='225'><rect width='400' height='225' fill='%2316181F'/><text x='50%25' y='50%25' fill='%236366F1' font-family='monospace' font-size='12' text-anchor='middle'>Artifact: " +
                      plot.id +
                      "</text></svg>";
                  }}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                <h4 className="text-xs font-semibold text-text-primary leading-snug">
                  {plot.title}
                </h4>
                <p className="text-[11px] text-text-muted line-clamp-2">
                  {plot.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. DCGAN Architecture Topology Diagram */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Cpu className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">
            DCGAN Generator & Discriminator Architecture (Radford et al., 2015)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Generator */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-accent">
              <span>GENERATOR (G)</span>
              <span>3,576,704 Params</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-text-muted">
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Input: z ~ N(0, I) ∈ ℝ¹⁰⁰
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                ConvTranspose2d(100, 512, 4, 1, 0) + BatchNorm + ReLU → 4×4×512
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                ConvTranspose2d(512, 256, 4, 2, 1) + BatchNorm + ReLU → 8×8×256
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                ConvTranspose2d(256, 128, 4, 2, 1) + BatchNorm + ReLU → 16×16×128
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                ConvTranspose2d(128, 64, 4, 2, 1) + BatchNorm + ReLU → 32×32×64
              </div>
              <div className="p-1.5 rounded bg-surface border border-accent/30 text-text-primary font-medium">
                ConvTranspose2d(64, 3, 4, 2, 1) + Tanh → Output: 64×64×3
              </div>
            </div>
          </div>

          {/* Discriminator */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-accent-secondary">
              <span>DISCRIMINATOR (D)</span>
              <span>2,765,568 Params</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-text-muted">
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Input: x ∈ ℝ⁶⁴ˣ⁶⁴ˣ³ (Real CelebA or Synthetic)
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Conv2d(3, 64, 4, 2, 1) + LeakyReLU(0.2) → 32×32×64
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Conv2d(64, 128, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 16×16×128
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Conv2d(128, 256, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 8×8×256
              </div>
              <div className="p-1.5 rounded bg-surface border border-border-subtle">
                Conv2d(256, 512, 4, 2, 1) + BatchNorm + LeakyReLU(0.2) → 4×4×512
              </div>
              <div className="p-1.5 rounded bg-surface border border-accent-secondary/30 text-text-primary font-medium">
                Conv2d(512, 1, 4, 1, 0) + Sigmoid → P(real) ∈ [0, 1]
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lightbox Modal for Full-Screen Plot Inspection */}
      {activeLightboxPlot && (
        <div
          className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center"
          onClick={() => setActiveLightboxPlot(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-surface border border-border-subtle rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {activeLightboxPlot.title}
                </h3>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  {activeLightboxPlot.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxPlot(null)}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-surface-elevated border border-border-subtle">
              <img
                src={`http://localhost:8000/results/${activeLightboxPlot.filename}`}
                alt={activeLightboxPlot.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              {activeLightboxPlot.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
