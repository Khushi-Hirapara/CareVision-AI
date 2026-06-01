import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { PredictionBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface AnalysisResultCardProps {
  result: AnalysisResult;
  imagePreviewUrl: string;
}

export function AnalysisResultCard({
  result,
  imagePreviewUrl,
}: AnalysisResultCardProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Analysis complete</h3>
        <PredictionBadge label={result.prediction} />
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Prediction
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{result.prediction}</p>
        <div className="mt-4">
          <ConfidenceBar value={result.confidence} />
        </div>
        <p className="mt-2 text-right text-xs text-slate-500">
          Model confidence: {formatPercent(result.confidence)}
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide">
            Safe recommendation
          </p>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {result.safeRecommendation}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            Your X-ray
          </p>
          <div className="relative aspect-square bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt="Analyzed chest X-ray"
              className="h-full w-full object-contain p-2"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            Grad-CAM heatmap
          </p>
          <div className="relative aspect-square bg-slate-900/5">
            <Image
              src={result.heatmapPath}
              alt="Grad-CAM heatmap placeholder"
              fill
              className="object-contain p-2"
            />
          </div>
          <p className="px-3 py-2 text-[10px] text-slate-400 sm:text-xs">
            Placeholder — live heatmap when model is connected
          </p>
        </div>
      </div>
    </Card>
  );
}
