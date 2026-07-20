import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  expired: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function InvitationStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {label}
    </span>
  );
}
