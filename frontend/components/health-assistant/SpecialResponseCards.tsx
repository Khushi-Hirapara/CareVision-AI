"use client";

import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import type {
  ComparisonScanSnapshot,
  HealthChatCard,
} from "@/lib/health-assistant";
import type { PredictionLabel, SeverityLabel } from "@/lib/types";
import { AlertTriangle, FileText, Sparkles } from "lucide-react";

function asPrediction(value: unknown): PredictionLabel {
  return value === "Pneumonia" ? "Pneumonia" : "Normal";
}

function asSeverity(value: unknown): SeverityLabel {
  if (value === "Mild" || value === "Moderate" || value === "Severe") {
    return value;
  }
  return "None";
}

function PredictionCard({ data }: { data: Record<string, unknown> }) {
  const prediction = asPrediction(data.prediction ?? data.label);
  return (
    <div className="health-special-card">
      <p className="health-special-card__label">Screening prediction</p>
      <PredictionBadge label={prediction} className="mt-1 text-sm" />
    </div>
  );
}

function ConfidenceCard({ data }: { data: Record<string, unknown> }) {
  const pct = Number(data.confidence_pct ?? 0);
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="health-special-card">
      <div className="flex items-center justify-between gap-2">
        <p className="health-special-card__label">Model confidence</p>
        <span className="text-sm font-semibold text-teal-700">{clamped.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {typeof data.prediction === "string" ? (
        <p className="mt-2 text-xs text-slate-500">
          For screening label: {String(data.prediction)}
        </p>
      ) : null}
    </div>
  );
}

function SeverityCard({ data }: { data: Record<string, unknown> }) {
  const severity = asSeverity(data.severity);
  return (
    <div className="health-special-card">
      <p className="health-special-card__label">Severity</p>
      <div className="mt-1">
        {severity === "None" ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            None
          </span>
        ) : (
          <SeverityBadge severity={severity} />
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="health-special-card health-special-card--accent">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
        <p className="health-special-card__label">Recommendation</p>
      </div>
      {data.recommendation ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {String(data.recommendation)}
        </p>
      ) : null}
      {data.follow_up ? (
        <p className="mt-2 border-t border-teal-100 pt-2 text-sm text-slate-600 whitespace-pre-wrap">
          <span className="font-medium text-slate-800">Follow-up: </span>
          {String(data.follow_up)}
        </p>
      ) : null}
    </div>
  );
}

function DoctorNotesCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="health-special-card">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-500" aria-hidden />
        <p className="health-special-card__label">Doctor notes</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
        {String(data.notes ?? "No doctor notes recorded.")}
      </p>
    </div>
  );
}

function SnapshotColumn({
  title,
  snap,
}: {
  title: string;
  snap: ComparisonScanSnapshot;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200/80">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-500">{snap.date}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <PredictionBadge label={asPrediction(snap.prediction)} />
        <SeverityBadge severity={asSeverity(snap.severity)} />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-700">
        {snap.confidence_pct.toFixed(1)}% confidence
      </p>
    </div>
  );
}

function ComparisonCard({ data }: { data: Record<string, unknown> }) {
  const earlier = data.earlier as ComparisonScanSnapshot | undefined;
  const later = data.later as ComparisonScanSnapshot | undefined;
  const trendLabel = String(data.trend_label ?? "Comparison");
  const summary = String(data.summary ?? "");
  const trend = String(data.trend ?? "stable");

  const trendColor =
    trend === "improved"
      ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
      : trend === "worsened"
        ? "text-rose-700 bg-rose-50 ring-rose-200"
        : "text-slate-700 bg-slate-50 ring-slate-200";

  return (
    <div className="health-special-card">
      <div className="flex flex-wrap items-center gap-2">
        <p className="health-special-card__label">Scan comparison timeline</p>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${trendColor}`}
        >
          {trendLabel}
        </span>
      </div>
      {summary ? (
        <p className="mt-2 text-sm text-slate-600">{summary}</p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {earlier ? <SnapshotColumn title="Previous" snap={earlier} /> : null}
        {later ? <SnapshotColumn title="Latest" snap={later} /> : null}
      </div>
    </div>
  );
}

function EmergencyCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-rose-900">Emergency guidance</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-800 whitespace-pre-wrap">
            {String(data.message ?? "Seek emergency care immediately.")}
          </p>
        </div>
      </div>
    </div>
  );
}

function DisclaimerCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
      {String(data.text ?? "")}
    </div>
  );
}

interface SpecialResponseCardsProps {
  cards: HealthChatCard[];
}

export function SpecialResponseCards({ cards }: SpecialResponseCardsProps) {
  if (!cards.length) return null;

  return (
    <div className="mt-3 space-y-2.5">
      {cards.map((card, index) => {
        const key = `${card.type}-${index}`;
        switch (card.type) {
          case "prediction":
            return <PredictionCard key={key} data={card.data} />;
          case "confidence":
            return <ConfidenceCard key={key} data={card.data} />;
          case "severity":
            return <SeverityCard key={key} data={card.data} />;
          case "recommendation":
            return <RecommendationCard key={key} data={card.data} />;
          case "doctor_notes":
            return <DoctorNotesCard key={key} data={card.data} />;
          case "comparison":
            return <ComparisonCard key={key} data={card.data} />;
          case "emergency":
            return <EmergencyCard key={key} data={card.data} />;
          case "disclaimer":
            return <DisclaimerCard key={key} data={card.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
