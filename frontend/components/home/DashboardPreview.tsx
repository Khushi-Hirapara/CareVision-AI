import {
  Activity,
  CheckCircle2,
  FileText,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { StudyImage } from "@/components/ui/StudyImage";

const findings = [
  "Pneumonia-like opacity pattern detected.",
  "Primary activation in the right lower lung.",
  "No image-quality limitation identified.",
];

/** Decorative CareVision workspace preview using illustrative, non-patient data. */
export function DashboardPreview() {
  return (
    <div className="home-dashboard-preview relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-5 rounded-[2.25rem] bg-gradient-to-br from-teal-300/25 via-cyan-300/10 to-sky-200/20 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-teal-950/10 ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-3.5 py-3 text-white sm:px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm shadow-cyan-950/30">
              <Activity className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold">CareVision AI</p>
              <p className="text-[8px] text-slate-400">Clinical review workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[8px] text-slate-400 sm:gap-4">
            <span>
              STUDY <b className="ml-1 font-medium text-slate-200">PA Chest</b>
            </span>
            <span className="hidden sm:inline">
              MODULE <b className="ml-1 font-medium text-slate-200">Pneumonia</b>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Complete
            </span>
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-500" />

        <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:border-b-0 sm:border-r sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Study image
              </p>
              <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-slate-500 ring-1 ring-slate-200">
                Quality passed
              </span>
            </div>
            <div className="relative aspect-[4/5] max-h-[300px] overflow-hidden rounded-xl bg-slate-950 shadow-inner ring-1 ring-slate-800/10">
              <StudyImage
                src="/carevision-demo-chest-xray.png"
                alt="Synthetic frontal chest X-ray in the CareVision review workspace"
                fill
                priority
                objectFit="contain"
                className="opacity-95"
                sizes="(max-width: 640px) 90vw, 260px"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/75 px-2 py-1 text-[8px] font-medium text-white backdrop-blur">
                PA chest · illustrative study
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-800">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Simplified explanation
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[7px] font-semibold text-emerald-700">
                  Decision support
                </span>
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-emerald-950/75">
                The model found an opacity pattern that may be consistent with
                pneumonia. A clinician should review the study and symptoms.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <section>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-800">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  AI screening findings
                </p>
                <span className="text-[8px] text-slate-400">3 findings</span>
              </div>
              <ol className="mt-2 space-y-1.5">
                {findings.map((finding, index) => (
                  <li
                    key={finding}
                    className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-2.5 py-2"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-sky-100 text-[8px] font-bold text-sky-700">
                      {index + 1}
                    </span>
                    <p className="text-[9px] leading-relaxed text-slate-700">
                      {finding}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-800">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Impression
              </p>
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/75 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                    Primary
                  </span>
                  <p className="text-[9px] font-medium text-amber-950">
                    Pneumonia pattern suspected
                  </p>
                </div>
                <p className="mt-1.5 text-[8px] italic leading-relaxed text-amber-900/70">
                  Right lower lung localization · moderate AI severity
                </p>
              </div>
            </section>

            <section>
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Next steps & recommendations
              </p>
              <div className="mt-2 space-y-1.5">
                {[
                  "Correlate with symptoms and clinical examination.",
                  "Request qualified radiology review.",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-2.5 py-2"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    <p className="text-[8px] leading-relaxed text-emerald-950/75">
                      {index + 1}. {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-slate-950 px-2 py-2 text-center text-white">
                <p className="text-[7px] uppercase text-slate-400">Confidence</p>
                <p className="mt-0.5 text-xs font-bold text-teal-300">92%</p>
              </div>
              <div className="rounded-lg bg-rose-50 px-2 py-2 text-center ring-1 ring-rose-100">
                <p className="text-[7px] uppercase text-rose-500">Affected</p>
                <p className="mt-0.5 text-xs font-bold text-rose-700">18%</p>
              </div>
              <div className="rounded-lg bg-teal-50 px-2 py-2 text-center ring-1 ring-teal-100">
                <p className="text-[7px] uppercase text-teal-600">Heatmap</p>
                <p className="mt-0.5 text-xs font-bold text-teal-800">89%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-t border-slate-100 bg-slate-50/70 sm:grid-cols-2">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 sm:border-b-0 sm:border-r">
            <MessageCircle className="h-3.5 w-3.5 text-violet-500" aria-hidden />
            <p className="text-[9px] text-slate-600">
              Ask AI about confidence, regions, and next steps
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5">
            <FileText className="h-3.5 w-3.5 text-teal-600" aria-hidden />
            <p className="text-[9px] font-medium text-slate-700">
              Hospital-style PDF report ready
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        Illustrative CareVision workflow — not a live patient study
      </p>
    </div>
  );
}
