"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, History, Home, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyze", label: "Analyze X-Ray", icon: Upload },
  { href: "/history", label: "Scan History", icon: History },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">
              CareVision AI
            </span>
            <span className="block text-xs text-slate-500">
              Chest X-Ray Analysis
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <nav
          className="flex items-center gap-0.5 overflow-x-auto md:hidden"
          aria-label="Main mobile"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium",
                  active ? "bg-teal-50 text-teal-800" : "text-slate-600",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
