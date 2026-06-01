import { formatPercent } from "@/lib/utils";

interface ConfidenceBarProps {
  value: number;
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const percent = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-slate-600">Confidence</span>
        <span className="font-semibold text-teal-700">{formatPercent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
