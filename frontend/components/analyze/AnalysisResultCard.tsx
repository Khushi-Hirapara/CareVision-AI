import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { AiAnalysisSummaryReport } from "@/components/scans/AiAnalysisSummaryReport";
import { DicomMetadataPanel } from "@/components/scans/DicomMetadataPanel";
import { HeatmapPanel } from "@/components/HeatmapPanel";
import { Card } from "@/components/ui/Card";
import { isAbnormalPrediction, predictionToneClasses } from "@/lib/prediction";
import { cn } from "@/lib/utils";

interface AnalysisResultCardProps {
  result: AnalysisResult;
  /** Prefer server-stored image URL after analysis; fall back to local preview. */
  imageUrl: string;
}

export function AnalysisResultCard({ result, imageUrl }: AnalysisResultCardProps) {
  const displayImage =
    imageUrl.startsWith("dicom:") ? result.imageUrl : imageUrl || result.imageUrl;
  const isAbnormal = isAbnormalPrediction(result.prediction);
  const tones = predictionToneClasses(isAbnormal);

  return (
    <Card className="space-y-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        Analysis complete
      </h3>

      <AiAnalysisSummaryReport
        prediction={result.prediction}
        confidence={result.confidence}
        severity={result.severity}
        observedRegions={result.observedRegions}
        clinicalSuggestion={result.aiFindings}
        recommendedNextStep={result.followUpRecommendation}
      />

      <DicomMetadataPanel
        metadata={result.dicomMetadata}
        originalUrl={result.originalUrl}
      />

      {result.recommendation ? (
        <div className={cn("rounded-xl border p-4", tones.surface)}>
          <div className={cn("mb-2 flex items-center gap-2", tones.heading)}>
            {isAbnormal ? (
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <p className="text-xs font-semibold uppercase tracking-wide">
              Screening Guidance
            </p>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
            {result.recommendation}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-950/40">
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700/70 dark:text-slate-400">
            {result.dicomMetadata ? "Converted study image" : "Uploaded X-ray"}
          </p>
          <div className="relative aspect-square bg-slate-50 dark:bg-slate-900/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Analyzed chest X-ray"
              className="h-full w-full object-contain p-2"
            />
          </div>
        </div>
        <HeatmapPanel
          heatmapUrl={result.heatmapUrl}
          affectedArea={result.observedRegions}
          prediction={result.prediction}
        />
      </div>
    </Card>
  );
}
