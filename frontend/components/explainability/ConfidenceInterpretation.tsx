import type { PredictionLabel } from "@/lib/types";
import {
  interpretModelConfidence,
  tierAccentClass,
} from "@/lib/confidence-interpretation";
import { ConfidenceGauge } from "@/components/explainability/ConfidenceGauge";
import { cn } from "@/lib/utils";

interface ConfidenceInterpretationProps {
  /** Model confidence as a fraction (0–1). */
  confidence: number;
  prediction: PredictionLabel;
  className?: string;
}

export function ConfidenceInterpretation({
  confidence,
  prediction,
  className,
}: ConfidenceInterpretationProps) {
  const interpretation = interpretModelConfidence(confidence, prediction);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-4 sm:p-5 dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-950/80",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ConfidenceGauge
          value={interpretation.pct}
          label="Model confidence"
          size="lg"
          tier={interpretation.tier}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            AI Confidence Interpretation
          </p>
          <p
            className={cn(
              "text-xl font-bold",
              tierAccentClass(interpretation.tier),
              "dark:text-teal-300",
            )}
          >
            {interpretation.headline}
          </p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {interpretation.explanation}
          </p>
          <p className="rounded-lg bg-slate-100/80 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            {interpretation.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
