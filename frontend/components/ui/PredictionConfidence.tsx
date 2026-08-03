import { cn, formatPercent } from "@/lib/utils";
import {
  isAbnormalPrediction,
  predictionToneClasses,
} from "@/lib/prediction";
import type { PredictionLabel } from "@/lib/types";

interface ConfidencePillProps {
  prediction: PredictionLabel;
  confidence: number;
  className?: string;
}

export function ConfidencePill({
  prediction,
  confidence,
  className,
}: ConfidencePillProps) {
  const tones = predictionToneClasses(isAbnormalPrediction(prediction));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ring-1",
        tones.pill,
        className,
      )}
    >
      {formatPercent(confidence)} confidence
    </span>
  );
}

interface PredictionConfidenceBarProps {
  prediction: PredictionLabel;
  confidence: number;
  className?: string;
}

export function PredictionConfidenceBar({
  prediction,
  confidence,
  className,
}: PredictionConfidenceBarProps) {
  const isAbnormal = isAbnormalPrediction(prediction);
  const tones = predictionToneClasses(isAbnormal);
  const confidencePct = Math.round(confidence * 100);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-700/70 dark:bg-slate-950/50",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Model confidence
        </span>
        <span className={cn("font-bold tabular-nums", tones.value)}>
          {confidencePct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
        <div
          className={cn("h-full rounded-full transition-all", tones.bar)}
          style={{ width: `${confidencePct}%` }}
        />
      </div>
    </div>
  );
}
