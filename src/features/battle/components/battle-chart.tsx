"use client";

import { useMemo, useState, type PointerEvent } from "react";

import {
  CHART_MARGIN,
  TICK_GAP,
  TIME_LABEL_OFFSET,
  plotScales,
  tooltipLeft,
} from "@/features/profile/chart-geometry";
import { nearestIndex, roomyTicks, timeTicks, type SeriesPoint } from "@/features/profile/history";
import { formatBattleMoney, formatChartDate, formatDayTick } from "@/lib/format";
import { useElementWidth } from "@/lib/use-element-width";

import { comparisonAxis, type Comparison } from "../comparison";

/** Chart height measured on the source: 256 px, labels included. */
const HEIGHT = 256;
/** The source labelled six dates along this chart. */
const TIME_TICK_COUNT = 6;
/** Plot height in pixels, which decides which value labels have room. */
export const BATTLE_PLOT_HEIGHT = HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
/** Room kept at the right edge for the hover box, which holds two lines. */
const TOOLTIP_WIDTH = 170;

export interface ChartLine {
  key: "polymarket" | "kalshi";
  name: string;
  /** Tailwind stroke and fill classes in the platform's color. */
  stroke: string;
  fill: string;
}

/** Each line's data point closest to the pointer, so a dot always sits on its line. */
function pointsUnder(
  comparison: Comparison,
  lines: readonly ChartLine[],
  t: number,
): Array<{ line: ChartLine; point: SeriesPoint }> {
  return lines.flatMap((line) => {
    const series = comparison[line.key];
    const point = series[nearestIndex(series, t)];
    return point ? [{ line, point }] : [];
  });
}

/**
 * BATTLE-03: both traders' P&L change since the common start, one line each,
 * with both values under the pointer.
 */
export function BattleChart({
  comparison,
  lines,
}: {
  comparison: Comparison;
  lines: readonly [ChartLine, ChartLine];
}) {
  const { ref: container, width } = useElementWidth<HTMLDivElement>();
  const [hoverT, setHoverT] = useState<number | null>(null);

  const { start, end } = comparison;
  // The pointer re-renders the chart on every move; the axis, scales and lines
  // are worked out again only when the data or the width change.
  const axis = useMemo(() => comparisonAxis(comparison), [comparison]);
  const scales = useMemo(() => plotScales(width ?? 0, HEIGHT, start, end, axis), [width, start, end, axis]);
  const paths = useMemo(
    () => lines.map((line) => ({ line, d: scales.linePath(comparison[line.key]) })),
    [lines, scales, comparison],
  );

  const ends = lines.map((line) => `${line.name} ${formatBattleMoney(comparison[line.key].at(-1)?.v ?? 0)}`);
  const label = `P&L change from ${formatChartDate(start)} to ${formatChartDate(end)}: ${ends.join(", ")}`;
  const { x, y, plotHeight } = scales;
  const range = axis.max - axis.min;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHoverT(Math.min(Math.max(scales.timeAt(event.clientX - box.left), start), end));
  };

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
          onPointerLeave={() => setHoverT(null)}
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
              {formatBattleMoney(tick)}
            </text>
          ))}
          {timeTicks(start, end, TIME_TICK_COUNT).map((tick) => (
            <text
              key={`t-${tick}`}
              x={x(tick)}
              y={HEIGHT - CHART_MARGIN.bottom + TIME_LABEL_OFFSET}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {formatDayTick(tick)}
            </text>
          ))}
          {paths.map(({ line, d }) => (
            <path key={line.key} d={d} fill="none" className={line.stroke} strokeWidth={2} />
          ))}
          {hoverT !== null ? (
            <>
              <line
                x1={x(hoverT)}
                x2={x(hoverT)}
                y1={CHART_MARGIN.top}
                y2={HEIGHT - CHART_MARGIN.bottom}
                className="stroke-muted-foreground/40"
              />
              {pointsUnder(comparison, lines, hoverT).map(({ line, point }) => (
                <circle key={line.key} cx={x(point.t)} cy={y(point.v)} r={3} className={line.fill} />
              ))}
            </>
          ) : null}
        </svg>
      )}
      {hoverT !== null && width !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute top-2 rounded-lg border border-border bg-card px-3 py-2"
          style={{ left: tooltipLeft(x(hoverT), width, TOOLTIP_WIDTH) }}
        >
          <p className="mb-1 text-xs text-muted-foreground">{formatChartDate(hoverT)}</p>
          {pointsUnder(comparison, lines, hoverT).map(({ line, point }) => (
            <p key={line.key} className="text-sm">
              <span className="text-muted-foreground">{line.name} </span>
              <span className="font-semibold">{formatBattleMoney(point.v)}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
