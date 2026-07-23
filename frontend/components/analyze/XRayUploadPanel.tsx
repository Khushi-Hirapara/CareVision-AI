"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FileImage, FileStack, X } from "lucide-react";
import {
  ACCEPT_FILE_ATTRIBUTE,
  MAX_XRAY_SIZE_MB,
  isDicomFile,
  validateXRayFile,
} from "@/lib/validate-image";
import { cn } from "@/lib/utils";

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
  const [isDicom, setIsDicom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File | null) => {
      if (!file) return;

      const validation = validateXRayFile(file);
      if (!validation.valid) {
        onError(validation.message);
        return;
      }

      onError(null);
      const dicom = isDicomFile(file);
      setIsDicom(dicom);
      // Browsers cannot render .dcm; use a marker URL until analysis returns a PNG.
      const preview = dicom ? "dicom:pending" : URL.createObjectURL(file);
      onFileSelect(file, preview);
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

  useEffect(() => {
    if (!previewUrl) setIsDicom(false);
  }, [previewUrl]);

  const showDicomPlaceholder =
    isDicom || previewUrl === "dicom:pending" || Boolean(fileName?.match(/\.dcm$/i));

  return (
    <div className="space-y-3">
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
              ? "border-teal-400 bg-teal-50/60 dark:border-teal-400 dark:bg-teal-950/40"
              : "border-slate-200 bg-slate-50/80 hover:border-teal-300 hover:bg-teal-50/40 dark:border-slate-600 dark:bg-slate-950/60 dark:hover:border-teal-500 dark:hover:bg-teal-950/30",
          )}
        >
          <CloudUpload className="mb-3 h-10 w-10 text-teal-600 dark:text-teal-400" strokeWidth={2} aria-hidden />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Drag & drop chest X-ray
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            PNG, JPEG, or DICOM (.dcm) · max {MAX_XRAY_SIZE_MB} MB
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50 disabled:opacity-50 dark:bg-slate-800 dark:text-teal-300 dark:ring-slate-600 dark:hover:bg-slate-700"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_FILE_ATTRIBUTE}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              processFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 sm:px-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="flex items-center gap-2 truncate text-xs font-medium text-slate-600 sm:text-sm dark:text-slate-300">
              {showDicomPlaceholder ? (
                <FileStack className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              ) : (
                <FileImage className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              )}
              <span className="truncate">{fileName}</span>
              {showDicomPlaceholder ? (
                <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/30">
                  DICOM
                </span>
              ) : null}
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[5/4] dark:bg-slate-950">
            {showDicomPlaceholder && !previewUrl.startsWith("blob:") && !previewUrl.startsWith("http") ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <FileStack className="h-10 w-10 text-teal-600 dark:text-teal-400" aria-hidden />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  DICOM study selected
                </p>
                <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Medical metadata will be preserved. A high-quality preview appears
                  after analysis converts the study for AI screening.
                </p>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt="Uploaded chest X-ray preview"
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <div className="border-t border-slate-200 bg-white px-3 py-2 sm:px-4 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 disabled:opacity-50 sm:text-sm dark:text-teal-400 dark:hover:text-teal-300"
            >
              Replace image
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_FILE_ATTRIBUTE}
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

      {error ? (
        <p className="text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
