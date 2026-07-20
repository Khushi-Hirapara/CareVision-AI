"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200/90",
        "bg-white px-4 py-3 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-100",
      )}
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      <p className="flex-1 text-sm font-medium text-slate-800">{message}</p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss();
        }}
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
