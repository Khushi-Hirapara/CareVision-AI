"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

export function HomeCta() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
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
            Ready to screen your next study?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-50/95 sm:text-base">
            Join CareVision AI to run local pneumonia screening with full scan
            history and explainable heatmaps.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!isLoading && (
              <Link
                href={isAuthenticated ? "/analyze" : "/register"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
              >
                {isAuthenticated ? "Open analyzer" : "Create free account"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link
              href={isAuthenticated ? "/history" : "/login"}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {isAuthenticated ? "Browse history" : "Sign in"}
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
