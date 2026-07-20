"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { ScanRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { DownloadReportButton } from "@/components/DownloadReportButton";
import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import { StudyImage } from "@/components/ui/StudyImage";
import { getMyScanReportUrl } from "@/lib/my-scans";
import { cn } from "@/lib/utils";

interface PatientScanCardProps {
  scan: ScanRecord;
}

export function PatientScanCard({ scan }: PatientScanCardProps) {
  const isPneumonia = scan.prediction === "Pneumonia";
  const confidencePct = Math.round(scan.confidence * 100);

  return (
    <article className="scan-history-card group flex h-full flex-col">
      <div className="scan-history-card__media">
        <StudyImage
          src={scan.imagePath}
          alt="Your chest X-ray study"
          fill
          objectFit="contain"
          className="p-1"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <header className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Chest X-ray screening</h3>

          <div className="flex flex-wrap items-center gap-2">
            <PredictionBadge label={scan.prediction} />
            <SeverityBadge severity={scan.severity} />
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                isPneumonia
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              {formatPercent(scan.confidence)} confidence
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <time dateTime={scan.createdAt}>{formatDate(scan.createdAt)}</time>
          </p>
        </header>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Model confidence</span>
            <span
              className={cn(
                "font-bold tabular-nums",
                isPneumonia ? "text-rose-700" : "text-emerald-700",
              )}
            >
              {confidencePct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isPneumonia
                  ? "bg-gradient-to-r from-rose-400 to-rose-600"
                  : "bg-gradient-to-r from-emerald-400 to-teal-600",
              )}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        <footer className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/scans/${scan.id}`}
            className="scan-history-card__btn scan-history-card__btn--primary"
          >
            View Details
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <DownloadReportButton
            scanId={scan.id}
            reportUrl={getMyScanReportUrl(scan.id)}
            variant="outline"
            size="sm"
            label="Download Report"
            className="sm:flex-1"
          />
        </footer>
      </div>
    </article>
  );
}
