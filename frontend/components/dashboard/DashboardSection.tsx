"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { RoleDashboardPanel } from "@/components/dashboard/RoleDashboardPanel";

export function DashboardSection() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <section className="border-t border-slate-200/80 bg-white">
      <RoleDashboardPanel role={user.role} />
    </section>
  );
}
