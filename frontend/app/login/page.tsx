"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import {
  AuthFooterLink,
  AuthFormCard,
} from "@/components/auth/AuthFormCard";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthApiError, getSsoLoginUrl } from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/auth-routes";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetSuccess = searchParams.get("reset") === "1";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const profile = await login(email.trim(), password);
      router.replace(resolvePostAuthPath(profile.role, searchParams.get("next")));
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormCard
      title="Sign in"
      description="Access your chest X-ray analyses and scan history."
      footer={
        <AuthFooterLink
          prompt="Don't have an account?"
          href="/register"
          label="Create one"
        />
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error && <ErrorAlert title="Sign in failed" message={error} />}
        {resetSuccess && !error && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Password updated. You can sign in with your new password.
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={isSubmitting}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            disabled={isSubmitting}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
          />
          <p className="mt-1.5 text-right text-xs">
            <Link
              href="/forgot-password"
              className="font-medium text-teal-700 hover:text-teal-800"
            >
              Forgot password?
            </Link>
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or continue with
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={getSsoLoginUrl("google", searchParams.get("next"))}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
          >
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
          Google
        </a>
        <a
          href={getSsoLoginUrl("microsoft", searchParams.get("next"))}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <svg
            viewBox="0 0 21 21"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path fill="#F25022" d="M0 0h10v10H0z" />
            <path fill="#7FBA00" d="M11 0h10v10H11z" />
            <path fill="#00A4EF" d="M0 11h10v10H0z" />
            <path fill="#FFB900" d="M11 11h10v10H11z" />
          </svg>
          Microsoft
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/" className="text-teal-700 hover:text-teal-800">
          Back to home
        </Link>
      </p>
    </AuthFormCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </Suspense>
  );
}
