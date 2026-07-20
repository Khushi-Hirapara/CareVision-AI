import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpRecommendationSectionProps {
  followUpRecommendation: string;
  /** Pneumonia scans use urgent styling; normal uses calm styling. */
  variant?: "normal" | "pneumonia";
  className?: string;
}

export function FollowUpRecommendationSection({
  followUpRecommendation,
  variant = "normal",
  className,
}: FollowUpRecommendationSectionProps) {
  const isPneumonia = variant === "pneumonia";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isPneumonia
          ? "border-amber-200/90 bg-amber-50/80"
          : "border-sky-100 bg-sky-50/60",
        className,
      )}
      aria-label="Follow-up recommendation"
    >
      <div
        className={cn(
          "mb-2 flex items-center gap-2",
          isPneumonia ? "text-amber-900" : "text-sky-900",
        )}
      >
        <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">
          Follow-up Recommendation
        </p>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        {followUpRecommendation}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        For your information only. Your care team may provide additional guidance.
      </p>
    </div>
  );
}
