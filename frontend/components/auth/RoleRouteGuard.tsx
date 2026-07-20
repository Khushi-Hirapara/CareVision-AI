"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  dashboardPathForRole,
  isPathAllowedForRole,
  PROFILE_PATH,
} from "@/lib/auth-routes";

interface RoleRouteGuardProps {
  children: ReactNode;
}

/**
 * Redirects authenticated users away from routes their role cannot access.
 * Profile (/profile) is shared by doctors and patients.
 */
export function RoleRouteGuard({ children }: RoleRouteGuardProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    if (pathname === PROFILE_PATH || isPathAllowedForRole(pathname, user.role)) {
      return;
    }

    router.replace(dashboardPathForRole(user.role));
  }, [isLoading, user, pathname, router]);

  return children;
}
