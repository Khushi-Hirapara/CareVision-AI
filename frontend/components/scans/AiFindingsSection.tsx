import { Sparkles } from "lucide-react";
import { AI_SCREENING_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AiFindingsSectionProps {
  findings: string;
  className?: string;
}

export function AiFindingsSection({ findings, className }: AiFindingsSectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50/80 p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-slate-700">
        <Sparkles className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">AI Findings</p>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{findings}</p>
      <p className="mt-3 border-t border-slate-200/80 pt-3 text-xs leading-relaxed text-slate-500">
        {AI_SCREENING_DISCLAIMER}
      </p>
    </div>
  );
}
