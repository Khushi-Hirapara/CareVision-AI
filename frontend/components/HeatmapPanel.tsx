import { Layers } from "lucide-react";
import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import type { PredictionLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeatmapPanelProps {
  heatmapUrl?: string;
  /** Structured Grad-CAM localization text (lung / lobe / infected %). */
  affectedArea?: string;
  prediction?: PredictionLabel;
  className?: string;
}

export function HeatmapPanel({
  heatmapUrl,
  affectedArea,
  prediction = "Pneumonia",
  className,
}: HeatmapPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Grad-CAM Overlay
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Highlighted suspicious regions that influenced the prediction
        </p>
      </div>
      {heatmapUrl ? (
        <>
          <div className="relative aspect-square bg-slate-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heatmapUrl}
              alt="Grad-CAM overlay highlighting suspicious regions on chest X-ray"
              className="h-full w-full object-contain p-2"
            />
          </div>

          {affectedArea ? (
            <div className="border-t border-slate-100 bg-slate-50/90 px-3 py-3">
              <ExplainabilityPanel
                prediction={prediction}
                observedRegions={affectedArea}
                layout="grid"
                showTitle={false}
              />
            </div>
          ) : (
            <p className="px-3 py-2 text-[10px] text-slate-400 sm:text-xs">
              Highlights regions that influenced the model prediction.
            </p>
          )}
        </>
      ) : (
        <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-slate-50/80 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm font-medium text-slate-600">
            Heatmap not available yet
          </p>
          <p className="max-w-[220px] text-xs leading-relaxed text-slate-500">
            Grad-CAM may be disabled or could not be generated for this scan.
          </p>
        </div>
      )}
    </div>
  );
}
