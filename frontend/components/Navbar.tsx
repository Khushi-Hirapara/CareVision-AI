"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  History,
  Home,
  LogIn,
  Upload,
  UserPlus,
} from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

const publicLinks = [{ href: "/", label: "Home", icon: Home }];

const protectedLinks = [
  { href: "/analyze", label: "Analyze X-Ray", icon: Upload },
  { href: "/history", label: "History", icon: History },
];

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  compact = false,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  pathname: string;
  compact?: boolean;
}) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-medium transition-colors",
        compact
          ? "shrink-0 gap-1.5 rounded-lg px-2.5 py-2 text-xs"
          : "rounded-lg px-3 py-2 text-sm",
        active
          ? "bg-teal-50 text-teal-800"
          : compact
            ? "text-slate-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  const navLinks = isAuthenticated
    ? [...publicLinks, ...protectedLinks]
    : publicLinks;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">
              CareVision AI
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Chest X-Ray Analysis
            </span>
          </div>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && isAuthenticated && <UserMenu />}

          {!isLoading && !isAuthenticated && !isAuthPage && (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:text-sm"
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:px-3 sm:text-sm"
              >
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {!isAuthPage && isAuthenticated && (
        <nav
          className="flex items-center gap-0.5 overflow-x-auto border-t border-slate-100 px-4 pb-2 md:hidden"
          aria-label="Main mobile"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} compact />
          ))}
        </nav>
      )}
    </header>
  );
}
