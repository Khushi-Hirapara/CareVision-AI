import Link from "next/link";
import { ArrowRight, FileOutput, ScanSearch, Upload } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload study",
    description:
      "Select a frontal chest radiograph (PNG/JPEG). Add an optional patient identifier for your records.",
  },
  {
    step: "02",
    icon: ScanSearch,
    title: "Run AI analysis",
    description:
      "The model preprocesses, classifies, and generates a Grad-CAM heatmap-all in one request.",
  },
  {
    step: "03",
    icon: FileOutput,
    title: "Review & export",
    description:
      "Inspect confidence, recommendations, scan history, and download a PDF report for documentation.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Three steps from image to insight
            </h2>
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition hover:text-teal-200"
          >
            Try the analyzer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map(({ step, icon: Icon, title, description }, index) => (
            <li
              key={step}
              className="home-step-card relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              {index < steps.length - 1 && (
                <span
                  className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-teal-500/50 to-transparent lg:block"
                  aria-hidden
                />
              )}
              <span className="text-3xl font-bold tabular-nums text-white/20">
                {step}
              </span>
              <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/30">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
