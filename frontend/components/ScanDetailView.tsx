import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  Layers,
  ScanLine,
  Stethoscope,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ScanRecord } from "@/lib/types";
import { formatDate, formatPercent, cn } from "@/lib/utils";
import { DownloadReportButton } from "@/components/DownloadReportButton";
import { PredictionBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StudyImage } from "@/components/ui/StudyImage";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

interface ScanDetailViewProps {
  scan: ScanRecord;
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: typeof User;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3",
        highlight && "border-teal-100 bg-teal-50/50",
      )}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-1.5 text-sm font-semibold text-slate-900 break-words sm:text-base",
          highlight && "text-lg sm:text-xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ImagingPanel({
  title,
  src,
  alt,
  empty,
}: {
  title: string;
  src?: string;
  alt: string;
  empty?: ReactNode;
}) {
  return (
    <div className="scan-detail-imaging overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </p>
        {title.toLowerCase().includes("heatmap") ? (
          <Layers className="h-4 w-4 text-slate-400" aria-hidden />
        ) : (
          <ScanLine className="h-4 w-4 text-slate-400" aria-hidden />
        )}
      </div>
      {src ? (
        <div className="relative aspect-[4/5] bg-slate-950">
          <StudyImage
            src={src}
            alt={alt}
            fill
            objectFit="contain"
            className="p-2"
            sizes="(max-width: 1024px) 100vw, 400px"
          />
        </div>
      ) : (
        empty
      )}
    </div>
  );
}

export function ScanDetailView({ scan }: ScanDetailViewProps) {
  const isPneumonia = scan.prediction === "Pneumonia";
  const confidencePct = Math.round(scan.confidence * 100);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="scan-detail-actions flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/history" className="scan-detail-back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to History
        </Link>
        <DownloadReportButton
          scanId={scan.id}
          label="Download PDF Report"
          className="w-full sm:w-auto sm:items-end"
        />
      </div>

      {/* Patient information */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-5 py-5 sm:px-6">
          <SectionHeader
            icon={User}
            title="Patient Information"
            description="Demographics and scan identifiers for this study"
          />
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:gap-4 sm:p-6">
          <InfoTile
            label="Patient name"
            value={scan.patientName}
            icon={User}
            highlight
          />
          <InfoTile
            label="Scan date"
            value={formatDate(scan.createdAt)}
            icon={Calendar}
          />
          <InfoTile label="Scan ID" value={scan.id} icon={Hash} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Prediction summary */}
        <div className="space-y-6 lg:col-span-2">
          <Card
            className={cn(
              "overflow-hidden border-l-4 p-0",
              isPneumonia ? "border-l-rose-500" : "border-l-emerald-500",
            )}
          >
            <div className="p-5 sm:p-6">
              <SectionHeader
                icon={Stethoscope}
                title="Prediction Summary"
                description="AI-assisted screening result from the chest X-ray model"
              />

              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <PredictionBadge
                    label={scan.prediction}
                    className="px-3 py-1 text-sm"
                  />
                  <span
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      isPneumonia ? "text-rose-700" : "text-emerald-700",
                    )}
                  >
                    {formatPercent(scan.confidence)}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Prediction
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-bold",
                      isPneumonia ? "text-rose-800" : "text-emerald-800",
                    )}
                  >
                    {scan.prediction}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {isPneumonia
                      ? "Model suggests findings consistent with pneumonia on this chest radiograph."
                      : "Model suggests no pneumonia pattern on this chest radiograph."}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Confidence</span>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        isPneumonia ? "text-rose-700" : "text-emerald-700",
                      )}
                    >
                      {confidencePct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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

                {scan.recommendation ? (
                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      isPneumonia
                        ? "border-rose-100 bg-rose-50/60"
                        : "border-emerald-100 bg-emerald-50/60",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <FileText
                        className={cn(
                          "h-4 w-4",
                          isPneumonia ? "text-rose-600" : "text-emerald-600",
                        )}
                        aria-hidden
                      />
                      <p
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-wider",
                          isPneumonia ? "text-rose-800" : "text-emerald-800",
                        )}
                      >
                        Recommendation
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {scan.recommendation}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        {/* Images */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="p-5 sm:p-6">
            <SectionHeader
              icon={ScanLine}
              title="Images"
              description="Original study and Grad-CAM explainability overlay"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ImagingPanel
                title="Original X-ray"
                src={scan.imagePath}
                alt={`Chest X-ray for ${scan.patientName}`}
              />
              <ImagingPanel
                title="Grad-CAM Heatmap"
                src={scan.heatmapPath}
                alt="Grad-CAM heatmap overlay"
                empty={
                  <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Layers className="h-7 w-7" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Heatmap not available
                      </p>
                      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-500">
                        Grad-CAM may be disabled or could not be generated for
                        this scan.
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
            {scan.heatmapPath ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                The Grad-CAM overlay highlights image regions that most influenced
                the {scan.prediction} classification. Use alongside clinical
                judgment-not as a standalone diagnostic map.
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Medical disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
}
