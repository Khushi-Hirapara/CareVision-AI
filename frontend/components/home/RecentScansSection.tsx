"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, History } from "lucide-react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PredictionBadge } from "@/components/ui/Badge";
import { StudyImage } from "@/components/ui/StudyImage";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchScans } from "@/lib/api";
import type { ScanRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

export function RecentScansSection() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [authLoading, isAuthenticated]);

  return (
    <section className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Your workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Recent scans
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isAuthenticated
                ? "Pick up where you left off with your latest studies."
                : "Sign in to see your private scan library."}
            </p>
          </div>
          {isAuthenticated && (
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              View all history
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>

        {isLoading && (
          <LoadingPanel message="Loading recent scans…" className="mt-10 py-12" />
        )}

        {!isLoading && error && (
          <div className="mt-8">
            <ErrorAlert
              title="Could not load scans"
              message={`${error} Ensure the backend is running.`}
            />
          </div>
        )}

        {!isLoading && !error && scans.length === 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white">
            <EmptyState
              icon={History}
              title={isAuthenticated ? "No scans yet" : "Sign in to view scans"}
              description={
                isAuthenticated
                  ? "Analyze a chest X-ray to save your first result and see it here."
                  : "Create an account to analyze X-rays and track your scan history securely."
              }
              action={
                <Link
                  href={isAuthenticated ? "/analyze" : "/register"}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                >
                  {isAuthenticated ? "Analyze X-Ray" : "Get started"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            />
          </div>
        )}

        {!isLoading && !error && scans.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="home-recent-card group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-teal-200/80 hover:shadow-lg hover:shadow-teal-900/5"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <StudyImage
                    src={scan.imagePath}
                    alt={`Chest X-ray for ${scan.patientName}`}
                    fill
                    objectFit="cover"
                    className="opacity-90 transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <PredictionBadge label={scan.prediction} />
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
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 opacity-0 transition group-hover:opacity-100">
                    View details
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
