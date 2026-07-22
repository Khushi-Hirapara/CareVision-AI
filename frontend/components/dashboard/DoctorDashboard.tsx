"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import { StudyImage } from "@/components/ui/StudyImage";
import type { DoctorDashboardStats } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

interface DoctorDashboardProps {
  stats: DoctorDashboardStats;
}

/** Compact dashboard preview on the home page; full workspace at /doctor/dashboard. */
export function DoctorDashboard({ stats }: DoctorDashboardProps) {
  const avgConfidence =
    stats.averageConfidence !== null
      ? formatPercent(stats.averageConfidence)
      : "—";

  return (
    <div className="space-y-8">
      <Link
        href="/doctor/dashboard"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50 to-cyan-50/80 px-4 py-3 transition hover:border-teal-300 hover:shadow-sm"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-teal-800">
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          Open dashboard — manage patients & invites
        </span>
        <ArrowRight className="h-4 w-4 text-teal-700" aria-hidden />
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStatCard
          label="Total Patients"
          value={stats.totalPatients}
          accent="teal"
          icon={Users}
        />
        <DashboardStatCard
          label="Total Scans"
          value={stats.totalScans}
          accent="cyan"
          icon={ScanLine}
        />
        <DashboardStatCard
          label="Normal Cases"
          value={stats.normalScans}
          accent="emerald"
          icon={ShieldCheck}
        />
        <DashboardStatCard
          label="Pneumonia Cases"
          value={stats.pneumoniaScans}
          accent="rose"
          icon={Activity}
        />
        <DashboardStatCard
          label="Average Confidence"
          value={avgConfidence}
          sub="Across patient scans"
          accent="slate"
          icon={TrendingUp}
        />
      </div>

      {stats.recentScans.length > 0 && (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                Recent activity
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Recent scans</h3>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentScans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-teal-200/80 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-slate-950">
                  <StudyImage
                    src={scan.imagePath}
                    alt={`Chest X-ray for ${scan.patientName}`}
                    fill
                    objectFit="cover"
                    className="opacity-90 transition group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PredictionBadge label={scan.prediction} />
                      <SeverityBadge severity={scan.severity} />
                    </div>
                    <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      {formatPercent(scan.confidence)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold text-slate-900">
                    {scan.patientName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(scan.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
