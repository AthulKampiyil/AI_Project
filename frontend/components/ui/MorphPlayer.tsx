"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Download, Repeat, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MorphPlayerProps {
  frames: string[];
  gifUrl?: string;
  fps?: number;
  className?: string;
}

export const MorphPlayer: React.FC<MorphPlayerProps> = ({
  frames,
  gifUrl,
  fps = 16,
  className,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackFps, setPlaybackFps] = useState(fps);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPlaybackFps(fps);
  }, [fps]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(20, Math.floor(1000 / playbackFps));
    timerRef.current = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, frames, playbackFps]);

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handleDownload = () => {
    const url = gifUrl || frames[currentFrameIndex];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = gifUrl ? "dcgan_morph_reel.gif" : `dcgan_morph_frame_${currentFrameIndex}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (frames.length === 0) {
    return (
      <div
        className={cn(
          "w-full aspect-square rounded-3xl border border-white/[0.08] bg-[#0E1018]/90 flex flex-col items-center justify-center p-6 text-center text-[#8B8FA3]",
          className
        )}
      >
        <Sparkles className="w-10 h-10 text-[#38E1FF]/50 mb-3 animate-pulse" />
        <h4 className="text-sm font-semibold text-[#EDEEF3]">Interpolation Player Ready</h4>
        <p className="text-xs mt-1 max-w-xs font-mono">
          Select Person A and Person B seeds, then click &quot;Generate Reel&quot; to synthesize the geodesic trajectory.
        </p>
      </div>
    );
  }

  const currentFrame = frames[currentFrameIndex];
  const progressPercent = ((currentFrameIndex + 1) / frames.length) * 100;

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-[#0E1018]/90 p-4 shadow-2xl flex flex-col items-center",
        className
      )}
    >
      {/* Canvas / Frame Display */}
      <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden border border-white/10 bg-black/40 mb-4 flex items-center justify-center">
        <img
          src={currentFrame}
          alt={`Frame ${currentFrameIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* HUD Frame Info */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#38E1FF]">
          FRAME {currentFrameIndex + 1} / {frames.length}
        </div>

        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#8B8FA3] flex items-center gap-1">
          <Repeat className="w-2.5 h-2.5 text-[#38E1FF]" />
          PING-PONG
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="w-full space-y-1 mb-3">
        <div className="relative h-2 rounded-full bg-white/[0.08] cursor-pointer">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#8B7CFF] to-[#38E1FF] rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrameIndex(parseInt(e.target.value, 10));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStepBack}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#EDEEF3] transition-colors"
            title="Step 1 Frame Back"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-2 rounded-xl bg-[#8B7CFF] hover:bg-[#9B8EFF] text-black font-semibold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,124,255,0.4)]"
            title={isPlaying ? "Pause" : "Play Loop"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#EDEEF3] transition-colors"
            title="Step 1 Frame Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FPS Indicator & Download */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-[#8B8FA3] px-2 py-1 rounded-lg bg-white/[0.03]">
            {playbackFps} FPS
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#EDEEF3] transition-colors"
            title="Download Animated Reel"
          >
            <Download className="w-3.5 h-3.5 text-[#38E1FF]" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
