import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DashboardPanel({
  title,
  description,
  icon: Icon,
  action,
  eyebrow,
  children,
  className,
  bodyClassName,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.03] transition hover:shadow-md hover:shadow-slate-900/[0.06] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30 dark:ring-teal-500/10 dark:hover:shadow-teal-950/20",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-teal-50/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-600/25 dark:shadow-teal-500/30">
            <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex flex-1 flex-col p-5 sm:p-6", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
