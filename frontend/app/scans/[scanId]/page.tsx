"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ScanDetailView } from "@/components/ScanDetailView";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { ScanDetailSkeleton } from "@/components/scans/ScanDetailSkeleton";
import { fetchScanById } from "@/lib/api";
import { fetchMyScanById } from "@/lib/my-scans";
import { PATIENT_DASHBOARD_PATH } from "@/lib/auth-routes";
import type { ScanRecord } from "@/lib/types";

export default function ScanDetailPage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const scanId = typeof params.scanId === "string" ? params.scanId : "";

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId || authLoading) {
      if (!scanId) {
        setError("Invalid scan id.");
        setIsLoading(false);
      }
      return;
    }

    let cancelled = false;
    const isPatient = user?.role === "patient";

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = isPatient
          ? await fetchMyScanById(scanId)
          : await fetchScanById(scanId);
        if (!cancelled) setScan(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load scan details.",
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
  }, [scanId, user?.role, authLoading]);

  return (
    <div className="page-shell">
      <div className="page-content">
        {isLoading && <ScanDetailSkeleton />}

        {!isLoading && error && (
          <div className="space-y-4">
            <ErrorAlert
              title="Scan unavailable"
              message={`${error} Ensure the backend is running and the scan id is correct.`}
            />
            <Link
              href={user?.role === "patient" ? PATIENT_DASHBOARD_PATH : "/history"}
              className="btn-secondary inline-flex"
            >
              {user?.role === "patient"
                ? "Return to my dashboard"
                : "Return to scan history"}
            </Link>
          </div>
        )}

        {!isLoading && !error && !scan && (
          <EmptyState
            icon={FileSearch}
            title="Scan not found"
            description="This scan may have been removed or the id is invalid."
            action={
              <Link
                href={user?.role === "patient" ? PATIENT_DASHBOARD_PATH : "/history"}
                className="btn-primary"
              >
                {user?.role === "patient" ? "My dashboard" : "View scan history"}
              </Link>
            }
          />
        )}

        {!isLoading && !error && scan && !authLoading && user && (
          <ScanDetailView scan={scan} userRole={user.role} />
        )}
      </div>
    </div>
  );
}
