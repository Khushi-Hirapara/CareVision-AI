import type { ReactNode } from "react";
import { AI_SCREENING_DISCLAIMER } from "@/lib/constants";
import { ConfidenceInterpretation } from "@/components/explainability/ConfidenceInterpretation";
import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import type { PredictionLabel, SeverityLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AiAnalysisSummaryReportProps {
  prediction: PredictionLabel;
  /** Model confidence as a fraction (0–1). */
  confidence: number;
  severity: SeverityLabel;
  observedRegions: string;
  /** Clinical suggestion / AI findings narrative. */
  clinicalSuggestion: string;
  /** Recommended next step / follow-up guidance. */
  recommendedNextStep: string;
  className?: string;
  /** When false, omit the screening disclaimer footer. */
  showDisclaimer?: boolean;
}

function ReportField({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <div
        className={cn(
          "mt-1.5 text-sm leading-relaxed text-slate-800 whitespace-pre-line",
          valueClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AiAnalysisSummaryReport({
  prediction,
  confidence,
  severity,
  observedRegions,
  clinicalSuggestion,
  recommendedNextStep,
  className,
  showDisclaimer = true,
}: AiAnalysisSummaryReportProps) {
  const isPneumonia = prediction === "Pneumonia";
  const severityTone =
    severity === "Severe"
      ? "bg-rose-100 text-rose-700"
      : severity === "Moderate"
        ? "bg-orange-100 text-orange-700"
        : severity === "Mild"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      aria-label="AI Analysis Summary"
    >
      <div
        className={cn(
          "border-b px-5 py-5 sm:px-6",
          isPneumonia
            ? "border-rose-100 bg-rose-50/70"
            : "border-emerald-100 bg-emerald-50/70",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              AI Analysis Summary
            </p>
            <h3
              className={cn(
                "mt-2 text-3xl font-bold tracking-tight sm:text-4xl",
                isPneumonia ? "text-rose-800" : "text-emerald-800",
              )}
            >
              {prediction}
            </h3>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              severityTone,
            )}
          >
            Severity: {severity}
          </span>
        </div>
      </div>

      <div className="space-y-0 px-5 py-5 sm:px-6">
        <ReportField label="Confidence">
          <ConfidenceInterpretation
            confidence={confidence}
            prediction={prediction}
          />
        </ReportField>

        <ReportField label="Explainability">
          <ExplainabilityPanel
            prediction={prediction}
            observedRegions={observedRegions}
            layout="stack"
            showTitle={false}
          />
        </ReportField>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <ReportField label="Clinical Suggestion">
            {clinicalSuggestion || "Not recorded"}
          </ReportField>

          <ReportField label="Recommended Next Step">
            {recommendedNextStep || "Not recorded"}
          </ReportField>
        </div>
      </div>

      {showDisclaimer ? (
        <p className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs leading-relaxed text-slate-500 sm:px-6">
          {AI_SCREENING_DISCLAIMER}
        </p>
      ) : null}
    </section>
  );
}
