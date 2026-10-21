"use client";

import React, { useState } from "react";
import { Dices, Sparkles, ChevronDown, Check } from "lucide-react";
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

  const handleRandomize = () => {
    setIsRotating(true);
    const newSeed = Math.floor(Math.random() * 100000);
    onChange(newSeed);
    setTimeout(() => setIsRotating(false), 500);
  };

  const currentPreset = HERO_PRESETS.find((p) => p.seed === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="text-[#8B8FA3] font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
          {label}
        </label>
        {currentPreset && (
          <span className="text-[11px] font-mono text-[#38E1FF] bg-[#38E1FF]/10 px-2 py-0.5 rounded border border-[#38E1FF]/20">
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
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#8B7CFF]/40 text-xs font-mono text-[#EDEEF3] transition-all hover:bg-white/[0.07]"
            title="Choose Curated High-Clarity Preset"
          >
            <span>Preset</span>
            <ChevronDown className="w-3 h-3 text-[#8B8FA3]" />
          </button>

          <AnimatePresence>
            {isPresetOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPresetOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-64 p-2 rounded-2xl bg-[#0E1018] border border-white/10 shadow-2xl backdrop-blur-2xl z-50 space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B8FA3]">
                    Curated CelebA Basins
                  </div>
                  {HERO_PRESETS.map((preset) => {
                    const isSelected = preset.seed === value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onChange(preset.seed);
                          setIsPresetOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? "bg-[#8B7CFF]/15 border border-[#8B7CFF]/40 text-[#EDEEF3]"
                            : "hover:bg-white/[0.05] text-[#8B8FA3] hover:text-[#EDEEF3]"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-[#EDEEF3] flex items-center gap-1.5">
                            <span>{preset.name}</span>
                            <span className="font-mono text-[10px] text-[#8B8FA3]">
                              #{preset.seed}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8B8FA3]/80">
                            {preset.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#8B7CFF]" />
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
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange(isNaN(val) ? 0 : Math.max(0, Math.min(99999, val)));
            }}
            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-[#8B7CFF] focus:bg-white/[0.06] text-sm font-mono text-[#EDEEF3] transition-all outline-none"
          />
        </div>

        {/* Randomize Dice Button */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={handleRandomize}
          animate={{ rotate: isRotating ? 360 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          whileTap={{ scale: 0.92 }}
          className="p-2.5 rounded-xl bg-[#8B7CFF]/15 hover:bg-[#8B7CFF]/25 border border-[#8B7CFF]/30 text-[#8B7CFF] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Randomize Gaussian Latent Seed"
        >
          <Dices className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
