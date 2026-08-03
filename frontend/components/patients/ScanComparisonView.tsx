"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  GitCompareArrows,
  LineChart,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StudyImage } from "@/components/ui/StudyImage";
import { ScanHistorySkeleton } from "@/components/history/ScanHistorySkeleton";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import {
  fetchPatientById,
  fetchPatientScans,
  fetchPatients,
  patientReportsPath,
  patientTrendsPath,
  type PatientRecord,
} from "@/lib/patients";
import {
  compareScans,
  formatScanDateHeading,
  formatScanOptionLabel,
  resolveComparisonPair,
} from "@/lib/scan-comparison";
import type { ScanRecord } from "@/lib/types";
import { formatPercent, cn } from "@/lib/utils";
import { PATIENTS_PATH } from "@/lib/nav-links";

interface ScanComparisonViewProps {
  patientId: number;
  /** Optional pre-selected scan ids from query params. */
  initialBaselineId?: string;
  initialFollowUpId?: string;
}

function ScanColumn({
  scan,
  label,
}: {
  scan: ScanRecord;
  label: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {formatScanDateHeading(scan)}
        </p>
      </div>
      <div className="relative aspect-[4/5] bg-slate-950">
        <StudyImage
          src={scan.imagePath}
          alt={`Chest X-ray from ${formatScanDateHeading(scan)}`}
          fill
          objectFit="contain"
          className="p-2"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <PredictionBadge label={scan.prediction} />
          <SeverityBadge severity={scan.severity} />
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-slate-500">Confidence</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {formatPercent(scan.confidence)}
          </span>
        </div>
        {scan.severity !== "None" ? (
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-500">Severity</span>
            <span className="font-semibold text-slate-900">{scan.severity}</span>
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-500">Severity</span>
            <span className="font-semibold text-slate-900">None</span>
          </div>
        )}
        <Link
          href={`/scans/${scan.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Open details
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

export function ScanComparisonView({
  patientId,
  initialBaselineId,
  initialFollowUpId,
}: ScanComparisonViewProps) {
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [baselineId, setBaselineId] = useState(initialBaselineId ?? "");
  const [followUpId, setFollowUpId] = useState(initialFollowUpId ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const scanData = await fetchPatientScans(patientId, 200);
      setScans(scanData);

      try {
        setPatient(await fetchPatientById(patientId));
      } catch {
        const list = await fetchPatients();
        const match = list.find((p) => p.id === patientId) ?? null;
        if (match) {
          setPatient(match);
        } else if (scanData[0]) {
          setPatient({
            id: patientId,
            doctorId: 0,
            userId: null,
            name: scanData[0].patientName,
            age: null,
            gender: null,
            phone: null,
            email: null,
            createdAt: scanData[0].createdAt,
          });
        }
      }

      const pair = resolveComparisonPair(scanData, {
        baselineId: initialBaselineId,
        followUpId: initialFollowUpId,
      });
      if (pair) {
        setBaselineId(pair.baselineId);
        setFollowUpId(pair.followUpId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load patient scans.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId, initialBaselineId, initialFollowUpId]);

  useEffect(() => {
    void load();
  }, [load]);

  const baseline = useMemo(
    () => scans.find((s) => s.id === baselineId) ?? null,
    [scans, baselineId],
  );
  const followUp = useMemo(
    () => scans.find((s) => s.id === followUpId) ?? null,
    [scans, followUpId],
  );

  const comparison = useMemo(() => {
    if (!baseline || !followUp || baseline.id === followUp.id) return null;
    try {
      return compareScans(baseline, followUp);
    } catch {
      return null;
    }
  }, [baseline, followUp]);

  const orderedScans = useMemo(
    () =>
      [...scans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [scans],
  );

  const patientLabel = patient?.name ?? "Patient";

  return (
    <div className="page-content flex flex-1 flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={patientReportsPath(patientId)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to reports
        </Link>
        <Link
          href={patientTrendsPath(patientId)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <LineChart className="h-3.5 w-3.5" aria-hidden />
          AI Trends
        </Link>
        <Link
          href={PATIENTS_PATH}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Patients
        </Link>
      </div>

      <PageHeader
        title={`${patientLabel} — Scan Comparison`}
        description="Compare two chest X-ray screenings to track treatment progress over time."
      />

      {isLoading && <ScanHistorySkeleton />}

      {!isLoading && error && (
        <ErrorAlert title="Comparison unavailable" message={error} />
      )}

      {!isLoading && !error && scans.length < 2 && (
        <DashboardEmptyState
          icon={GitCompareArrows}
          title="Need at least two scans"
          description={`${patientLabel} needs two or more saved scans before a comparison can be generated.`}
          className="min-h-[320px]"
          action={
            <Link href={`/analyze?patientId=${patientId}`} className="btn-primary">
              Analyze another X-ray
            </Link>
          }
        />
      )}

      {!isLoading && !error && scans.length >= 2 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Earlier scan (baseline)
              </span>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-teal-600/20 focus:border-teal-500 focus:ring-2"
              >
                {orderedScans.map((scan) => (
                  <option key={scan.id} value={scan.id} disabled={scan.id === followUpId}>
                    {formatScanOptionLabel(scan)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Later scan (follow-up)
              </span>
              <select
                value={followUpId}
                onChange={(e) => setFollowUpId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-teal-600/20 focus:border-teal-500 focus:ring-2"
              >
                {orderedScans.map((scan) => (
                  <option key={scan.id} value={scan.id} disabled={scan.id === baselineId}>
                    {formatScanOptionLabel(scan)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {comparison ? (
            <div className="space-y-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
                <ScanColumn scan={comparison.earlier} label="Baseline" />

                <div className="flex items-center justify-center py-2 lg:py-24">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <ArrowDown className="h-6 w-6 lg:hidden" aria-hidden />
                    <ArrowRight className="hidden h-6 w-6 lg:block" aria-hidden />
                  </span>
                </div>

                <ScanColumn scan={comparison.later} label="Follow-up" />
              </div>

              <Card
                className={cn(
                  "overflow-hidden border p-0 shadow-sm",
                  comparison.trend === "improved" &&
                    "border-emerald-200/90 dark:border-emerald-500/30",
                  comparison.trend === "worsened" &&
                    "border-rose-200/90 dark:border-rose-500/30",
                  comparison.trend === "stable" &&
                    "border-slate-200/90 dark:border-slate-600/60",
                )}
              >
                <div
                  className={cn(
                    "border-b px-5 py-5 sm:px-6",
                    comparison.trend === "improved" &&
                      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50/40 dark:border-emerald-500/25 dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-teal-500/5",
                    comparison.trend === "worsened" &&
                      "border-rose-200/80 bg-gradient-to-br from-rose-50 via-rose-50/80 to-orange-50/30 dark:border-rose-500/25 dark:from-rose-500/15 dark:via-rose-500/10 dark:to-orange-500/5",
                    comparison.trend === "stable" &&
                      "border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50/70 dark:border-slate-600/50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-950",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.14em]",
                      comparison.trend === "improved" &&
                        "text-emerald-700 dark:text-emerald-300",
                      comparison.trend === "worsened" &&
                        "text-rose-700 dark:text-rose-300",
                      comparison.trend === "stable" &&
                        "text-slate-600 dark:text-slate-300",
                    )}
                  >
                    AI Comparison
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
                        comparison.trend === "improved" &&
                          "bg-emerald-100 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/40",
                        comparison.trend === "worsened" &&
                          "bg-rose-100 text-rose-700 ring-rose-200/80 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-400/40",
                        comparison.trend === "stable" &&
                          "bg-slate-100 text-slate-600 ring-slate-200/80 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-500/50",
                      )}
                    >
                      {comparison.trend === "improved" ? (
                        <TrendingUp className="h-5 w-5" aria-hidden />
                      ) : comparison.trend === "worsened" ? (
                        <TrendingDown className="h-5 w-5" aria-hidden />
                      ) : (
                        <Minus className="h-5 w-5" aria-hidden />
                      )}
                    </span>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          comparison.trend === "improved" &&
                            "text-emerald-700 dark:text-emerald-300",
                          comparison.trend === "worsened" &&
                            "text-rose-700 dark:text-rose-300",
                          comparison.trend === "stable" &&
                            "text-slate-600 dark:text-slate-300",
                        )}
                      >
                        {comparison.trend === "improved"
                          ? "Improvement"
                          : comparison.trend === "worsened"
                            ? "Worsening"
                            : "Stable"}
                      </p>
                      <p
                        className={cn(
                          "text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                          comparison.trend === "improved" &&
                            "text-emerald-800 dark:text-emerald-200",
                          comparison.trend === "worsened" &&
                            "text-rose-800 dark:text-rose-200",
                          comparison.trend === "stable" &&
                            "text-slate-800 dark:text-slate-100",
                        )}
                      >
                        {Math.abs(comparison.improvementPct)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:gap-5 sm:px-6 dark:bg-slate-900/40">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-700/70 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                      Opacity
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {comparison.opacityLabel}
                    </p>
                    {comparison.opacityEarlierPct !== null &&
                    comparison.opacityLaterPct !== null ? (
                      <p className="mt-1 text-sm tabular-nums text-slate-600 dark:text-slate-400">
                        {comparison.opacityEarlierPct}% → {comparison.opacityLaterPct}%
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-700/70 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                      Severity
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                      <span className="text-slate-500 dark:text-slate-400">
                        {comparison.severityFrom}
                      </span>
                      <span className="mx-1.5 text-slate-400 dark:text-slate-500">→</span>
                      <span
                        className={cn(
                          comparison.trend === "worsened" &&
                            "text-rose-700 dark:text-rose-300",
                          comparison.trend === "improved" &&
                            "text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {comparison.severityTo}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-700/70 dark:bg-slate-950/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                      Prediction
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                      <span className="text-slate-500 dark:text-slate-400">
                        {comparison.predictionFrom}
                      </span>
                      <span className="mx-1.5 text-slate-400 dark:text-slate-500">→</span>
                      <span
                        className={cn(
                          comparison.trend === "worsened" &&
                            "text-rose-700 dark:text-rose-300",
                          comparison.trend === "improved" &&
                            "text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {comparison.predictionTo}
                      </span>
                    </p>
                  </div>
                </div>

                <p
                  className={cn(
                    "border-t px-5 py-3.5 text-sm leading-relaxed sm:px-6",
                    comparison.trend === "improved" &&
                      "border-emerald-100 bg-emerald-50/50 text-emerald-900/80 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-100/80",
                    comparison.trend === "worsened" &&
                      "border-rose-100 bg-rose-50/50 text-rose-900/80 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-100/80",
                    comparison.trend === "stable" &&
                      "border-slate-100 bg-slate-50/80 text-slate-600 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-300",
                  )}
                >
                  {comparison.summary} This is an AI-assisted progress estimate for
                  screening studies and does not replace clinical judgment.
                </p>
              </Card>
            </div>
          ) : (
            <ErrorAlert
              title="Select two different scans"
              message="Choose a baseline scan and a different follow-up scan to generate the AI comparison."
            />
          )}
        </>
      )}
    </div>
  );
}
