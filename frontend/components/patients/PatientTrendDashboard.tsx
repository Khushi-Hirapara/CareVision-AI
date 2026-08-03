"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Crosshair,
  GitCompareArrows,
  LineChart,
  ScanLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { ScanHistorySkeleton } from "@/components/history/ScanHistorySkeleton";
import {
  TrendBarChart,
  TrendLineChart,
} from "@/components/patients/charts/TrendCharts";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  fetchPatientById,
  fetchPatientScans,
  fetchPatients,
  patientComparePath,
  patientReportsPath,
  type PatientRecord,
} from "@/lib/patients";
import { buildPatientTrendData } from "@/lib/patient-trends";
import type { ScanRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PATIENTS_PATH } from "@/lib/nav-links";

interface PatientTrendDashboardProps {
  patientId: number;
}

const SEVERITY_TICKS = [0, 1, 2, 3];
const SEVERITY_LABELS = ["None", "Mild", "Mod.", "Severe"] as const;

function formatSeverityTick(value: number): string {
  return SEVERITY_LABELS[Math.round(value)] ?? String(value);
}

export function PatientTrendDashboard({ patientId }: PatientTrendDashboardProps) {
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load patient trends.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const trends = useMemo(() => buildPatientTrendData(scans), [scans]);
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
          href={PATIENTS_PATH}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Patients
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={`${patientLabel} — AI Trend Dashboard`}
          description="Scan history, pneumonia patterns, confidence, severity progression, and recovery timeline."
        />
        {scans.length >= 2 ? (
          <Link
            href={patientComparePath(patientId)}
            className="btn-secondary inline-flex shrink-0 items-center gap-2"
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            Compare Scans
          </Link>
        ) : null}
      </div>

      {isLoading && <ScanHistorySkeleton />}

      {!isLoading && error && (
        <ErrorAlert title="Trends unavailable" message={error} />
      )}

      {!isLoading && !error && scans.length === 0 && (
        <DashboardEmptyState
          icon={LineChart}
          title="No trend data yet"
          description={`${patientLabel} has no saved scans. Run an analysis to start the history dashboard.`}
          className="min-h-[320px]"
          action={
            <Link href={`/analyze?patientId=${patientId}`} className="btn-primary">
              Analyze X-Ray
            </Link>
          }
        />
      )}

      {!isLoading && !error && scans.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardStatCard
              label="Number of scans"
              value={trends.summary.totalScans}
              sub={
                trends.summary.firstScanAt && trends.summary.lastScanAt
                  ? `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(trends.summary.firstScanAt))} – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(trends.summary.lastScanAt))}`
                  : undefined
              }
              accent="teal"
              icon={ScanLine}
            />
            <DashboardStatCard
              label="Pneumonia history"
              value={`${trends.summary.pneumoniaScans}/${trends.summary.totalScans}`}
              sub={`${trends.summary.pneumoniaRatePct}% of scans flagged pneumonia`}
              accent="rose"
              icon={Activity}
            />
            <DashboardStatCard
              label="Average confidence"
              value={`${trends.summary.averageConfidencePct}%`}
              sub={`${trends.summary.normalScans} normal · ${trends.summary.pneumoniaScans} pneumonia · ${trends.summary.covidScans} COVID`}
              accent="cyan"
              icon={Crosshair}
            />
            <DashboardStatCard
              label="Severity progression"
              value={trends.summary.latestSeverity ?? "—"}
              sub={trends.summary.severityProgressionLabel}
              accent="slate"
              icon={
                trends.summary.severityProgressionLabel.includes("→") &&
                trends.series.length >= 2 &&
                trends.series[0]!.severityScore > trends.series[trends.series.length - 1]!.severityScore
                  ? TrendingDown
                  : TrendingUp
              }
            />
            <DashboardStatCard
              label="Recovery timeline"
              value={
                trends.summary.recoveryTimelineLabel.includes("Improving") ||
                trends.summary.recoveryTimelineLabel.includes("Cleared")
                  ? "Improving"
                  : trends.summary.recoveryTimelineLabel.includes("Worsening")
                    ? "Worsening"
                    : trends.summary.totalScans < 2
                      ? "Pending"
                      : "Stable"
              }
              sub={trends.summary.recoveryTimelineLabel}
              accent={
                trends.summary.recoveryTimelineLabel.includes("Improving") ||
                trends.summary.recoveryTimelineLabel.includes("Cleared")
                  ? "emerald"
                  : trends.summary.recoveryTimelineLabel.includes("Worsening")
                    ? "rose"
                    : "slate"
              }
              icon={
                trends.summary.recoveryTimelineLabel.includes("Worsening")
                  ? TrendingUp
                  : TrendingDown
              }
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="space-y-3 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Severity over time
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  AI severity score across successive chest X-ray screenings.
                </p>
              </div>
              <TrendLineChart
                points={trends.series.map((p) => ({
                  label: p.label,
                  value: p.severityScore,
                }))}
                yMin={0}
                yMax={3}
                yTickValues={SEVERITY_TICKS}
                formatY={formatSeverityTick}
                strokeClassName="stroke-orange-600"
                fillClassName="fill-orange-500/10"
                dotClassName="fill-orange-600"
              />
            </Card>

            <Card className="space-y-3 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Confidence trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Model confidence (%) for each screening result.
                </p>
              </div>
              <TrendLineChart
                points={trends.series.map((p) => ({
                  label: p.label,
                  value: p.confidencePct,
                }))}
                yMin={0}
                yMax={100}
                yTickValues={[0, 25, 50, 75, 100]}
                formatY={(v) => `${Math.round(v)}%`}
                strokeClassName="stroke-teal-600"
                fillClassName="fill-teal-500/15"
                dotClassName="fill-teal-600"
              />
            </Card>

            <Card className="space-y-3 p-5 sm:p-6 lg:col-span-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Scan frequency
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Number of chest X-ray screenings by month.
                </p>
              </div>
              <TrendBarChart
                bars={trends.frequency.map((b) => ({
                  label: b.label,
                  value: b.count,
                }))}
                barClassName="fill-cyan-500"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-900">
                Recovery timeline
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chronological screening milestones and severity changes.
              </p>
            </div>
            <ol className="divide-y divide-slate-100">
              {trends.recoveryEvents.map((event) => (
                <li
                  key={`${event.scanId}-${event.title}`}
                  className="flex gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full ring-4 ring-white",
                        event.kind === "improved" && "bg-emerald-500",
                        event.kind === "worsened" && "bg-rose-500",
                        event.kind === "stable" && "bg-slate-300",
                        event.kind === "milestone" && "bg-teal-500",
                      )}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {event.title}
                      </p>
                      <p className="text-xs font-medium tabular-nums text-slate-500">
                        {event.label}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                    <Link
                      href={`/scans/${event.scanId}`}
                      className="mt-2 inline-flex text-sm font-medium text-teal-700 hover:text-teal-900"
                    >
                      Open scan
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
