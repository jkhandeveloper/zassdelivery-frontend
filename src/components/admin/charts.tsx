"use client";

import * as React from "react";

import { cn, formatCount } from "@/lib/utils";

/**
 * The admin's two chart forms.
 *
 * Deliberately single-series, both of them. The dashboard's honest question is
 * "orders and revenue over the last fortnight", and the tempting answer — one
 * chart with two y-axes — is the one thing a two-measure chart must never be:
 * the shape of each line then depends on the scales chosen for it, so the two
 * can be made to cross wherever the author likes. Two charts side by side say
 * the same thing and cannot lie about it.
 *
 * With one series per chart there is also no categorical palette to get wrong:
 * every mark on every admin chart is the brand hue, and what is being measured
 * comes from the panel title rather than from a colour the reader has to decode.
 */

/** Tracks a container's width so strokes and type render at their real size. */
function useMeasuredWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const element = ref.current;

    if (element === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry !== undefined) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/** Rounds an axis maximum up to something a person would write down. */
function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;

  return step * magnitude;
}

/** "12 Aug" — enough to place a point in the fortnight, no more. */
function shortDay(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" }).format(date);
}

export interface TrendPoint {
  /** "2026-08-10". */
  date: string;
  value: number;
}

export interface TrendChartProps {
  points: readonly TrendPoint[];
  /** Names the measure for screen readers and the tooltip. */
  label: string;
  format?: (value: number) => string;
  height?: number;
  className?: string;
}

const PAD = { top: 16, right: 14, bottom: 24, left: 52 } as const;

/**
 * A line with a washed area under it — change over time, one measure.
 *
 * Labels only the peak and the last point: a number on all fourteen days is
 * chaos, and the axis plus the hover tooltip carry the rest.
 */
export function TrendChart({
  points,
  label,
  format = formatCount,
  height = 200,
  className,
}: TrendChartProps) {
  const [ref, width] = useMeasuredWidth();
  const [hovered, setHovered] = React.useState<number | null>(null);

  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = height - PAD.top - PAD.bottom;

  const max = niceCeiling(Math.max(...points.map((point) => point.value), 0));
  const peakIndex = points.reduce(
    (best, point, index) => (point.value > (points[best]?.value ?? -1) ? index : best),
    0,
  );

  const x = (index: number): number =>
    points.length <= 1
      ? PAD.left + plotWidth / 2
      : PAD.left + (index / (points.length - 1)) * plotWidth;

  const y = (value: number): number => PAD.top + plotHeight - (value / max) * plotHeight;

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const area =
    points.length === 0
      ? ""
      : `M ${x(0)},${PAD.top + plotHeight} L ${line.split(" ").join(" L ")} L ${x(points.length - 1)},${PAD.top + plotHeight} Z`;

  function trackPointer(event: React.PointerEvent<SVGSVGElement>) {
    if (points.length === 0 || plotWidth <= 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - PAD.left;
    const ratio = Math.min(1, Math.max(0, offset / plotWidth));

    setHovered(Math.round(ratio * (points.length - 1)));
  }

  const active = hovered === null ? undefined : points[hovered];

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {width > 0 && points.length > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label} over ${points.length} days. Peak ${format(points[peakIndex]?.value ?? 0)} on ${shortDay(points[peakIndex]?.date ?? "")}.`}
          onPointerMove={trackPointer}
          onPointerLeave={() => setHovered(null)}
          className="touch-none"
        >
          {/* Gridlines: hairline, solid, one step off the surface. */}
          {[0, 0.5, 1].map((fraction) => {
            const gridY = PAD.top + plotHeight * (1 - fraction);

            return (
              <g key={fraction}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={gridY}
                  y2={gridY}
                  className="stroke-border-subtle"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={gridY + 4}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[10px] tabular-nums"
                >
                  {format(max * fraction)}
                </text>
              </g>
            );
          })}

          <path d={area} className="fill-brand opacity-10" />
          <polyline
            points={line}
            fill="none"
            className="stroke-brand"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* The end point, ringed in the surface colour so it reads over the line. */}
          <circle
            cx={x(points.length - 1)}
            cy={y(points[points.length - 1]?.value ?? 0)}
            r={4}
            className="fill-brand stroke-surface"
            strokeWidth={2}
          />

          {/* First, middle and last day only — fourteen tick labels do not fit. */}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1]
            .filter((index, position, all) => all.indexOf(index) === position)
            .map((index) => (
              <text
                key={index}
                x={x(index)}
                y={height - 6}
                textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                className="fill-[var(--text-muted)] text-[10px]"
              >
                {shortDay(points[index]?.date ?? "")}
              </text>
            ))}

          {hovered !== null && active !== undefined && (
            <g>
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={PAD.top}
                y2={PAD.top + plotHeight}
                className="stroke-border-strong"
                strokeWidth={1}
              />
              <circle
                cx={x(hovered)}
                cy={y(active.value)}
                r={5}
                className="fill-brand stroke-surface"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      {hovered !== null && active !== undefined && width > 0 && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-border-subtle bg-surface px-3 py-2 shadow-card"
          style={{
            left: Math.min(Math.max(x(hovered), 70), width - 70),
          }}
        >
          <p className="text-[11px] font-semibold text-muted">{shortDay(active.date)}</p>
          <p className="numeric text-sm font-bold text-primary">{format(active.value)}</p>
        </div>
      )}

      {width > 0 && points.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">Nothing recorded in this window.</p>
      )}
    </div>
  );
}

export interface BreakdownRow {
  label: string;
  value: number;
  /** A second figure shown to the right — a count beside a total, usually. */
  note?: string;
}

/**
 * Ranked magnitudes as horizontal bars.
 *
 * Bars rather than a pie: comparing lengths against a shared baseline is a
 * judgement people make accurately, and comparing angles is not. Sorted
 * descending, because the question is always "which is biggest".
 */
export function BarBreakdown({
  rows,
  format = formatCount,
  emptyLabel = "Nothing to show yet.",
  className,
}: {
  rows: readonly BreakdownRow[];
  format?: (value: number) => string;
  emptyLabel?: string;
  className?: string;
}) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((row) => row.value), 0);

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className={cn("flex flex-col gap-3.5", className)}>
      {sorted.map((row) => (
        <li key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-semibold text-primary">{row.label}</span>
            <span className="numeric shrink-0 text-sm text-secondary">
              {format(row.value)}
              {row.note !== undefined && (
                <span className="pl-2 text-xs text-muted">{row.note}</span>
              )}
            </span>
          </div>
          {/* Track is a lighter step of the same surface; the fill carries the value. */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${max === 0 ? 0 : Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A twelve-point sparkline for a stat tile.
 *
 * No axes and no labels: it says "the shape of the last fortnight", and the
 * number above it says how much.
 */
export function Sparkline({
  values,
  className,
}: {
  values: readonly number[];
  className?: string;
}) {
  if (values.length < 2) {
    return null;
  }

  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 24 - (value / max) * 22;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-6 w-full", className)}
    >
      <polyline
        points={points}
        fill="none"
        className="stroke-brand"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
