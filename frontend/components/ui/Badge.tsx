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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isPneumonia
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        className,
      )}
    >
      {label}
    </span>
  );
}

const SEVERITY_STYLES: Record<
  Exclude<SeverityLabel, "None">,
  string
> = {
  Mild: "bg-amber-50 text-amber-800 ring-amber-200",
  Moderate: "bg-orange-50 text-orange-800 ring-orange-200",
  Severe: "bg-rose-100 text-rose-900 ring-rose-300",
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
