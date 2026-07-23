"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ScanComparisonView } from "@/components/patients/ScanComparisonView";

function ComparePageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
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
      <ScanComparisonView
        patientId={patientId}
        initialBaselineId={searchParams.get("baseline") ?? undefined}
        initialFollowUpId={searchParams.get("followUp") ?? undefined}
      />
    </div>
  );
}

export default function DoctorPatientComparePage() {
  return (
    <Suspense
      fallback={
        <div className="page-content text-sm text-slate-500">
          Loading comparison…
        </div>
      }
    >
      <ComparePageInner />
    </Suspense>
  );
}
