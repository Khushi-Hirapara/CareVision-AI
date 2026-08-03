import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpRecommendationSectionProps {
  followUpRecommendation: string;
  /** Abnormal scans use urgent styling; normal uses calm styling. */
  variant?: "normal" | "pneumonia" | "covid";
  className?: string;
}

export function FollowUpRecommendationSection({
  followUpRecommendation,
  variant = "normal",
  className,
}: FollowUpRecommendationSectionProps) {
  const isUrgent = variant === "pneumonia" || variant === "covid";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isUrgent
          ? "border-rose-200/90 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10"
          : "border-sky-100 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/10",
        className,
      )}
      aria-label="Follow-up recommendation"
    >
      <div
        className={cn(
          "mb-2 flex items-center gap-2",
          isUrgent
            ? "text-rose-900 dark:text-rose-300"
            : "text-sky-900 dark:text-sky-300",
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
