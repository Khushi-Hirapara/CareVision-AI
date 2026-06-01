import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileText,
  History,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { dummyScans, platformStats } from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import { PredictionBadge } from "@/components/ui/Badge";

export default function HomePage() {
  const recentScans = dummyScans.slice(0, 3);

  return (
    <div className="bg-gradient-to-b from-teal-50/60 via-slate-50 to-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-100/80 px-3 py-1 text-xs font-semibold text-teal-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI-Powered Radiology Support
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Clearer chest X-ray insights, faster
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              CareVision AI detects pneumonia patterns, surfaces confidence
              scores, and explains predictions with Grad-CAM—helping clinicians
              review cases with transparency.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Analyze X-Ray
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View History
              </Link>
            </div>
          </div>

          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-teal-50/30 p-0">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">
                Platform overview
              </p>
              <p className="text-xs text-slate-500">Demo statistics</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {[
                { label: "Total scans", value: platformStats.totalScans },
                {
                  label: "Pneumonia flagged",
                  value: platformStats.pneumoniaDetected,
                },
                {
                  label: "Avg. confidence",
                  value: `${Math.round(platformStats.avgConfidence * 100)}%`,
                },
                {
                  label: "Reports generated",
                  value: platformStats.reportsGenerated,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-white px-5 py-4">
                  <p className="text-2xl font-bold text-teal-700">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
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
              text: "CNN-based classification tuned for chest radiographs.",
            },
            {
              icon: Shield,
              title: "Explainable AI",
              text: "Grad-CAM heatmaps show which regions influenced the model.",
            },
            {
              icon: FileText,
              title: "Clinical workflow",
              text: "Scan history and PDF-ready reports in one place.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex flex-col gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent scans</h2>
          <Link
            href="/history"
            className="flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            <History className="h-4 w-4" aria-hidden />
            All history
          </Link>
        </div>
        <div className="grid gap-3">
          {recentScans.map((scan) => (
            <Card
              key={scan.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium text-slate-900">{scan.patientName}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(scan.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PredictionBadge label={scan.prediction} />
                <span className="text-sm font-semibold text-teal-700">
                  {Math.round(scan.confidence * 100)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
