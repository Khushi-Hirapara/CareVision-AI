"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { getScanReportUrl } from "@/lib/api";
import { apiFetch } from "@/lib/api-client";

interface DownloadReportButtonProps {
  scanId: string;
  className?: string;
  variant?: "primary" | "outline";
  size?: "md" | "sm";
  label?: string;
}

const variantClasses = {
  primary:
    "bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:bg-teal-400",
  outline:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:bg-slate-50",
} as const;

const sizeClasses = {
  md: "rounded-xl px-4 py-2.5 text-sm",
  sm: "rounded-lg px-3 py-2 text-xs",
} as const;

export function DownloadReportButton({
  scanId,
  className,
  variant = "primary",
  size = "md",
  label,
}: DownloadReportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await apiFetch(getScanReportUrl(scanId));
      if (!response.ok) {
        throw new Error("Could not generate the PDF report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carevision-scan-${scanId}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Download failed. Please try again.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadLabel = label ?? "Download Report";
  const loadingLabel = size === "sm" ? "Generating…" : "Generating PDF…";

  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        className={`inline-flex w-full items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]}`}
      >
        {isDownloading ? (
          <Loader2
            className={size === "sm" ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"}
            aria-hidden
          />
        ) : (
          <Download
            className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
            aria-hidden
          />
        )}
        {isDownloading ? loadingLabel : downloadLabel}
      </button>
      {error && (
        <p className="max-w-[260px] text-right text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
