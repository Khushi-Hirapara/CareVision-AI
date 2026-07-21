"use client";

import { RefreshCw, WifiOff } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-8 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm ring-1 ring-rose-100">
        <WifiOff className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-900">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      ) : null}
    </div>
  );
}
