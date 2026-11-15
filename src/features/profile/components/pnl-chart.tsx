"use client";

import { useMemo, useState, type PointerEvent } from "react";

import { formatChartDate, formatChartMoney, formatChartTick } from "@/lib/format";
import { useElementWidth } from "@/lib/use-element-width";
import { cn } from "@/lib/utils";

import { CHART_MARGIN, TICK_GAP, TIME_LABEL_OFFSET, plotScales, tooltipLeft } from "../chart-geometry";
import { nearestIndex, roomyTicks, timeTicks, valueAxis, valueRange, type SeriesPoint } from "../history";
import { signedTextClass } from "./tone-styles";

/** Chart height measured on the source: 192 px, labels included. */
const HEIGHT = 192;
/** Room kept at the right edge for the hover box, so it stays on the chart. */
const TOOLTIP_WIDTH = 130;

/**
 * PROF-04: cumulative profit and loss over the trader's whole history, with
 * the date and value under the pointer.
 */
export function PnlChart({ series }: { series: readonly SeriesPoint[] }) {
  const { ref: container, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const first = series[0];
  const last = series.at(-1);
  // The pointer re-renders the chart on every move; the axis, scales and line
  // are worked out again only when the data or the width change.
  const axis = useMemo(() => {
    const { min, max } = valueRange(series);
    return valueAxis(min, max);
  }, [series]);
  const scales = useMemo(
    () => plotScales(width ?? 0, HEIGHT, first?.t ?? 0, last?.t ?? 0, axis),
    [width, first, last, axis],
  );
  const path = useMemo(() => scales.linePath(series), [scales, series]);

  if (!first || !last) return null;

  const label = `Cumulative profit and loss from ${formatChartDate(first.t)} to ${formatChartDate(last.t)}, ending at ${formatChartMoney(last.v)}`;
  const { x, y, plotHeight } = scales;
  const range = axis.max - axis.min;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(series, scales.timeAt(event.clientX - box.left)));
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
              x1={CHART_MARGIN.left}
              x2={width - CHART_MARGIN.right}
              y1={y(0)}
              y2={y(0)}
              className="stroke-border"
              strokeDasharray="3 3"
            />
          ) : null}
          {roomyTicks(axis.ticks, plotHeight / range).map((tick) => (
            <text
              key={`v-${tick}`}
              x={CHART_MARGIN.left - TICK_GAP}
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
              y={HEIGHT - CHART_MARGIN.bottom + TIME_LABEL_OFFSET}
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
                y1={CHART_MARGIN.top}
                y2={HEIGHT - CHART_MARGIN.bottom}
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
          style={{ left: tooltipLeft(x(point.t), width, TOOLTIP_WIDTH) }}
        >
          <p className="mb-1 text-xs text-muted-foreground">{formatChartDate(point.t)}</p>
          <p className={cn("text-sm font-semibold", signedTextClass(point.v))}>{formatChartMoney(point.v)}</p>
        </div>
      ) : null}
    </div>
  );
}
