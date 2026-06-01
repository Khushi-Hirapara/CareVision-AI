"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FileImage, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

interface XRayUploadPanelProps {
  previewUrl: string | null;
  fileName: string | null;
  error: string | null;
  disabled?: boolean;
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
  onError: (message: string | null) => void;
}

export function XRayUploadPanel({
  previewUrl,
  fileName,
  error,
  disabled,
  onFileSelect,
  onClear,
  onError,
}: XRayUploadPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File | null) => {
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError("Please upload a PNG or JPEG chest X-ray.");
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        onError(`File must be smaller than ${MAX_SIZE_MB} MB.`);
        return;
      }

      onError(null);
      onFileSelect(file, URL.createObjectURL(file));
    },
    [onError, onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      processFile(e.dataTransfer.files[0] ?? null);
    },
    [disabled, processFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors sm:py-12",
            disabled && "pointer-events-none opacity-60",
            dragOver
              ? "border-teal-400 bg-teal-50/60"
              : "border-slate-200 bg-slate-50/80 hover:border-teal-300 hover:bg-teal-50/40",
          )}
        >
          <CloudUpload className="mb-3 h-10 w-10 text-teal-600" aria-hidden />
          <p className="text-sm font-medium text-slate-800">
            Drag & drop chest X-ray
          </p>
          <p className="mt-1 text-xs text-slate-500">PNG or JPEG · max {MAX_SIZE_MB} MB</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50 disabled:opacity-50"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              processFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
            <p className="flex items-center gap-2 truncate text-xs font-medium text-slate-600 sm:text-sm">
              <FileImage className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="truncate">{fileName}</span>
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[5/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded chest X-ray preview"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="border-t border-slate-200 bg-white px-3 py-2 sm:px-4">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 disabled:opacity-50 sm:text-sm"
            >
              Replace image
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              disabled={disabled}
              onChange={(e) => {
                processFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
