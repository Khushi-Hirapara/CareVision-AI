"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, History } from "lucide-react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PredictionBadge, SeverityBadge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchScans } from "@/lib/api";
import { fetchMyScans } from "@/lib/my-scans";
import { PATIENT_REPORTS_PATH } from "@/lib/nav-links";
import type { ScanRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

export function RecentScansSection() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const historyHref =
    user?.role === "patient" ? PATIENT_REPORTS_PATH : "/history";

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setScans([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      try {
        const data =
          user?.role === "patient" ? await fetchMyScans(6) : await fetchScans(6);
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
  }, [authLoading, isAuthenticated, user?.role]);

  return (
    <section className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Your workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isAuthenticated
                ? "Latest screening results—patient details only, no study images."
                : "Sign in to see your private scan activity."}
            </p>
          </div>
          {isAuthenticated && (
            <Link
              href={historyHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              View all history
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>

        {isLoading && (
          <LoadingPanel message="Loading recent activity…" className="mt-10 py-12" />
        )}

        {!isLoading && error && (
          <div className="mt-8">
            <ErrorAlert
              title="Could not load activity"
              message={`${error} Ensure the backend is running.`}
            />
          </div>
        )}

        {!isLoading && !error && scans.length === 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white">
            <EmptyState
              icon={History}
              title={isAuthenticated ? "No activity yet" : "Sign in to view activity"}
              description={
                isAuthenticated
                  ? "Analyze a chest X-ray to save your first result and see it here."
                  : "Create an account to analyze X-rays and track your scan history securely."
              }
              action={
                <Link
                  href={isAuthenticated ? historyHref : "/register"}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                >
                  {isAuthenticated ? "View history" : "Get started"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            />
          </div>
        )}

        {!isLoading && !error && scans.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="home-recent-card group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {scan.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(scan.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                    {formatPercent(scan.confidence)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <PredictionBadge label={scan.prediction} />
                  <SeverityBadge severity={scan.severity} />
                </div>

                {scan.modelVersion ? (
                  <p className="mt-3 truncate text-[11px] text-slate-400">
                    Model {scan.modelVersion}
                  </p>
                ) : null}

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 opacity-0 transition group-hover:opacity-100">
                  View details
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
