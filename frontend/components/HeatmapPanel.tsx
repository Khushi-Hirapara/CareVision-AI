import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapPanelProps {
  heatmapUrl?: string;
  className?: string;
}

export function HeatmapPanel({ heatmapUrl, className }: HeatmapPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
        Grad-CAM overlay
      </p>
      {heatmapUrl ? (
        <>
          <div className="relative aspect-square bg-slate-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heatmapUrl}
              alt="Grad-CAM overlay on chest X-ray"
              className="h-full w-full object-contain p-2"
            />
          </div>
          <p className="px-3 py-2 text-[10px] text-slate-400 sm:text-xs">
            Highlights regions that influenced the model prediction.
          </p>
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
