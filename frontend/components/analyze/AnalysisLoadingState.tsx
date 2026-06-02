import { Loader2, Scan } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function AnalysisLoadingState() {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/20" />
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Scan className="h-8 w-8" aria-hidden />
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" aria-hidden />
          Analyzing X-ray…
        </div>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500 sm:text-sm">
          Uploading your study and running pneumonia screening on the server…
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="h-3 animate-pulse rounded-full bg-slate-200/80" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200/80" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="aspect-square animate-pulse rounded-xl bg-slate-200/80" />
          <div className="aspect-square animate-pulse rounded-xl bg-slate-200/80" />
        </div>
      </div>
    </Card>
  );
}
