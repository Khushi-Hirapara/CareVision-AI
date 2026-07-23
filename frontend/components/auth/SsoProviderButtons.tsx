"use client";

import { useEffect, useState } from "react";
import { getSsoBaseUrl } from "@/lib/api";
import { getSsoLoginUrl, type SsoProvider } from "@/lib/auth";

interface SsoProvidersStatus {
  google: boolean;
  microsoft: boolean;
}

interface SsoProviderButtonsProps {
  nextPath?: string | null;
  className?: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.18c0-.74-.07-1.45-.19-2.14H12v4.05h5.24a4.48 4.48 0 0 1-1.94 2.94v2.63h3.14c1.84-1.69 2.91-4.19 2.91-7.48Z"
      />
      <path
        fill="#34A853"
        d="M12 21.69c2.62 0 4.82-.87 6.43-2.35l-3.14-2.43c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.51A9.72 9.72 0 0 0 12 21.69Z"
      />
      <path
        fill="#FBBC05"
        d="M6.56 13.83A5.84 5.84 0 0 1 6.25 12c0-.64.11-1.25.31-1.83V7.66H3.32A9.7 9.7 0 0 0 2.28 12c0 1.57.38 3.06 1.04 4.34l3.24-2.51Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.16c1.42 0 2.69.49 3.69 1.44l2.81-2.81A9.42 9.42 0 0 0 12 2.31a9.72 9.72 0 0 0-8.68 5.35l3.24 2.51c.77-2.3 2.91-4.01 5.44-4.01Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="h-5 w-5" aria-hidden="true">
      <path fill="#F25022" d="M0 0h10v10H0z" />
      <path fill="#7FBA00" d="M11 0h10v10H11z" />
      <path fill="#00A4EF" d="M0 11h10v10H0z" />
      <path fill="#FFB900" d="M11 11h10v10H11z" />
    </svg>
  );
}

export function SsoProviderButtons({
  nextPath,
  className,
}: SsoProviderButtonsProps) {
  const [providers, setProviders] = useState<SsoProvidersStatus>({
    google: true,
    microsoft: true,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${getSsoBaseUrl()}/auth/sso/providers`, {
          cache: "no-store",
          headers: getSsoBaseUrl().includes("ngrok")
            ? { "ngrok-skip-browser-warning": "true" }
            : undefined,
        });
        if (!response.ok) return;
        const data = (await response.json()) as SsoProvidersStatus;
        if (!cancelled) {
          setProviders({
            google: Boolean(data.google),
            microsoft: Boolean(data.microsoft),
          });
        }
      } catch {
        // Keep buttons visible; backend will return a clear error if unconfigured.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const available: SsoProvider[] = [];
  if (providers.google) available.push("google");
  if (providers.microsoft) available.push("microsoft");

  if (available.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or continue with
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div
        className={
          available.length > 1
            ? "grid gap-3 sm:grid-cols-2"
            : "grid gap-3"
        }
      >
        {providers.google ? (
          <a
            href={getSsoLoginUrl("google", nextPath)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <GoogleIcon />
            Google
          </a>
        ) : null}
        {providers.microsoft ? (
          <a
            href={getSsoLoginUrl("microsoft", nextPath)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <MicrosoftIcon />
            Microsoft
          </a>
        ) : null}
      </div>
    </div>
  );
}
