import type { PredictionLabel, SeverityLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: PredictionLabel;
  className?: string;
}

export function PredictionBadge({ label, className }: BadgeProps) {
  const isPneumonia = label === "Pneumonia";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        isPneumonia
          ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/40 dark:shadow-[0_0_12px_rgb(244_63_94/0.2)]"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/40 dark:shadow-[0_0_12px_rgb(16_185_129/0.2)]",
        className,
      )}
    >
      {label}
    </span>
  );
}

const SEVERITY_STYLES: Record<Exclude<SeverityLabel, "None">, string> = {
  Mild: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/40",
  Moderate:
    "bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/40",
  Severe:
    "bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-400/50 dark:shadow-[0_0_12px_rgb(244_63_94/0.25)]",
};

interface SeverityBadgeProps {
  severity: SeverityLabel;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  if (severity === "None") {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        SEVERITY_STYLES[severity],
        className,
      )}
    >
      {severity} severity
    </span>
  );
}
