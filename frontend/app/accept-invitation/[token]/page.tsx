"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { AcceptInvitationPageContent } from "@/components/auth/AcceptInvitationPageContent";

function AcceptInvitationInner() {
  const params = useParams();
  const raw = params.token;
  const token =
    typeof raw === "string" ? decodeURIComponent(raw).trim() : Array.isArray(raw) ? decodeURIComponent(raw[0] ?? "").trim() : "";

  return <AcceptInvitationPageContent token={token} />;
}

export default function AcceptInvitationTokenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <GuestOnly>
        <AcceptInvitationInner />
      </GuestOnly>
    </Suspense>
  );
}
