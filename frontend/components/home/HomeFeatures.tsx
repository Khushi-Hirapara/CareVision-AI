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
    title: "Frictionless intake",
    text: "Drag-and-drop PNG or JPEG studies with optional patient labels-ready for batch research workflows.",
    accent: "from-teal-500/10 to-cyan-500/5",
  },
  {
    icon: Brain,
    title: "Deep learning core",
    text: "EfficientNet-based classifier tuned on chest radiographs for reliable Normal vs Pneumonia separation.",
    accent: "from-violet-500/10 to-indigo-500/5",
  },
  {
    icon: Layers,
    title: "Grad-CAM overlays",
    text: "See which regions drove the model so radiologists and researchers can validate findings visually.",
    accent: "from-amber-500/10 to-orange-500/5",
  },
  {
    icon: LineChart,
    title: "Confidence scoring",
    text: "Calibrated probability outputs with adjustable thresholds for research or triage scenarios.",
    accent: "from-emerald-500/10 to-teal-500/5",
  },
  {
    icon: FileText,
    title: "PDF clinical reports",
    text: "One-click export with study metadata, prediction summary, and recommendations for your records.",
    accent: "from-sky-500/10 to-blue-500/5",
  },
  {
    icon: Shield,
    title: "Account-scoped history",
    text: "JWT-secured API with private scan libraries-only you access your studies and reports.",
    accent: "from-rose-500/10 to-pink-500/5",
  },
];

export function HomeFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
          Platform capabilities
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Everything you need for X-ray screening
        </h2>
        <p className="mt-3 text-base text-slate-600">
          From upload to explainable results-designed for hospitals, labs, and
          ML research teams running CareVision locally.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text, accent }) => (
          <Card
            key={title}
            className="group relative overflow-hidden border-slate-200/80 transition duration-300 hover:-translate-y-0.5 hover:border-teal-200/80 hover:shadow-lg hover:shadow-teal-900/5"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100 ${accent}`}
              aria-hidden
            />
            <div className="relative">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/25">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
