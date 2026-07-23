"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PatientScanCard } from "@/components/dashboard/PatientScanCard";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { fetchMyScans } from "@/lib/my-scans";
import type { ScanRecord } from "@/lib/types";

export function PatientReportsView() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyScans(100);
      setScans(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScans();
  }, [loadScans]);

  if (isLoading) {
    return (
      <div className="page-content flex flex-1 flex-col">
        <LoadingPanel message="Loading your reports…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content flex-1">
        <ErrorAlert title="Reports unavailable" message={error} />
      </div>
    );
  }

  return (
    <div className="page-content flex flex-1 flex-col gap-8">
      <PageHeader
        title="My Reports"
        description="Your chest X-ray screening results and downloadable PDF reports."
      />

      {scans.length === 0 ? (
        <DashboardEmptyState
          icon={ScanLine}
          title="No reports yet"
          description="When your doctor completes a chest X-ray analysis for you, results and reports will appear here."
          className="min-h-[320px]"
        />
      ) : (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{scans.length}</span>{" "}
            screening report{scans.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {scans.map((scan) => (
              <PatientScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
