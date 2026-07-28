import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  FileText,
  GitCompareArrows,
  Hash,
  Layers,
  LineChart,
  Cpu,
  ScanLine,
  User,
} from "lucide-react";
import { AiAnalysisSummaryReport } from "@/components/scans/AiAnalysisSummaryReport";
import { DicomMetadataPanel } from "@/components/scans/DicomMetadataPanel";
import { ScanNotesSection } from "@/components/scans/ScanNotesSection";
import type { ScanRecord, UserRole } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { DownloadReportButton } from "@/components/DownloadReportButton";
import { PATIENT_DASHBOARD_PATH } from "@/lib/auth-routes";
import { getMyScanReportUrl } from "@/lib/my-scans";
import { getScanReportUrl } from "@/lib/api";
import { patientComparePath, patientTrendsPath } from "@/lib/patients";
import { Card } from "@/components/ui/Card";
import { StudyImage } from "@/components/ui/StudyImage";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

interface ScanDetailViewProps {
  scan: ScanRecord;
  userRole: UserRole;
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

export function ScanDetailView({ scan, userRole }: ScanDetailViewProps) {
  const isPatient = userRole === "patient";
  const isPneumonia = scan.prediction === "Pneumonia";
  const backHref = isPatient ? PATIENT_DASHBOARD_PATH : "/history";
  const reportUrl = isPatient
    ? getMyScanReportUrl(scan.id)
    : getScanReportUrl(scan.id);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="scan-detail-actions flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={backHref} className="scan-detail-back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {isPatient ? "Back to My Dashboard" : "Back to History"}
        </Link>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!isPatient && scan.patientId ? (
            <>
              <Link
                href={patientTrendsPath(scan.patientId)}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <LineChart className="h-4 w-4" aria-hidden />
                AI Trends
              </Link>
              <Link
                href={patientComparePath(scan.patientId, {
                  followUpId: scan.id,
                })}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <GitCompareArrows className="h-4 w-4" aria-hidden />
                Compare Scans
              </Link>
            </>
          ) : null}
          <DownloadReportButton
            scanId={scan.id}
            reportUrl={reportUrl}
            label="Download PDF Report"
            className="w-full sm:w-auto sm:items-end"
          />
        </div>
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
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 sm:p-6">
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
          <InfoTile
            label="AI Model Version"
            value={scan.modelVersion ?? "Not recorded"}
            icon={Cpu}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5 xl:gap-7">
        {/* AI Analysis Summary */}
        <div className="space-y-6 lg:col-span-2">
          <AiAnalysisSummaryReport
            prediction={scan.prediction}
            confidence={scan.confidence}
            severity={scan.severity}
            observedRegions={scan.observedRegions}
            clinicalSuggestion={scan.aiFindings}
            recommendedNextStep={scan.followUpRecommendation}
          />

          <DicomMetadataPanel
            metadata={scan.dicomMetadata}
            originalUrl={scan.originalPath}
          />
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
                alt="Grad-CAM heatmap overlay highlighting suspicious regions"
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

      {scan.recommendation ? (
        <Card
          className={cn(
            "border-l-4 p-5 sm:p-6",
            isPneumonia ? "border-l-rose-500" : "border-l-emerald-500",
          )}
        >
          <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
            <div className="flex items-center gap-2 sm:items-start">
              <FileText
                className={cn(
                  "h-4 w-4 shrink-0 sm:mt-0.5",
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
                Screening Guidance
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {scan.recommendation}
            </p>
          </div>
        </Card>
      ) : null}

      <ScanNotesSection scanId={scan.id} userRole={userRole} />

      {/* Medical disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
}

