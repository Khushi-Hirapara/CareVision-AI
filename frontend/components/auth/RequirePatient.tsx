"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { DOCTOR_DASHBOARD_PATH } from "@/lib/auth-routes";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

interface RequirePatientProps {
  children: ReactNode;
}

export function RequirePatient({ children }: RequirePatientProps) {
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
    if (user.role === "doctor") {
      router.replace(DOCTOR_DASHBOARD_PATH);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center px-4">
        <LoadingPanel message="Checking your session…" />
      </div>
    );
  }

  if (!user || user.role !== "patient") {
    return null;
  }

  return children;
}
