import { cn } from "@/lib/utils";
import {
  getConfidenceTier,
  tierGaugeClass,
  type ConfidenceTier,
} from "@/lib/confidence-interpretation";

interface ConfidenceGaugeProps {
  /** Value from 0–100. */
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Override tier coloring (defaults from value). */
  tier?: ConfidenceTier;
}

const SIZE = {
  sm: { box: 72, stroke: 6, font: "text-lg", label: "text-[10px]" },
  md: { box: 96, stroke: 7, font: "text-2xl", label: "text-[11px]" },
  lg: { box: 120, stroke: 8, font: "text-3xl", label: "text-xs" },
} as const;

export function ConfidenceGauge({
  value,
  label = "Confidence",
  size = "md",
  className,
  tier: tierOverride,
}: ConfidenceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const tier = tierOverride ?? getConfidenceTier(clamped);
  const dims = SIZE[size];
  const radius = (dims.box - dims.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const center = dims.box / 2;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: dims.box, height: dims.box }}
        role="img"
        aria-label={`${label}: ${clamped.toFixed(1)} percent`}
      >
        <svg
          width={dims.box}
          height={dims.box}
          viewBox={`0 0 ${dims.box} ${dims.box}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={dims.stroke}
            className="stroke-slate-200"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={dims.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn("transition-all duration-700 ease-out", tierGaugeClass(tier))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums text-slate-900", dims.font)}>
            {clamped % 1 === 0 ? clamped.toFixed(0) : clamped.toFixed(1)}%
          </span>
        </div>
      </div>
      {label ? (
        <p
          className={cn(
            "mt-2 text-center font-semibold uppercase tracking-[0.08em] text-slate-500",
            dims.label,
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
