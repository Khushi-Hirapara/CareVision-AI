"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { History, SearchX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ScanHistoryCard } from "@/components/ScanHistoryCard";
import {
  ScanHistoryFilters,
  type PredictionFilter,
  type ScanViewMode,
} from "@/components/history/ScanHistoryFilters";
import { ScanHistorySkeleton } from "@/components/history/ScanHistorySkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { fetchScans } from "@/lib/api";
import { patientReportsPath } from "@/lib/patients";
import type { ScanRecord } from "@/lib/types";

function filterScans(
  scans: ScanRecord[],
  searchQuery: string,
  predictionFilter: PredictionFilter,
): ScanRecord[] {
  const query = searchQuery.trim().toLowerCase();

  return scans.filter((scan) => {
    const matchesSearch =
      query.length === 0 ||
      scan.patientName.toLowerCase().includes(query);
    const matchesPrediction =
      predictionFilter === "all" || scan.prediction === predictionFilter;
    return matchesSearch && matchesPrediction;
  });
}

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientIdParam = searchParams.get("patientId");
  const filterPatientId =
    patientIdParam != null
      ? Number.parseInt(patientIdParam, 10)
      : Number.NaN;
  const hasPatientFilter =
    Number.isFinite(filterPatientId) && filterPatientId >= 1;

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictionFilter, setPredictionFilter] =
    useState<PredictionFilter>("all");
  const [viewMode, setViewMode] = useState<ScanViewMode>("grid");

  useEffect(() => {
    if (hasPatientFilter) {
      router.replace(patientReportsPath(filterPatientId));
    }
  }, [hasPatientFilter, filterPatientId, router]);

  useEffect(() => {
    if (hasPatientFilter) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchScans();
        if (!cancelled) setScans(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load scan history.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hasPatientFilter]);

  const filteredScans = useMemo(
    () => filterScans(scans, searchQuery, predictionFilter),
    [scans, searchQuery, predictionFilter],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || predictionFilter !== "all";

  const pneumoniaCount = scans.filter((s) => s.prediction === "Pneumonia").length;
  const normalCount = scans.length - pneumoniaCount;

  if (hasPatientFilter) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <p className="text-sm text-slate-600">Opening patient reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-content">
        <PageHeader
          title="Scan History"
          description="Review past chest X-ray analyses with patient records, predictions, and downloadable clinical reports."
        />

        {!isLoading && !error && scans.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total scans", value: scans.length, accent: "text-teal-700 dark:text-teal-300" },
              { label: "Normal", value: normalCount, accent: "text-emerald-700 dark:text-emerald-300" },
              { label: "Pneumonia", value: pneumoniaCount, accent: "text-rose-700 dark:text-rose-300" },
              {
                label: "Avg. confidence",
                value:
                  scans.length > 0
                    ? `${Math.round(
                        (scans.reduce((sum, s) => sum + s.confidence, 0) /
                          scans.length) *
                          100,
                      )}%`
                    : "-",
                accent: "text-amber-700 dark:text-amber-300",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/20 dark:ring-1 dark:ring-teal-500/10"
              >
                <p className={`text-2xl font-bold tabular-nums ${stat.accent}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {isLoading && <ScanHistorySkeleton />}

        {!isLoading && error && (
          <ErrorAlert
            title="Failed to load history"
            message={`${error} Ensure the backend is running (port 8000) and PostgreSQL is configured.`}
          />
        )}

        {!isLoading && !error && scans.length > 0 && (
          <ScanHistoryFilters
            className="mb-6"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            predictionFilter={predictionFilter}
            onPredictionFilterChange={setPredictionFilter}
            resultCount={filteredScans.length}
            totalCount={scans.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}

        {!isLoading && !error && scans.length === 0 && (
          <EmptyState
            icon={History}
            title="No scans yet"
            description="Run an analysis on the Analyze page to save your first chest X-ray result. Records will appear here with thumbnails and PDF reports."
            action={
              <Link href="/analyze" className="btn-primary">
                Analyze X-Ray
              </Link>
            }
          />
        )}

        {!isLoading && !error && scans.length > 0 && filteredScans.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No matching scans"
            description={
              hasActiveFilters
                ? "Try a different patient name or change the prediction filter."
                : "Adjust your filters to see more results."
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPredictionFilter("all");
                  }}
                  className="btn-secondary"
                >
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !error && filteredScans.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                : "grid gap-5"
            }
          >
            {filteredScans.map((scan) => (
              <ScanHistoryCard key={scan.id} scan={scan} layout={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
