import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function MedicalDisclaimer({ className, compact }: MedicalDisclaimerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50/90 text-amber-950",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        className,
      )}
    >
      <ShieldAlert
        className={cn("shrink-0 text-amber-600", compact ? "h-4 w-4" : "h-5 w-5")}
        aria-hidden
      />
      <p className="leading-relaxed">
        CareVision AI provides AI-assisted preliminary screening only-not a final
        medical diagnosis. Always follow guidance from qualified healthcare
        professionals.
      </p>
    </div>
  );
}
