"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardPathForRole } from "@/lib/auth-routes";
import { PATIENT_REPORTS_PATH } from "@/lib/nav-links";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

export function HomeCta() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const primaryHref = !isAuthenticated
    ? "/register"
    : user?.role === "patient"
      ? PATIENT_REPORTS_PATH
      : "/analyze";
  const primaryLabel = !isAuthenticated
    ? "Create free account"
    : user?.role === "patient"
      ? "My reports"
      : "Open analyzer";
  const secondaryHref = isAuthenticated
    ? dashboardPathForRole(user?.role ?? "doctor")
    : "/login";
  const secondaryLabel = isAuthenticated ? "Go to dashboard" : "Sign in";

  return (
    <section className="w-full px-3 py-16 sm:px-5 sm:py-20 lg:px-6">
      <div className="home-cta relative overflow-hidden rounded-3xl border border-teal-200/50 bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-700 px-6 py-10 text-center shadow-xl shadow-teal-900/15 sm:px-12 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />

        <div className="relative">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to review your next chest X-ray?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-50/95 sm:text-base">
            Use the current pneumonia screening workflow with image quality
            checks, explainable heatmaps, scan history, and clinical reports.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!isLoading && (
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {secondaryLabel}
            </Link>
          </div>

          <div className="mx-auto mt-8 max-w-xl text-left">
            <MedicalDisclaimer
              compact
              className="border-white/25 bg-white/10 text-teal-50 [&_svg]:text-teal-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
