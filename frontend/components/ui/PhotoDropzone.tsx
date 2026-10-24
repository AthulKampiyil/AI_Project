"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, CheckCircle2 } from "lucide-react";
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
        <div className="relative rounded-xl border border-border-subtle bg-surface p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-border-subtle bg-surface-elevated">
              <img
                src={previewUrl}
                alt="Uploaded face preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary truncate max-w-[180px]">
                {selectedFile?.name || "Target Image"}
              </div>
              <div className="text-[10px] font-mono text-text-muted mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>
                  {selectedFile ? (selectedFile.size / 1024).toFixed(0) : "0"} KB · Selected locally
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-rose-500/10 text-text-muted hover:text-rose-500 border border-border-subtle transition-colors cursor-pointer"
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
            "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-150 flex flex-col items-center justify-center",
            isDragOver
              ? "border-accent bg-accent-subtle"
              : "border-border-strong hover:border-accent bg-surface-elevated hover:bg-surface-hover",
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

          <div className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center mb-3 text-text-muted shadow-xs">
            <UploadCloud className="w-5 h-5 text-accent" />
          </div>

          <h5 className="text-xs font-semibold text-text-primary">
            Drop face portrait here or browse
          </h5>
          <p className="text-[11px] text-text-muted mt-1 font-mono">
            JPEG, PNG, WebP up to 8MB
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-rose-500 font-mono px-1">{errorMsg}</p>
      )}

      <div className="text-[10px] text-text-muted font-mono leading-tight px-1">
        Selecting a photo keeps it on this device until you create a projection. Then it is sent to the processing service; its storage practices depend on that service.
      </div>
    </div>
  );
};
