import {
  Brain,
  FileText,
  Layers,
  LineChart,
  Shield,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Upload,
    title: "Flexible study intake",
    text: "Upload PNG, JPEG, or DICOM studies with patient-linked records and pre-inference quality validation.",
    accent: "from-teal-500/10 to-cyan-500/5",
  },
  {
    icon: Brain,
    title: "Condition-specific AI",
    text: "A modular model layer currently provides Normal versus Pneumonia screening and can evolve independently.",
    accent: "from-violet-500/10 to-indigo-500/5",
  },
  {
    icon: Layers,
    title: "Visual explainability",
    text: "Review Grad-CAM overlays, suspicious region labels, affected-area estimates, and localization strength.",
    accent: "from-amber-500/10 to-orange-500/5",
  },
  {
    icon: LineChart,
    title: "Clear confidence context",
    text: "See the score, confidence tier, and plain-language interpretation—separate from disease severity.",
    accent: "from-emerald-500/10 to-teal-500/5",
  },
  {
    icon: FileText,
    title: "Clinical documentation",
    text: "Export hospital-style PDF reports with patient and doctor details, images, recommendations, and QR access.",
    accent: "from-sky-500/10 to-blue-500/5",
  },
  {
    icon: Shield,
    title: "Secure longitudinal review",
    text: "Use role-based records, doctor notes, scan comparison, and trend views without exposing studies publicly.",
    accent: "from-rose-500/10 to-pink-500/5",
  },
];

export function HomeFeatures() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-400">
          Platform capabilities
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Designed for clear, explainable review
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Every capability supports a traceable workflow—from image validation
          to professional documentation.
        </p>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-5 md:grid-cols-2">
        {features.map(({ icon: Icon, title, text, accent }) => (
          <Card
            key={title}
            className="group relative overflow-hidden border-white/10 bg-white/[0.04] p-5 shadow-none transition duration-300 hover:border-teal-400/30 hover:bg-white/[0.07]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100 ${accent}`}
              aria-hidden
            />
            <div className="relative flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/20">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </div>
    </section>
  );
}
