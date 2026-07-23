import { Cpu, Lock, Stethoscope, Zap } from "lucide-react";
import { FeatureIcon } from "@/components/ui/FeatureIcon";

const items = [
  { icon: Zap, tone: "amber" as const, label: "Sub-second inference", sub: "Local TensorFlow model" },
  { icon: Stethoscope, tone: "teal" as const, label: "Decision support", sub: "Not a diagnosis device" },
  { icon: Lock, tone: "emerald" as const, label: "Your data, your server", sub: "Per-user scan isolation" },
  { icon: Cpu, tone: "cyan" as const, label: "Explainable AI", sub: "Grad-CAM heatmaps" },
];

export function HomeTrustBar() {
  return (
    <section
      className="border-y border-slate-200/80 bg-white/70 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60"
      aria-label="Platform highlights"
    >
      <div className="mx-auto grid w-full grid-cols-2 gap-px bg-slate-200/80 dark:bg-slate-800 sm:grid-cols-4">
        {items.map(({ icon, tone, label, sub }) => (
          <div
            key={label}
            className="group flex flex-col items-center gap-3 bg-white px-4 py-7 text-center dark:bg-slate-950 sm:py-8"
          >
            <FeatureIcon icon={icon} tone={tone} size="md" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
