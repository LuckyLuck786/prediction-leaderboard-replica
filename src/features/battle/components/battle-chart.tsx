"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { formatBattleMoney, formatChartDate, formatDayTick } from "@/features/leaderboard/format";
import { nearestIndex, roomyTicks, timeTicks, type SeriesPoint } from "@/features/profile/history";

import { comparisonAxis, type Comparison } from "../comparison";

/** Plot geometry: 256 px high as measured on the source; margins as on the profile chart. */
const HEIGHT = 256;
const MARGIN = { top: 10, right: 19, bottom: 35, left: 65 };
const TICK_GAP = 8;
const TIME_LABEL_OFFSET = 12;
/** The source labelled six dates along this chart. */
const TIME_TICK_COUNT = 6;
/** Plot height in pixels, which decides which value labels have room. */
export const BATTLE_PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
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
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { start, end } = comparison;
  const axis = comparisonAxis(comparison);
  const ends = lines.map((line) => `${line.name} ${formatBattleMoney(comparison[line.key].at(-1)?.v ?? 0)}`);
  const label = `P&L change from ${formatChartDate(start)} to ${formatChartDate(end)}: ${ends.join(", ")}`;

  const plotWidth = (width ?? 0) - MARGIN.left - MARGIN.right;
  const plotHeight = BATTLE_PLOT_HEIGHT;
  const span = Math.max(end - start, 1);
  const range = axis.max - axis.min;
  const x = (t: number) => MARGIN.left + ((t - start) / span) * plotWidth;
  const y = (v: number) => MARGIN.top + (1 - (v - axis.min) / range) * plotHeight;
  const path = (key: ChartLine["key"]) =>
    comparison[key]
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`)
      .join("");

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const t = start + ((event.clientX - box.left - MARGIN.left) / plotWidth) * span;
    setHoverT(Math.min(Math.max(t, start), end));
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
              {formatBattleMoney(tick)}
            </text>
          ))}
          {timeTicks(start, end, TIME_TICK_COUNT).map((tick) => (
            <text
              key={`t-${tick}`}
              x={x(tick)}
              y={HEIGHT - MARGIN.bottom + TIME_LABEL_OFFSET}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {formatDayTick(tick)}
            </text>
          ))}
          {lines.map((line) => (
            <path key={line.key} d={path(line.key)} fill="none" className={line.stroke} strokeWidth={2} />
          ))}
          {hoverT !== null ? (
            <>
              <line
                x1={x(hoverT)}
                x2={x(hoverT)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
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
          style={{ left: Math.min(Math.max(x(hoverT) + 12, 0), width - TOOLTIP_WIDTH) }}
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
