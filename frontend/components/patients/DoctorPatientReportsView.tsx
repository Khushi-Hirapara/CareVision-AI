"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, GitCompareArrows, LineChart, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ScanHistoryCard } from "@/components/ScanHistoryCard";
import { ScanHistorySkeleton } from "@/components/history/ScanHistorySkeleton";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  fetchPatientById,
  fetchPatientScans,
  fetchPatients,
  patientComparePath,
  patientTrendsPath,
  type PatientRecord,
} from "@/lib/patients";
import type { ScanRecord } from "@/lib/types";
import { DOCTOR_DASHBOARD_PATH } from "@/lib/auth-routes";
import { PATIENTS_PATH } from "@/lib/nav-links";

interface DoctorPatientReportsViewProps {
  patientId: number;
}

export function DoctorPatientReportsView({
  patientId,
}: DoctorPatientReportsViewProps) {
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
        err instanceof Error ? err.message : "Could not load patient reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patientLabel = patient?.name ?? "Patient";

  return (
    <div className="page-content flex flex-1 flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={PATIENTS_PATH}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to patients
        </Link>
        <Link
          href={DOCTOR_DASHBOARD_PATH}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Workspace
        </Link>
      </div>

      <PageHeader
        title={`${patientLabel} — Reports`}
        description="Chest X-ray screening results and downloadable reports for this patient."
      />

      {isLoading && <ScanHistorySkeleton />}

      {!isLoading && error && (
        <ErrorAlert title="Reports unavailable" message={error} />
      )}

      {!isLoading && !error && scans.length === 0 && (
        <DashboardEmptyState
          icon={FileText}
          title="No reports yet"
          description={`${patientLabel} has no saved scans. Run an analysis to create the first report.`}
          className="min-h-[320px]"
          action={
            <Link
              href={`/analyze?patientId=${patientId}`}
              className="btn-primary"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Analyze X-Ray
            </Link>
          }
        />
      )}

      {!isLoading && !error && scans.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{scans.length}</span>{" "}
              report{scans.length === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-slate-800">{patientLabel}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={patientTrendsPath(patientId)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <LineChart className="h-4 w-4" aria-hidden />
                AI Trends
              </Link>
              {scans.length >= 2 ? (
                <Link
                  href={patientComparePath(patientId)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <GitCompareArrows className="h-4 w-4" aria-hidden />
                  Compare Scans
                </Link>
              ) : null}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {scans.map((scan) => (
              <ScanHistoryCard key={scan.id} scan={scan} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
