import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "teal" | "rose" | "slate" | "cyan" | "emerald";

const accentClasses: Record<Accent, { card: string; icon: string }> = {
  teal: {
    card: "from-teal-500/12 via-white to-cyan-500/8 ring-teal-100/80 hover:shadow-teal-900/10",
    icon: "bg-teal-100 text-teal-700 ring-teal-200/60",
  },
  rose: {
    card: "from-rose-500/12 via-white to-orange-500/6 ring-rose-100/80 hover:shadow-rose-900/10",
    icon: "bg-rose-100 text-rose-700 ring-rose-200/60",
  },
  slate: {
    card: "from-slate-500/10 via-white to-slate-400/5 ring-slate-200/80 hover:shadow-slate-900/5",
    icon: "bg-slate-100 text-slate-700 ring-slate-200/60",
  },
  cyan: {
    card: "from-cyan-500/12 via-white to-teal-500/8 ring-cyan-100/80 hover:shadow-cyan-900/10",
    icon: "bg-cyan-100 text-cyan-700 ring-cyan-200/60",
  },
  emerald: {
    card: "from-emerald-500/12 via-white to-teal-500/8 ring-emerald-100/80 hover:shadow-emerald-900/10",
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-200/60",
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
        "group rounded-2xl bg-gradient-to-br p-5 ring-1 ring-inset transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              styles.icon,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
