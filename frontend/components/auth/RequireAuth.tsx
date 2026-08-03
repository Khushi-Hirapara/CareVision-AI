"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center px-4">
        <LoadingPanel message="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center px-4">
        <LoadingPanel message="Redirecting to sign in…" />
      </div>
    );
  }

  return children;
}
