import { Activity, ScanLine } from "lucide-react";
import { PredictionBadge } from "@/components/ui/Badge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { StudyImage } from "@/components/ui/StudyImage";

/** Decorative product preview for the marketing hero (sample data). */
export function DashboardPreview() {
  return (
    <div className="home-dashboard-preview relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-400/20 via-cyan-400/10 to-transparent blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-2xl shadow-teal-900/10 ring-1 ring-slate-200/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </span>
          <span className="ml-2 flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/80 sm:text-xs">
            <ScanLine className="h-3 w-3 text-teal-600" aria-hidden />
            carevision.local / analyze
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Study preview
            </p>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-200">
              <StudyImage
                src="/placeholder-xray.svg"
                alt="Sample chest X-ray preview"
                fill
                priority
                objectFit="cover"
                className="opacity-90"
                sizes="(max-width: 640px) 50vw, 240px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                PA chest · 224×224
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  AI screening
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  Jane Doe
                </p>
              </div>
              <PredictionBadge label="Pneumonia" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <ConfidenceBar value={0.92} />
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-800/80">
                Grad-CAM focus
              </p>
              <div className="relative mt-2 aspect-[2/1] overflow-hidden rounded-lg bg-slate-900 ring-1 ring-teal-200/50">
                <StudyImage
                  src="/placeholder-heatmap.svg"
                  alt="Sample Grad-CAM heatmap"
                  fill
                  objectFit="cover"
                  className="opacity-95"
                  sizes="240px"
                />
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white">
              <Activity className="h-3.5 w-3.5 text-teal-400" aria-hidden />
              <span className="text-[11px] font-medium">
                Report ready · PDF export
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        Illustrative workflow - not a live patient study
      </p>
    </div>
  );
}
