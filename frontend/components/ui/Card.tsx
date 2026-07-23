import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Primary surface container for dashboard panels and forms. */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      {children}
    </div>
  );
}
