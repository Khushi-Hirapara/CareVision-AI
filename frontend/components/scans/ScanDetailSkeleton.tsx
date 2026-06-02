import { Card } from "@/components/ui/Card";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function ScanDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading scan details">
      <div className="flex justify-between gap-4">
        <Bar className="h-10 w-40 rounded-xl" />
        <Bar className="h-10 w-36 rounded-xl" />
      </div>
      <Card className="space-y-4">
        <Bar className="h-8 w-1/2 max-w-xs" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Bar className="h-14" />
          <Bar className="h-14" />
          <Bar className="h-14" />
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="space-y-4 lg:col-span-2">
          <Bar className="h-6 w-32" />
          <Bar className="h-24 w-full rounded-xl" />
          <Bar className="h-2 w-full rounded-full" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          <Bar className="aspect-[4/5] w-full rounded-2xl" />
          <Bar className="aspect-[4/5] w-full rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Loading scan record…</span>
    </div>
  );
}
