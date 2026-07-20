import { cn } from "@/lib/utils";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface TrendLineChartProps {
  points: LineChartPoint[];
  /** Y-axis domain. Defaults to data min/max with padding. */
  yMin?: number;
  yMax?: number;
  /** Format tick labels on the Y axis. */
  formatY?: (value: number) => string;
  strokeClassName?: string;
  fillClassName?: string;
  dotClassName?: string;
  yTickValues?: number[];
  className?: string;
  emptyMessage?: string;
}

export function TrendLineChart({
  points,
  yMin,
  yMax,
  formatY = (v) => String(v),
  strokeClassName = "stroke-teal-600",
  fillClassName = "fill-teal-500/15",
  dotClassName = "fill-teal-600",
  yTickValues,
  className,
  emptyMessage = "Not enough data to chart yet.",
}: TrendLineChartProps) {
  if (points.length === 0) {
    return (
      <div
        className={cn(
          "flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const width = 560;
  const height = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const dataMin = Math.min(...points.map((p) => p.value));
  const dataMax = Math.max(...points.map((p) => p.value));
  const domainMin = yMin ?? Math.min(dataMin, dataMax - 1);
  const domainMax = yMax ?? Math.max(dataMax, dataMin + 1);
  const span = Math.max(domainMax - domainMin, 0.0001);

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? padL + plotW / 2
        : padL + (index / (points.length - 1)) * plotW;
    const y = padT + plotH - ((point.value - domainMin) / span) * plotH;
    return { ...point, x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length === 1
      ? ""
      : `${linePath} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${coords[0]!.x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const ticks =
    yTickValues ??
    Array.from({ length: 4 }, (_, i) => domainMin + (span * i) / 3);

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label="Trend line chart"
      >
        {ticks.map((tick) => {
          const y = padT + plotH - ((tick - domainMin) / span) * plotH;
          return (
            <g key={tick}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                className="stroke-slate-100"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {formatY(tick)}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} className={fillClassName} /> : null}
        <path
          d={linePath}
          fill="none"
          className={strokeClassName}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c) => (
          <g key={`${c.label}-${c.x}`}>
            <circle
              cx={c.x}
              cy={c.y}
              r={4}
              className={cn(dotClassName, "stroke-white")}
              strokeWidth={2}
            />
            <text
              x={c.x}
              y={height - 12}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface TrendBarChartProps {
  bars: { label: string; value: number }[];
  className?: string;
  emptyMessage?: string;
  barClassName?: string;
}

export function TrendBarChart({
  bars,
  className,
  emptyMessage = "Not enough data to chart yet.",
  barClassName = "fill-teal-500",
}: TrendBarChartProps) {
  if (bars.length === 0) {
    return (
      <div
        className={cn(
          "flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const width = 560;
  const height = 220;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const gap = 10;
  const barW = Math.max(18, (plotW - gap * (bars.length - 1)) / bars.length);

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label="Scan frequency bar chart"
      >
        {[0, 0.5, 1].map((t) => {
          const value = max * t;
          const y = padT + plotH - t * plotH;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                className="stroke-slate-100"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {bars.map((bar, index) => {
          const h = (bar.value / max) * plotH;
          const x = padL + index * (barW + gap);
          const y = padT + plotH - h;
          return (
            <g key={bar.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 2)}
                rx={6}
                className={barClassName}
              />
              <text
                x={x + barW / 2}
                y={height - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {bar.label}
              </text>
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-semibold"
              >
                {bar.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
