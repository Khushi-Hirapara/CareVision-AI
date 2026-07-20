"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolvePostAuthPath } from "@/lib/auth-routes";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(resolvePostAuthPath(user.role, searchParams.get("next")));
    }
  }, [isLoading, user, router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <LoadingPanel message="Loading…" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return children;
}
