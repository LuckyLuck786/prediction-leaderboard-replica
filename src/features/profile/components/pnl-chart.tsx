"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { formatChartDate, formatChartMoney, formatChartTick } from "@/features/leaderboard/format";
import { cn } from "@/lib/utils";

import { nearestIndex, roomyTicks, timeTicks, valueAxis, type SeriesPoint } from "../history";
import { signedTextClass } from "./tone-styles";

/** Plot geometry measured on the source's chart: 192 px high, labels outside. */
const HEIGHT = 192;
const MARGIN = { top: 10, right: 19, bottom: 35, left: 65 };
/** Gap between the plot and its axis labels. */
const TICK_GAP = 8;
/** Time labels sit this far below the plot, measured to their baseline. */
const TIME_LABEL_OFFSET = 12;

/**
 * PROF-04: cumulative profit and loss over the trader's whole history, with
 * the date and value under the pointer.
 */
export function PnlChart({ series }: { series: readonly SeriesPoint[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const first = series[0];
  const last = series.at(-1);
  const values = series.map((point) => point.v);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const axis = valueAxis(dataMin, dataMax);
  const label =
    first && last
      ? `Cumulative profit and loss from ${formatChartDate(first.t)} to ${formatChartDate(last.t)}, ending at ${formatChartMoney(last.v)}`
      : "No history";

  if (!first || !last) return null;

  const plotWidth = (width ?? 0) - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const span = Math.max(last.t - first.t, 1);
  const range = axis.max - axis.min;
  const x = (t: number) => MARGIN.left + ((t - first.t) / span) * plotWidth;
  const y = (v: number) => MARGIN.top + (1 - (v - axis.min) / range) * plotHeight;
  const path = series
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`)
    .join("");

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const t = first.t + ((event.clientX - box.left - MARGIN.left) / plotWidth) * span;
    setHover(nearestIndex(series, t));
  };

  const point = hover === null ? null : series[hover];

  return (
    <div ref={container} className="relative w-full" style={{ height: HEIGHT }}>
      {width === null ? (
        <div aria-hidden className="h-full w-full rounded bg-muted/40 motion-safe:animate-pulse" />
      ) : (
        <svg
          role="img"
          aria-label={label}
          width={width}
          height={HEIGHT}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
          className="block"
        >
          {axis.min < 0 && axis.max > 0 ? (
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(0)}
              y2={y(0)}
              className="stroke-border"
              strokeDasharray="3 3"
            />
          ) : null}
          {roomyTicks(axis.ticks, plotHeight / range).map((tick) => (
            <text
              key={`v-${tick}`}
              x={MARGIN.left - TICK_GAP}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {formatChartMoney(tick)}
            </text>
          ))}
          {timeTicks(first.t, last.t).map((tick) => (
            <text
              key={`t-${tick}`}
              x={x(tick)}
              y={HEIGHT - MARGIN.bottom + TIME_LABEL_OFFSET}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {formatChartTick(tick)}
            </text>
          ))}
          <path d={path} fill="none" className="stroke-positive" strokeWidth={2} />
          {point ? (
            <>
              <line
                x1={x(point.t)}
                x2={x(point.t)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                className="stroke-muted-foreground/40"
              />
              <circle cx={x(point.t)} cy={y(point.v)} r={3} className="fill-positive" />
            </>
          ) : null}
        </svg>
      )}
      {point && width !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute top-2 rounded-lg border border-border bg-card px-3 py-2"
          style={{
            left: Math.min(Math.max(x(point.t) + 12, 0), width - 130),
          }}
        >
          <p className="mb-1 text-xs text-muted-foreground">{formatChartDate(point.t)}</p>
          <p className={cn("text-sm font-semibold", signedTextClass(point.v))}>
            {formatChartMoney(point.v)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
