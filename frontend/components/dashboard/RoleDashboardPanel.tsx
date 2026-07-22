"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import {
  fetchDoctorDashboardStats,
  fetchPatientDashboardStats,
} from "@/lib/api";
import type { UserRole } from "@/lib/types";
import type { DoctorDashboardStats, PatientDashboardStats } from "@/lib/types";

interface RoleDashboardPanelProps {
  role: UserRole;
}

export function RoleDashboardPanel({ role }: RoleDashboardPanelProps) {
  const [doctorStats, setDoctorStats] = useState<DoctorDashboardStats | null>(null);
  const [patientStats, setPatientStats] = useState<PatientDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        if (role === "doctor") {
          const data = await fetchDoctorDashboardStats();
          if (!cancelled) {
            setDoctorStats(data);
            setPatientStats(null);
          }
        } else {
          const data = await fetchPatientDashboardStats();
          if (!cancelled) {
            setPatientStats(data);
            setDoctorStats(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load dashboard statistics.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const title = role === "doctor" ? "Dashboard" : "My health dashboard";
  const description =
    role === "doctor"
      ? "Overview of your patients and chest X-ray analyses."
      : "Your personal scan history and latest results.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <LayoutDashboard className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
            {role === "doctor" ? "Doctor overview" : "Patient portal"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {isLoading && (
        <LoadingPanel message="Loading dashboard…" className="mt-10 py-12" />
      )}

      {!isLoading && error && (
        <div className="mt-8">
          <ErrorAlert
            title="Could not load dashboard"
            message={`${error} Ensure the backend is running.`}
          />
        </div>
      )}

      {!isLoading && !error && role === "doctor" && doctorStats && (
        <div className="mt-10">
          <DoctorDashboard stats={doctorStats} />
        </div>
      )}

      {!isLoading && !error && role === "patient" && patientStats && (
        <div className="mt-10">
          <PatientDashboard stats={patientStats} />
        </div>
      )}
    </div>
  );
}
