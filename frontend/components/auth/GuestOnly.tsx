"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) {
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/analyze");
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
