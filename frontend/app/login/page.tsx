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
import { SsoProviderButtons } from "@/components/auth/SsoProviderButtons";
import { AuthApiError } from "@/lib/auth";
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

      <SsoProviderButtons nextPath={searchParams.get("next")} />

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
