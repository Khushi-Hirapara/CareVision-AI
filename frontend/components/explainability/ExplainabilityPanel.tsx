import type { ReactNode } from "react";
import { Crosshair, MapPin, Percent, ScanSearch, Sparkles } from "lucide-react";
import type { PredictionLabel } from "@/lib/types";
import { isAbnormalPrediction } from "@/lib/prediction";
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
  /** Vertical stack for narrow panels; side-by-side only when space allows. */
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
    rose: "bg-rose-100 text-rose-600 ring-rose-200/70 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-400/40",
    teal: "bg-teal-100 text-teal-600 ring-teal-200/70 dark:bg-teal-500/20 dark:text-teal-300 dark:ring-teal-400/40",
    amber:
      "bg-amber-100 text-amber-600 ring-amber-200/70 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-400/40",
    slate:
      "bg-slate-100 text-slate-600 ring-slate-200/70 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-500/50",
  };

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
        tones[tone],
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

function AreaProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone =
    clamped >= 40
      ? "bg-rose-500 dark:bg-rose-400"
      : clamped >= 20
        ? "bg-orange-500 dark:bg-orange-400"
        : "bg-amber-500 dark:bg-amber-400";

  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", tone)}
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
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/60 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20",
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
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700/70 sm:px-5">
      <IconBadge icon={MapPin} tone="rose" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Suspicious Region
        </p>
        <p className="mt-1 break-words text-lg font-bold leading-snug text-slate-900 dark:text-white">
          {region}
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconTone,
  label,
  children,
}: {
  icon: typeof Percent;
  iconTone?: "rose" | "teal" | "amber" | "slate";
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-950/50">
      <div className="flex items-center gap-2.5">
        <IconBadge icon={Icon} tone={iconTone ?? "slate"} />
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function LegacyFallbackCard({ className }: { className?: string }) {
  return (
    <PanelShell className={className}>
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <IconBadge icon={Sparkles} tone="amber" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
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
  const isAbnormal = isAbnormalPrediction(prediction);
  const suspiciousRegion = formatSuspiciousRegion(details.lung, details.lobe);
  const affectedPct = parseInfectedPctNumber(observedRegions);
  const heatmapConfidence = parseHeatmapConfidenceNumber(observedRegions);
  const regionLabel = suspiciousRegion ?? details.lung ?? null;
  const hasQuantifiedArea = affectedPct != null;
  const isWide = layout === "grid";

  if (!isAbnormal) {
    return (
      <PanelShell className={className}>
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={ScanSearch} tone="teal" />
          <div className="min-w-0">
            <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
              No suspicious regions highlighted
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Grad-CAM did not localize abnormal opacity for this normal screening
              result.
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

  const metrics = (
    <div
      className={cn(
        "grid gap-3 p-4 sm:p-5",
        isWide ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1",
      )}
    >
      <MetricCard icon={Percent} iconTone="rose" label="Affected Area">
        {hasQuantifiedArea ? (
          <>
            <p className="text-3xl font-bold tabular-nums leading-none text-rose-700 dark:text-rose-300">
              {affectedPct}%
            </p>
            <AreaProgressBar value={affectedPct} />
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Share of the image with strong Grad-CAM activation
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {details.infectedPct ?? "Not quantified"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Re-analyze to estimate affected area percentage
            </p>
          </>
        )}
      </MetricCard>

      <MetricCard icon={ScanSearch} iconTone="teal" label="Heatmap Confidence">
        {heatmapConfidence != null ? (
          <div className="flex items-center gap-4">
            <ConfidenceGauge
              value={heatmapConfidence}
              label=""
              size="sm"
              className="shrink-0"
            />
            <p className="min-w-0 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Localization strength of the Grad-CAM focus
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Run a new analysis with Grad-CAM enabled to compute localization
            confidence.
          </p>
        )}
      </MetricCard>
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
        {metrics}
      </PanelShell>
    </div>
  );
}
