"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PATIENT_DASHBOARD_PATH } from "@/lib/auth-routes";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

interface RequireDoctorProps {
  children: ReactNode;
}

export function RequireDoctor({ children }: RequireDoctorProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (user.role === "patient") {
      router.replace(PATIENT_DASHBOARD_PATH);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="doctor-dashboard-shell flex min-h-screen flex-1 items-center justify-center px-4">
        <LoadingPanel message="Checking your session…" />
      </div>
    );
  }

  if (!user || user.role !== "doctor") {
    return null;
  }

  return children;
}
