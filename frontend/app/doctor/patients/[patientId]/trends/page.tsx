"use client";

import { useParams } from "next/navigation";
import { PatientTrendDashboard } from "@/components/patients/PatientTrendDashboard";

export default function DoctorPatientTrendsPage() {
  const params = useParams();
  const rawId = params.patientId;
  const patientId = Number.parseInt(
    Array.isArray(rawId) ? rawId[0] : String(rawId ?? ""),
    10,
  );

  if (!Number.isFinite(patientId) || patientId < 1) {
    return (
      <div className="page-content text-sm text-slate-600">
        Invalid patient.
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-shell flex min-h-screen flex-1 flex-col">
      <PatientTrendDashboard patientId={patientId} />
    </div>
  );
}
