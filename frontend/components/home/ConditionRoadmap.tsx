import {
  Activity,
  CircleDot,
  HeartPulse,
  ShieldPlus,
} from "lucide-react";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { cn } from "@/lib/utils";

const modules = [
  {
    icon: HeartPulse,
    tone: "solid" as const,
    title: "Pneumonia Screening",
    description:
      "Normal versus Pneumonia classification with confidence, severity, and explainable localization.",
    status: "Available now",
    live: true,
  },
  {
    icon: ShieldPlus,
    tone: "sky" as const,
    title: "COVID-19 Patterns",
    description:
      "A future chest-radiography module for condition-specific screening and structured reporting.",
    status: "Planned",
    live: false,
  },
  {
    icon: CircleDot,
    tone: "violet" as const,
    title: "Tuberculosis Patterns",
    description:
      "Planned support for additional pulmonary pattern analysis within the same clinical workflow.",
    status: "Roadmap",
    live: false,
  },
  {
    icon: Activity,
    tone: "slate" as const,
    title: "Additional Chest Findings",
    description:
      "An extensible path for carefully validated condition models without redesigning the workspace.",
    status: "Future",
    live: false,
  },
];

export function ConditionRoadmap() {
  return (
    <section className="bg-slate-50/70 dark:bg-slate-900/40">
      <div className="w-full px-3 py-16 sm:px-5 sm:py-20 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
              Modular condition support
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              One platform, built to grow responsibly
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Pneumonia screening is available today. Additional conditions will
              be introduced only as dedicated models and validation become ready.
            </p>
          </div>
          <p className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
            Roadmap modules are not currently available and must not be treated as
            active diagnostic capabilities.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(({ icon, tone, title, description, status, live }) => (
            <article
              key={title}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-950",
                live
                  ? "border-teal-200 ring-1 ring-teal-100 dark:border-teal-700/50 dark:ring-teal-900/60"
                  : "border-slate-200/80 dark:border-slate-700",
              )}
            >
              {live ? (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"
                  aria-hidden
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <FeatureIcon icon={icon} tone={tone} size="md" />
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                    live
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {status}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
