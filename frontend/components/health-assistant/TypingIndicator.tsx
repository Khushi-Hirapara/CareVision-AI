"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3" aria-live="polite" aria-label="Assistant is typing">
      <div className="health-avatar" aria-hidden>
        <span className="health-pulse-dot" />
      </div>
      <div className="rounded-2xl rounded-tl-md border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="health-typing-dot" />
          <span className="health-typing-dot" style={{ animationDelay: "0.15s" }} />
          <span className="health-typing-dot" style={{ animationDelay: "0.3s" }} />
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-teal-700/80">
          Reviewing your report…
        </p>
      </div>
    </div>
  );
}
