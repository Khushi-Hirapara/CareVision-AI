import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface LoadingPanelProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingPanel({
  message = "Loading…",
  submessage,
  className,
}: LoadingPanelProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <Loader2
        className="h-9 w-9 animate-spin text-teal-600"
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-slate-700">{message}</p>
      {submessage ? (
        <p className="mt-1 max-w-xs text-xs text-slate-500">{submessage}</p>
      ) : null}
    </Card>
  );
}
