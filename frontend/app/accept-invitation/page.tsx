"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

/** Legacy email links with ?token= redirect to /accept-invitation/{token}. */
function AcceptInvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  useEffect(() => {
    if (token) {
      router.replace(`/accept-invitation/${encodeURIComponent(token)}`);
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600">
        <p className="font-medium text-slate-900">Invalid invitation link</p>
        <p className="mt-2">Use the link from your invitation email or contact your doctor.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <LoadingPanel message="Opening invitation…" />
    </div>
  );
}

export default function AcceptInvitationLegacyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <AcceptInvitationRedirect />
    </Suspense>
  );
}
