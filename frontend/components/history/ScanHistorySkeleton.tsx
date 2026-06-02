import { Card } from "@/components/ui/Card";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 ${className ?? ""}`}
      aria-hidden
    />
  );
}

function ScanHistorySkeletonCard() {
  return (
    <Card className="overflow-hidden p-0">
      <SkeletonBar className="aspect-[5/4] w-full rounded-none" />
      <div className="space-y-3 p-4 sm:p-5">
        <SkeletonBar className="h-6 w-4/5" />
        <div className="flex gap-2">
          <SkeletonBar className="h-6 w-20 rounded-full" />
          <SkeletonBar className="h-6 w-24 rounded-md" />
        </div>
        <SkeletonBar className="h-3 w-2/3" />
        <SkeletonBar className="h-1.5 w-full rounded-full" />
        <div className="flex gap-2 pt-2">
          <SkeletonBar className="h-10 flex-1 rounded-xl" />
          <SkeletonBar className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

interface ScanHistorySkeletonProps {
  count?: number;
}

export function ScanHistorySkeleton({ count = 6 }: ScanHistorySkeletonProps) {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading scan history"
    >
      {Array.from({ length: count }, (_, i) => (
        <ScanHistorySkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading scan history…</span>
    </div>
  );
}
