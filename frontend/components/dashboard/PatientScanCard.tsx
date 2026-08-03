"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { ScanRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { DownloadReportButton } from "@/components/DownloadReportButton";
import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import {
  ConfidencePill,
  PredictionConfidenceBar,
} from "@/components/ui/PredictionConfidence";
import { StudyImage } from "@/components/ui/StudyImage";
import { getMyScanReportUrl } from "@/lib/my-scans";

interface PatientScanCardProps {
  scan: ScanRecord;
}

export function PatientScanCard({ scan }: PatientScanCardProps) {
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
        <header className="space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Chest X-ray screening
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <PredictionBadge label={scan.prediction} />
            <SeverityBadge severity={scan.severity} />
            <ConfidencePill
              prediction={scan.prediction}
              confidence={scan.confidence}
            />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar
              className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <time dateTime={scan.createdAt}>{formatDate(scan.createdAt)}</time>
          </p>
        </header>

        <PredictionConfidenceBar
          prediction={scan.prediction}
          confidence={scan.confidence}
          className="mt-4"
        />

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
