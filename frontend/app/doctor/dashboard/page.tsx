"use client";

import { DoctorDashboardView } from "@/components/dashboard/DoctorDashboardView";

export default function DoctorDashboardPage() {
  return (
    <div className="doctor-dashboard-shell flex min-h-screen flex-1 flex-col">
      <DoctorDashboardView />
    </div>
  );
}
