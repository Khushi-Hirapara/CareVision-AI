"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { ScanDetailView } from "@/components/ScanDetailView";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { ScanDetailSkeleton } from "@/components/scans/ScanDetailSkeleton";
import { fetchScanById } from "@/lib/api";
import type { ScanRecord } from "@/lib/types";

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = typeof params.scanId === "string" ? params.scanId : "";

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      setError("Invalid scan id.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchScanById(scanId);
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
  }, [scanId]);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading && <ScanDetailSkeleton />}

        {!isLoading && error && (
          <div className="space-y-4">
            <ErrorAlert
              title="Scan unavailable"
              message={`${error} Ensure the backend is running and the scan id is correct.`}
            />
            <Link href="/history" className="btn-secondary inline-flex">
              Return to scan history
            </Link>
          </div>
        )}

        {!isLoading && !error && !scan && (
          <EmptyState
            icon={FileSearch}
            title="Scan not found"
            description="This scan may have been removed or the id is invalid."
            action={
              <Link href="/history" className="btn-primary">
                View scan history
              </Link>
            }
          />
        )}

        {!isLoading && !error && scan && <ScanDetailView scan={scan} />}
      </div>
    </div>
  );
}
