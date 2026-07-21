"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import {
  AuthFooterLink,
  AuthFormCard,
} from "@/components/auth/AuthFormCard";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { AuthApiError, forgotPasswordRequest } from "@/lib/auth";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const message = await forgotPasswordRequest(email.trim());
      setSuccess(message);
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Could not send reset email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <GuestOnly>
        <AuthFormCard
        title="Forgot password"
        description="Enter your account email and we’ll send a reset link if it exists."
        footer={
          <AuthFooterLink
            prompt="Remembered your password?"
            href="/login"
            label="Sign in"
          />
        }
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && <ErrorAlert title="Request failed" message={error} />}
          {success && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="forgot-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={isSubmitting || Boolean(success)}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Boolean(success)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" aria-hidden />
                Send reset link
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/" className="text-teal-700 hover:text-teal-800">
            Back to home
          </Link>
        </p>
        </AuthFormCard>
      </GuestOnly>
    </Suspense>
  );
}
