import Link from "next/link";
import {
  ArrowRight,
  FileOutput,
  ScanSearch,
  Stethoscope,
  Upload,
} from "lucide-react";

const steps = [
  {
    step: "1",
    icon: Upload,
    title: "Upload chest X-ray",
    description:
      "Add a frontal chest radiograph in PNG, JPEG, or DICOM format and select the patient record.",
  },
  {
    step: "2",
    icon: ScanSearch,
    title: "Validate & analyze",
    description:
      "Quality checks run first; then the active condition model generates its screening result.",
  },
  {
    step: "3",
    icon: FileOutput,
    title: "Review explainability",
    description:
      "Inspect confidence interpretation, severity, suspicious regions, and the Grad-CAM overlay.",
  },
  {
    step: "4",
    icon: Stethoscope,
    title: "Document next steps",
    description:
      "Add clinical notes, compare scans, and export a hospital-style PDF for professional review.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From X-ray to review in four clear steps
            </h2>
            <p className="mt-4 text-base text-slate-600">
              A consistent workflow today, designed to support additional
              validated condition modules in the future.
            </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          >
            Open the current pneumonia analyzer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="relative mt-12">
          <div
            className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent lg:block"
            aria-hidden
          />
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, icon: Icon, title, description }) => (
            <li
              key={step}
              className="group text-center"
            >
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-teal-50 text-lg font-bold text-teal-700 ring-1 ring-teal-100 transition group-hover:bg-teal-600 group-hover:text-white">
                {step}
              </span>
              <span className="mx-auto mt-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
