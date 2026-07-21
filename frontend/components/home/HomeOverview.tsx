import {
  BrainCircuit,
  FileCheck2,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

const points = [
  {
    icon: ScanSearch,
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
    title: "Focused chest X-ray screening",
    text: "CareVision currently evaluates frontal chest radiographs for Normal versus Pneumonia patterns.",
  },
  {
    icon: BrainCircuit,
    tone: "bg-violet-50 text-violet-600 ring-violet-100",
    title: "Explainable model output",
    text: "Confidence interpretation, Grad-CAM overlays, region labels, and affected-area estimates make results easier to review.",
  },
  {
    icon: FileCheck2,
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    title: "Structured clinical workflow",
    text: "Patient records, scan history, comparisons, notes, recommendations, and hospital-style PDF reports stay connected.",
  },
  {
    icon: ShieldCheck,
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
    title: "Built for responsible assistance",
    text: "Results support—not replace—qualified clinical interpretation. Access remains role-based and account-scoped.",
  },
];

export function HomeOverview() {
  return (
    <section className="border-y border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
            About the platform
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What is CareVision AI screening?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            A modular medical-imaging workspace that turns a chest X-ray into an
            explainable screening result, a reviewable patient record, and a
            clear clinical report.
          </p>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {points.map(({ icon: Icon, tone, title, text }) => (
            <article key={title} className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
