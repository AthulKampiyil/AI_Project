"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoDropzoneProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
  previewUrl: string | null;
  disabled?: boolean;
}

export const PhotoDropzone: React.FC<PhotoDropzoneProps> = ({
  onFileSelected,
  onClear,
  selectedFile,
  previewUrl,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = (file: File) => {
    setErrorMsg(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("File exceeds the 8MB size limit.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative rounded-2xl border border-white/10 bg-[#0E1018]/90 p-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 bg-black/40">
              <img
                src={previewUrl}
                alt="Uploaded face preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-[#EDEEF3] truncate max-w-[180px]">
                {selectedFile?.name || "Target Image"}
              </div>
              <div className="text-[10px] font-mono text-[#8B8FA3] mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>
                  {selectedFile ? (selectedFile.size / 1024).toFixed(0) : "0"} KB · In-Memory
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-[#8B8FA3] hover:text-rose-400 border border-white/10 transition-colors"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 flex flex-col items-center justify-center",
            isDragOver
              ? "border-[#8B7CFF] bg-[#8B7CFF]/10 shadow-[0_0_25px_rgba(139,124,255,0.25)]"
              : "border-white/15 hover:border-[#8B7CFF]/40 bg-[#0E1018]/60 hover:bg-[#0E1018]/90",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6 text-[#8B7CFF]" />
          </div>

          <h5 className="text-xs font-semibold text-[#EDEEF3]">
            Drop face portrait here or browse
          </h5>
          <p className="text-[11px] text-[#8B8FA3] mt-1 font-mono">
            JPEG, PNG, WebP up to 8MB
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-rose-400 font-mono px-1">{errorMsg}</p>
      )}

      <div className="text-[10px] text-[#8B8FA3]/70 font-mono leading-tight px-1">
        * Note: Photos are processed strictly in memory and are not stored.
      </div>
    </div>
  );
};
