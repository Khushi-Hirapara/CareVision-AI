import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileText,
  Shield,
  Sparkles,
} from "lucide-react";
import { RecentScansSection } from "@/components/home/RecentScansSection";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-teal-50/50 via-slate-50 to-white">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Local AI · Chest X-Ray Screening
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Clearer chest X-ray insights, faster
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              CareVision AI detects pneumonia patterns, surfaces confidence
              scores, and explains predictions with Grad-CAM—built for local
              research and clinical decision-support workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/analyze" className="btn-primary">
                Analyze X-Ray
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/history" className="btn-secondary">
                View History
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-md ring-1 ring-slate-200/60">
            <div className="border-b border-slate-100 bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-4 text-white">
              <p className="text-sm font-semibold">Workflow</p>
              <p className="text-xs text-teal-50/90">Upload → Analyze → Report</p>
            </div>
            <ol className="space-y-0 divide-y divide-slate-100">
              {[
                "Upload a PNG or JPEG chest X-ray",
                "Run the CNN classifier locally",
                "Review heatmap, history, and PDF report",
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3 bg-white px-5 py-4 text-sm text-slate-700"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="mt-10">
          <MedicalDisclaimer compact />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">
          Why CareVision AI
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Brain,
              title: "Deep learning detection",
              text: "Custom CNN trained on chest radiographs for Normal vs Pneumonia.",
            },
            {
              icon: Shield,
              title: "Explainable AI",
              text: "Grad-CAM heatmaps highlight regions that influenced the model.",
            },
            {
              icon: FileText,
              title: "Clinical workflow",
              text: "Persistent scan history and downloadable PDF reports.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card
              key={title}
              className="flex flex-col gap-3 transition hover:border-teal-200/60 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <RecentScansSection />
    </div>
  );
}
