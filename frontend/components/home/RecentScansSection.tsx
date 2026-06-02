"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Card } from "@/components/ui/Card";
import { PredictionBadge } from "@/components/ui/Badge";
import { fetchScans } from "@/lib/api";
import type { ScanRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function RecentScansSection() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchScans(6);
        if (!cancelled) setScans(data.slice(0, 3));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load recent scans.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pneumoniaCount = scans.filter((s) => s.prediction === "Pneumonia").length;
  const avgConfidence =
    scans.length > 0
      ? scans.reduce((sum, s) => sum + s.confidence, 0) / scans.length
      : 0;

  return (
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

      {scans.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            { label: "Shown", value: scans.length },
            { label: "Pneumonia flagged", value: pneumoniaCount },
            {
              label: "Avg. confidence",
              value: `${Math.round(avgConfidence * 100)}%`,
            },
          ].map((stat) => (
            <Card key={stat.label} className="px-4 py-3 text-center">
              <p className="text-lg font-bold text-teal-700">{stat.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                {stat.label}
              </p>
            </Card>
          ))}
        </div>
      )}

      {isLoading && (
        <LoadingPanel message="Loading recent scans…" className="py-12" />
      )}

      {!isLoading && error && (
        <ErrorAlert
          title="Could not load scans"
          message={`${error} Start the backend at http://localhost:8000 and ensure PostgreSQL is running.`}
        />
      )}

      {!isLoading && !error && scans.length === 0 && (
        <EmptyState
          icon={History}
          title="No scans yet"
          description="Analyze a chest X-ray to save your first result and see it here."
          action={
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Analyze X-Ray
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
      )}

      {!isLoading && !error && scans.length > 0 && (
        <div className="grid gap-3">
          {scans.map((scan) => (
            <Card
              key={scan.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:border-teal-200/80 hover:shadow-md"
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
                <Link
                  href={`/scans/${scan.id}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
