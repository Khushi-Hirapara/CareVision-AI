"use client";

import {
  Activity,
  CalendarCheck,
  FileText,
  Flame,
  Heart,
  Layers,
  Percent,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SuggestedPrompt {
  id: string;
  label: string;
  message: string;
  icon: LucideIcon;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "explain-report",
    label: "Explain my report",
    message: "Explain my report in simple words.",
    icon: FileText,
  },
  {
    id: "compare",
    label: "Compare my scans",
    message: "Am I improving? Compare my latest scan with the previous one.",
    icon: Layers,
  },
  {
    id: "pneumonia",
    label: "What is Pneumonia?",
    message: "What does Pneumonia mean in plain language?",
    icon: Stethoscope,
  },
  {
    id: "confidence",
    label: "Explain confidence",
    message: "Why is the confidence score what it is? Explain confidence.",
    icon: Percent,
  },
  {
    id: "heatmap",
    label: "Explain heatmap",
    message: "Explain Grad-CAM and what the heatmap means.",
    icon: Flame,
  },
  {
    id: "recovery",
    label: "Recovery tips",
    message: "What recovery guidance should I discuss with my doctor?",
    icon: Activity,
  },
  {
    id: "lifestyle",
    label: "Healthy lifestyle",
    message: "Share healthy lifestyle tips that support lung health.",
    icon: Heart,
  },
  {
    id: "followup",
    label: "Follow-up advice",
    message: "What should I do next based on my saved follow-up recommendation?",
    icon: CalendarCheck,
  },
];

interface SuggestedQuestionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Suggested questions
      </p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <button
              key={prompt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt.message)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-teal-600"
                aria-hidden
              />
              {prompt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
