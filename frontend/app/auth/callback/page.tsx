"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import {
  AuthApiError,
  exchangeSsoCode,
  persistSession,
} from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/auth-routes";

function SsoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const nextPath = searchParams.get("next");
  const [error, setError] = useState<string | null>(() =>
    providerError
      ? providerError
      : code
        ? null
        : "The identity provider did not return a sign-in code.",
  );

  useEffect(() => {
    if (started.current || error) return;
    started.current = true;
    if (!code) return;

    void (async () => {
      try {
        const result = await exchangeSsoCode(code);
        const profile = await persistSession(
          result.access_token,
          result.user,
          result.refresh_token,
        );
        router.replace(
          resolvePostAuthPath(profile.role, nextPath),
        );
      } catch (err) {
        setError(
          err instanceof AuthApiError
            ? err.message
            : "Could not complete SSO sign-in. Please try again.",
        );
      }
    })();
  }, [code, error, nextPath, router]);

  return (
    <AuthFormCard
      title={error ? "Sign-in failed" : "Completing sign-in"}
      description={
        error
          ? "Google or Microsoft could not complete your sign-in."
          : "Your identity has been confirmed. We’re opening your account."
      }
      footer={
        <Link
          href="/login"
          className="font-semibold text-teal-700 hover:text-teal-800"
        >
          Back to sign in
        </Link>
      }
    >
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" aria-hidden />
          Creating your secure session…
        </div>
      )}
    </AuthFormCard>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <SsoCallbackContent />
    </Suspense>
  );
}
