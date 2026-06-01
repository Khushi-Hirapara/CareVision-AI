import type { PredictionLabel } from "@/lib/types";
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
