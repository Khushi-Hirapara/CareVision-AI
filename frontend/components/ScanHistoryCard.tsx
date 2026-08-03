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
import { cn } from "@/lib/utils";

interface ScanHistoryCardProps {
  scan: ScanRecord;
  layout?: "grid" | "list";
}

export function ScanHistoryCard({
  scan,
  layout = "grid",
}: ScanHistoryCardProps) {
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "scan-history-card group flex h-full flex-col",
        isList && "w-full",
      )}
    >
      {!isList ? (
        <div className="scan-history-card__media">
          <StudyImage
            src={scan.imagePath}
            alt={`Chest X-ray for ${scan.patientName}`}
            fill
            objectFit="contain"
            className="p-1"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col p-4 sm:p-5",
          isList && "lg:p-6",
        )}
      >
        <header className="space-y-2.5">
          <h3 className="scan-history-card__name capitalize" title={scan.patientName}>
            {scan.patientName}
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

        {isList ? (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-2 dark:border-slate-700/70">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                AI findings
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {scan.aiFindings || "No AI findings recorded."}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Recommended next step
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {scan.followUpRecommendation || "No follow-up recorded."}
              </p>
            </div>
          </div>
        ) : null}

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
