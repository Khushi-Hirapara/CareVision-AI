"use client";

import Link from "next/link";
import { ArrowRight, History, TrendingUp } from "lucide-react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { PredictionBadge } from "@/components/ui/Badge";
import type { PatientDashboardStats } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

interface PatientDashboardProps {
  stats: PatientDashboardStats;
}

export function PatientDashboard({ stats }: PatientDashboardProps) {
  const avgConfidence =
    stats.averageConfidence !== null && stats.averageConfidence !== undefined
      ? formatPercent(stats.averageConfidence)
      : "—";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStatCard
          label="Total Scans"
          value={stats.totalScans}
          accent="teal"
        />
        <DashboardStatCard
          label="Normal Cases"
          value={stats.normalScans}
          accent="emerald"
        />
        <DashboardStatCard
          label="Pneumonia Cases"
          value={stats.pneumoniaScans}
          accent="rose"
        />
        <DashboardStatCard
          label="Average Confidence"
          value={avgConfidence}
          sub="Across your studies"
          accent="slate"
          icon={TrendingUp}
        />
        <DashboardStatCard
          label="Latest Result"
          value={stats.lastScanResult ?? "—"}
          sub={
            stats.lastScanDate
              ? formatDate(stats.lastScanDate)
              : "No scans yet"
          }
          accent="cyan"
        />
      </div>

      {stats.lastScanResult && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Most recent study
            </p>
            <div className="mt-2 flex items-center gap-3">
              <PredictionBadge label={stats.lastScanResult} />
              {stats.lastScanDate && (
                <span className="text-sm text-slate-600">
                  {formatDate(stats.lastScanDate)}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/patient/dashboard"
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <History className="h-4 w-4" aria-hidden />
            View my scans & reports
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      {stats.totalScans === 0 && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Your doctor has not linked any chest X-ray studies to your account yet.
          After your care team runs an analysis for you, results and PDF reports
          will appear here.
        </p>
      )}
    </div>
  );
}
