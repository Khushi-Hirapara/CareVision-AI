"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LogIn,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { HomeHeroBackground } from "@/components/home/HomeHeroBackground";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardPathForRole } from "@/lib/auth-routes";
import { PATIENT_REPORTS_PATH } from "@/lib/nav-links";

const highlights = [
  "Pneumonia screening available now",
  "Explainable regions, confidence & severity",
  "Modular foundation for future conditions",
];

export function HomeHero() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <section className="home-hero relative min-h-[70vh] overflow-hidden">
      <HomeHeroBackground />

      <div className="relative z-10 w-full px-3 py-14 sm:px-5 sm:py-20 lg:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="home-hero-badge inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur-sm dark:border-teal-700/50 dark:bg-slate-900/70 dark:text-teal-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-500/30">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              </span>
              AI-assisted chest radiography
            </p>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] dark:text-white">
              Explainable{" "}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-300">
                chest X-ray screening
              </span>{" "}
              in one workspace
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
              Screen frontal chest radiographs for Normal versus Pneumonia
              patterns today, with a modular platform designed to support
              carefully validated condition models in the future.
            </p>

            <ul className="mt-6 space-y-2.5">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-1 ring-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-800">
                    <CheckCircle2
                      className="h-3.5 w-3.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {!isLoading && isAuthenticated ? (
                <>
                  <Link
                    href={user ? dashboardPathForRole(user.role) : "/"}
                    className="btn-primary shadow-md shadow-teal-600/20"
                  >
                    Dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  {user?.role !== "patient" && (
                    <Link href="/analyze" className="btn-secondary">
                      Analyze X-Ray
                    </Link>
                  )}
                  {user?.role === "patient" ? (
                    <Link href={PATIENT_REPORTS_PATH} className="btn-secondary">
                      My Reports
                    </Link>
                  ) : (
                    <Link href="/history" className="btn-secondary">
                      View history
                    </Link>
                  )}
                  {user && (
                    <p className="w-full text-sm text-slate-500 sm:w-auto sm:pl-2 dark:text-slate-400">
                      Welcome back,{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {user.name.split(" ")[0]}
                      </span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn-primary shadow-md shadow-teal-600/20"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Register as doctor
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    <LogIn className="h-4 w-4" aria-hidden />
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
