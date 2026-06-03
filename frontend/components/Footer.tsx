"use client";

import Link from "next/link";
import { Activity, Code2, HeartPulse, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const productLinks = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze X-Ray" },
  { href: "/history", label: "History" },
];

const accountLinksGuest = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

const accountLinksAuth = [{ href: "/profile", label: "Profile" }];

export function Footer() {
  const { isAuthenticated, isLoading } = useAuth();
  const year = new Date().getFullYear();

  const accountLinks = isAuthenticated ? accountLinksAuth : accountLinksGuest;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Activity className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-base font-semibold text-white">
                CareVision AI
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              AI-assisted chest X-ray screening with explainable Grad-CAM
              heatmaps, secure scan history, and clinical PDF reports-running on
              your local stack.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
              <HeartPulse className="h-3.5 w-3.5 text-teal-500" aria-hidden />
              Built for research & decision support
            </p>
          </div>

          {/* Product */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition hover:text-teal-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account
            </h2>
            <ul className="mt-4 space-y-2.5">
              {!isLoading &&
                accountLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-slate-400 transition hover:text-teal-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              {isAuthenticated && (
                <li>
                  <span className="text-sm text-slate-500">
                    JWT-secured workspace
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="lg:col-span-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
              Medical disclaimer
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              CareVision AI provides preliminary AI screening only-not a final
              medical diagnosis. Always consult qualified healthcare
              professionals for clinical decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 bg-slate-950/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © {year} CareVision AI. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-center text-xs text-slate-600">
            <Code2 className="h-3.5 w-3.5" aria-hidden />
              
          </p>
        </div>
      </div>
    </footer>
  );
}
