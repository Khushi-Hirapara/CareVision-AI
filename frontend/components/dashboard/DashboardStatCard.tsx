import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "teal" | "rose" | "slate" | "cyan" | "emerald";

const accentClasses: Record<Accent, { card: string; icon: string }> = {
  teal: {
    card: "from-teal-50 via-white to-cyan-50/80 ring-teal-100/80 hover:shadow-teal-900/10 dark:from-teal-500/15 dark:via-slate-900 dark:to-cyan-500/10 dark:ring-teal-500/25 dark:hover:shadow-teal-500/10",
    icon: "bg-teal-100 text-teal-700 ring-teal-200/60 dark:bg-teal-500/20 dark:text-teal-300 dark:ring-teal-400/30",
  },
  rose: {
    card: "from-rose-50 via-white to-orange-50/60 ring-rose-100/80 hover:shadow-rose-900/10 dark:from-rose-500/15 dark:via-slate-900 dark:to-orange-500/10 dark:ring-rose-500/25 dark:hover:shadow-rose-500/10",
    icon: "bg-rose-100 text-rose-700 ring-rose-200/60 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-400/30",
  },
  slate: {
    card: "from-slate-50 via-white to-slate-100/60 ring-slate-200/80 hover:shadow-slate-900/5 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/40 dark:ring-slate-600/50",
    icon: "bg-slate-100 text-slate-700 ring-slate-200/60 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-500/50",
  },
  cyan: {
    card: "from-cyan-50 via-white to-teal-50/80 ring-cyan-100/80 hover:shadow-cyan-900/10 dark:from-cyan-500/15 dark:via-slate-900 dark:to-teal-500/10 dark:ring-cyan-500/25 dark:hover:shadow-cyan-500/10",
    icon: "bg-cyan-100 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-400/30",
  },
  emerald: {
    card: "from-emerald-50 via-white to-teal-50/80 ring-emerald-100/80 hover:shadow-emerald-900/10 dark:from-emerald-500/15 dark:via-slate-900 dark:to-teal-500/10 dark:ring-emerald-500/25 dark:hover:shadow-emerald-500/10",
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/30",
  },
};

export function DashboardStatCard({
  label,
  value,
  sub,
  accent = "slate",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: Accent;
  icon?: LucideIcon;
}) {
  const styles = accentClasses[accent];
  return (
    <div
      className={cn(
        "group rounded-2xl border border-transparent bg-gradient-to-br p-5 ring-1 ring-inset transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/40 dark:shadow-lg dark:shadow-black/20",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              styles.icon,
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
      ) : null}
    </div>
  );
}
