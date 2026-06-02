import { Cpu, Lock, Stethoscope, Zap } from "lucide-react";

const items = [
  { icon: Zap, label: "Sub-second inference", sub: "Local TensorFlow model" },
  { icon: Stethoscope, label: "Decision support", sub: "Not a diagnosis device" },
  { icon: Lock, label: "Your data, your server", sub: "Per-user scan isolation" },
  { icon: Cpu, label: "Explainable AI", sub: "Grad-CAM heatmaps" },
];

export function HomeTrustBar() {
  return (
    <section
      className="border-y border-slate-200/80 bg-white/70 backdrop-blur-sm"
      aria-label="Platform highlights"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-slate-200/80 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white px-4 py-6 text-center sm:py-7"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
