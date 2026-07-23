import Link from "next/link";
import {
  ArrowRight,
  FileOutput,
  ScanSearch,
  Stethoscope,
  Upload,
} from "lucide-react";
import { FeatureIcon } from "@/components/ui/FeatureIcon";

const steps = [
  {
    step: "1",
    icon: Upload,
    tone: "teal" as const,
    title: "Upload chest X-ray",
    description:
      "Add a frontal chest radiograph in PNG, JPEG, or DICOM format and select the patient record.",
  },
  {
    step: "2",
    icon: ScanSearch,
    tone: "cyan" as const,
    title: "Validate & analyze",
    description:
      "Quality checks run first; then the active condition model generates its screening result.",
  },
  {
    step: "3",
    icon: FileOutput,
    tone: "violet" as const,
    title: "Review explainability",
    description:
      "Inspect confidence interpretation, severity, suspicious regions, and the Grad-CAM overlay.",
  },
  {
    step: "4",
    icon: Stethoscope,
    tone: "emerald" as const,
    title: "Document next steps",
    description:
      "Add clinical notes, compare scans, and export a hospital-style PDF for professional review.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white dark:bg-slate-950">
      <div className="w-full px-3 py-16 sm:px-5 sm:py-20 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            From X-ray to review in four clear steps
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            A consistent workflow today, designed to support additional
            validated condition modules in the future.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Open the current pneumonia analyzer
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </Link>
        </div>

        <div className="relative mt-14">
          <div
            className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-transparent via-teal-300/80 to-transparent dark:via-teal-500/40 lg:block"
            aria-hidden
          />
          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ step, icon, tone, title, description }) => (
              <li key={step} className="group text-center">
                <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-teal-50 to-cyan-50 text-lg font-bold text-teal-700 shadow-md shadow-teal-600/10 ring-1 ring-teal-200/80 transition group-hover:from-teal-500 group-hover:to-cyan-600 group-hover:text-white group-hover:shadow-teal-600/25 dark:border-slate-900 dark:from-teal-950 dark:to-cyan-950 dark:text-teal-300 dark:ring-teal-700/50 dark:group-hover:from-teal-500 dark:group-hover:to-cyan-600 dark:group-hover:text-white">
                  {step}
                </span>
                <div className="mx-auto mt-5 flex justify-center">
                  <FeatureIcon icon={icon} tone={tone} size="lg" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
