"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PROFILE_PATH } from "@/lib/auth-routes";
import { dashboardHrefForRole } from "@/lib/nav-links";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  const dashboardHref = dashboardHrefForRole(user.role);
  const dashboardActive =
    pathname === dashboardHref || pathname.startsWith(`${dashboardHref}/`);
  const profileActive = pathname === PROFILE_PATH;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className={cn(
          "inline-flex max-w-[200px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-3",
          open && "border-teal-200 bg-teal-50/50",
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">
          <User className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="hidden truncate sm:inline">{user.name}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2.5 sm:hidden">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <Link
            href={dashboardHref}
            role="menuitem"
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition",
              dashboardActive
                ? "bg-teal-50 text-teal-800"
                : "text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>

          <Link
            href={PROFILE_PATH}
            role="menuitem"
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition",
              profileActive
                ? "bg-teal-50 text-teal-800"
                : "text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden />
            Profile
          </Link>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
