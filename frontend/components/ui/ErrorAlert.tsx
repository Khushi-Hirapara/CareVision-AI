import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
}

/** Accessible inline error banner for API and validation failures. */
export function ErrorAlert({
  title = "Something went wrong",
  message,
  className,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 leading-relaxed text-rose-800">{message}</p>
      </div>
    </div>
  );
}
