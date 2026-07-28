import type { ReactNode } from "react";
import { Crosshair, MapPin, Percent, ScanSearch, Sparkles } from "lucide-react";
import type { PredictionLabel } from "@/lib/types";
import {
  formatSuspiciousRegion,
  parseAffectedArea,
  parseHeatmapConfidenceNumber,
  parseInfectedPctNumber,
} from "@/lib/affected-area";
import { ConfidenceGauge } from "@/components/explainability/ConfidenceGauge";
import { cn } from "@/lib/utils";

interface ExplainabilityPanelProps {
  prediction: PredictionLabel;
  observedRegions: string;
  className?: string;
  /** Vertical stack for narrow sidebars; grid for wide image panels. */
  layout?: "stack" | "grid";
  showTitle?: boolean;
}

const LEGACY_FALLBACK_RE =
  /^abnormal lung opacity;?\s*see grad-cam for focal areas\.?$/i;

function isLegacyFallback(text: string): boolean {
  return LEGACY_FALLBACK_RE.test(text.trim());
}

function IconBadge({
  icon: Icon,
  tone = "slate",
}: {
  icon: typeof MapPin;
  tone?: "rose" | "teal" | "amber" | "slate";
}) {
  const tones = {
    rose: "bg-rose-100 text-rose-600 ring-rose-200/60 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
    teal: "bg-teal-100 text-teal-600 ring-teal-200/60 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/30",
    amber: "bg-amber-100 text-amber-600 ring-amber-200/60 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    slate: "bg-slate-100 text-slate-600 ring-slate-200/60 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600",
  };

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-9 sm:w-9",
        tones[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
    </span>
  );
}

function AreaProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone =
    clamped >= 40
      ? "bg-rose-500"
      : clamped >= 20
        ? "bg-orange-500"
        : "bg-amber-500";

  return (
    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/80">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          tone,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function PanelShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RegionHero({
  region,
  subtitle,
}: {
  region: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100/80 px-4 py-4 dark:border-slate-700/70 sm:px-5">
      <IconBadge icon={MapPin} tone="rose" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Suspicious Region
        </p>
        <p className="mt-1 break-words text-lg font-bold leading-snug text-slate-900 dark:text-slate-100">
          {region}
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MetricBlock({
  icon: Icon,
  iconTone,
  label,
  children,
  className,
}: {
  icon: typeof Percent;
  iconTone?: "rose" | "teal" | "amber" | "slate";
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-4 py-4 sm:px-5", className)}>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <IconBadge icon={Icon} tone={iconTone ?? "slate"} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function LegacyFallbackCard({ className }: { className?: string }) {
  return (
    <PanelShell className={className}>
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <IconBadge icon={Sparkles} tone="amber" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Grad-CAM Localization
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
            Abnormal lung opacity detected
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Focal areas are visible on the heatmap overlay. Re-analyze this scan
            to unlock structured region labels and percentages.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

function UnstructuredCard({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <PanelShell className={className}>
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <IconBadge icon={Crosshair} tone="teal" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Observed Regions
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {text}
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

export function ExplainabilityPanel({
  prediction,
  observedRegions,
  className,
  layout = "stack",
  showTitle = true,
}: ExplainabilityPanelProps) {
  const details = parseAffectedArea(observedRegions);
  const isPneumonia = prediction === "Pneumonia";
  const suspiciousRegion = formatSuspiciousRegion(details.lung, details.lobe);
  const affectedPct = parseInfectedPctNumber(observedRegions);
  const heatmapConfidence = parseHeatmapConfidenceNumber(observedRegions);
  const regionLabel = suspiciousRegion ?? details.lung ?? null;
  const hasQuantifiedArea = affectedPct != null;
  const isWide = layout === "grid";

  if (!isPneumonia) {
    return (
      <PanelShell className={className}>
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={ScanSearch} tone="teal" />
          <div>
            <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
              No suspicious regions highlighted
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Grad-CAM did not localize pneumonia-like opacity for this normal
              screening result.
            </p>
          </div>
        </div>
      </PanelShell>
    );
  }

  if (!details.raw) {
    return null;
  }

  if (isLegacyFallback(details.raw)) {
    return <LegacyFallbackCard className={className} />;
  }

  if (!details.structured) {
    return <UnstructuredCard text={details.raw} className={className} />;
  }

  const metricsRow = (
    <div
      className={cn(
        "grid divide-y divide-slate-100/80 dark:divide-slate-700/70",
        isWide
          ? "sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:divide-slate-100/80 dark:sm:divide-slate-700/70"
          : "grid-cols-1",
      )}
    >
      <MetricBlock icon={Percent} iconTone="rose" label="Affected Area">
        {hasQuantifiedArea ? (
          <>
            <p className="text-3xl font-bold tabular-nums leading-none text-rose-700 dark:text-rose-300">
              {affectedPct}%
            </p>
            <AreaProgressBar value={affectedPct} />
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Share of the image with strong Grad-CAM activation
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {details.infectedPct ?? "Not quantified"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Re-analyze to estimate affected area percentage
            </p>
          </>
        )}
      </MetricBlock>

      <MetricBlock icon={ScanSearch} iconTone="teal" label="Heatmap Confidence">
        {heatmapConfidence != null ? (
          <div className="flex flex-col items-start gap-1">
            <ConfidenceGauge
              value={heatmapConfidence}
              label=""
              size="sm"
              className="shrink-0"
            />
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Localization strength of the Grad-CAM focus
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Run a new analysis with Grad-CAM enabled to compute localization
            confidence.
          </p>
        )}
      </MetricBlock>
    </div>
  );

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {showTitle ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Explainability Highlights
        </p>
      ) : null}

      <PanelShell>
        {regionLabel ? (
          <RegionHero
            region={regionLabel}
            subtitle={
              details.lobe && suspiciousRegion ? details.lobe : details.lung
            }
          />
        ) : null}
        {metricsRow}
      </PanelShell>
    </div>
  );
}
