"use client";

import React, { useState } from "react";
import { Dices, Hash, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_PRESETS } from "@/lib/mockData";

interface SeedInputProps {
  value: number;
  onChange: (seed: number) => void;
  label?: string;
  disabled?: boolean;
}

export const SeedInput: React.FC<SeedInputProps> = ({
  value,
  onChange,
  label = "Identity Seed",
  disabled = false,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [draft, setDraft] = useState<{ value: number; text: string } | null>(null);
  const inputValue = draft?.value === value ? draft.text : String(value);

  const handleRandomize = () => {
    setIsRotating(true);
    setDraft(null);
    const newSeed = Math.floor(Math.random() * 100000);
    onChange(newSeed);
    setTimeout(() => setIsRotating(false), 500);
  };

  const currentPreset = HERO_PRESETS.find((p) => p.seed === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="text-text-secondary font-medium flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-text-muted" />
          {label}
        </label>
        {currentPreset && (
          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-accent/20">
            {currentPreset.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsPresetOpen(!isPresetOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-surface-elevated border border-border-subtle hover:border-border-strong text-xs font-mono text-text-primary transition-colors cursor-pointer"
            title="Choose Curated High-Clarity Preset"
          >
            <span>Preset</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          <AnimatePresence>
            {isPresetOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPresetOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 w-64 p-1.5 rounded-xl bg-surface border border-border-subtle shadow-lg z-50 space-y-0.5"
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    Curated CelebA Basins
                  </div>
                  {HERO_PRESETS.map((preset) => {
                    const isSelected = preset.seed === value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setDraft(null);
                          onChange(preset.seed);
                          setIsPresetOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-accent-subtle border border-accent/30 text-text-primary font-medium"
                            : "hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-text-primary flex items-center gap-1.5">
                            <span>{preset.name}</span>
                            <span className="font-mono text-[10px] text-text-muted">
                              #{preset.seed}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-muted">
                            {preset.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-accent" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Number Input */}
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={99999}
            value={inputValue}
            disabled={disabled}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft({ value, text: raw });
              if (/^\d+$/.test(raw)) {
                const nextValue = Number(raw);
                if (Number.isFinite(nextValue) && Number.isInteger(nextValue) && nextValue >= 0 && nextValue <= 99999) {
                  onChange(nextValue);
                }
              }
            }}
            onBlur={() => setDraft(null)}
            aria-label={label}
            className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle focus:border-accent text-sm font-mono text-text-primary transition-colors outline-none"
          />
        </div>

        {/* Randomize Dice Button */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={handleRandomize}
          animate={{ rotate: isRotating ? 360 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          whileTap={{ scale: 0.94 }}
          className="p-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border-subtle hover:border-border-strong text-text-primary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Randomize Gaussian Latent Seed"
        >
          <Dices className="w-4 h-4 text-text-muted hover:text-text-primary" />
        </motion.button>
      </div>
    </div>
  );
};
