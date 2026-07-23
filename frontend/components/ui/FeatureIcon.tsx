import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureIconTone =
  | "teal"
  | "cyan"
  | "sky"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "solid"
  | "glass";

const TONE_CLASSES: Record<FeatureIconTone, string> = {
  teal: "feature-icon--teal",
  cyan: "feature-icon--cyan",
  sky: "feature-icon--sky",
  violet: "feature-icon--violet",
  emerald: "feature-icon--emerald",
  amber: "feature-icon--amber",
  rose: "feature-icon--rose",
  slate: "feature-icon--slate",
  solid: "feature-icon--solid",
  glass: "feature-icon--glass",
};

interface FeatureIconProps {
  icon: LucideIcon;
  tone?: FeatureIconTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "feature-icon--sm",
  md: "feature-icon--md",
  lg: "feature-icon--lg",
} as const;

const ICON_PX = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

/** Polished icon tile — soft glow, consistent stroke, light + dark ready. */
export function FeatureIcon({
  icon: Icon,
  tone = "teal",
  size = "md",
  className,
}: FeatureIconProps) {
  return (
    <span
      className={cn(
        "feature-icon",
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
      aria-hidden
    >
      <span className="feature-icon__glow" />
      <Icon
        className="feature-icon__glyph"
        size={ICON_PX[size]}
        strokeWidth={2.25}
        absoluteStrokeWidth
      />
    </span>
  );
}
