// Geometry both P&L charts share: the profile chart and the head-to-head
// chart. Margins hold the value labels on the left and the dates below.

import type { SeriesPoint, ValueAxis } from "./history";

/** Measured on the source's profile chart; the head-to-head chart uses the same. */
export const CHART_MARGIN = { top: 10, right: 19, bottom: 35, left: 65 } as const;
/** Gap between the plot and its value labels. */
export const TICK_GAP = 8;
/** Date labels sit this far below the plot, measured to their baseline. */
export const TIME_LABEL_OFFSET = 12;
/** The hover box starts this far right of the point it describes. */
const TOOLTIP_OFFSET = 12;

export interface PlotScales {
  plotWidth: number;
  plotHeight: number;
  /** Horizontal pixel position of a moment. */
  x: (t: number) => number;
  /** Vertical pixel position of a value. */
  y: (v: number) => number;
  /** The moment under a horizontal pixel position, counted from the chart's left edge. */
  timeAt: (px: number) => number;
  /** An SVG path through the points, in order. */
  linePath: (points: readonly SeriesPoint[]) => string;
}

/** Pixel scales for a chart of value over time, `width` by `height` with the shared margins. */
export function plotScales(
  width: number,
  height: number,
  start: number,
  end: number,
  axis: ValueAxis,
): PlotScales {
  const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const plotHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const span = Math.max(end - start, 1);
  const range = axis.max - axis.min;
  const x = (t: number) => CHART_MARGIN.left + ((t - start) / span) * plotWidth;
  const y = (v: number) => CHART_MARGIN.top + (1 - (v - axis.min) / range) * plotHeight;
  return {
    plotWidth,
    plotHeight,
    x,
    y,
    timeAt: (px) => start + ((px - CHART_MARGIN.left) / plotWidth) * span,
    linePath: (points) =>
      points
        .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`)
        .join(""),
  };
}

/** Left edge of a hover box beside the point at `px`, kept inside the chart. */
export function tooltipLeft(px: number, chartWidth: number, tooltipWidth: number): number {
  return Math.min(Math.max(px + TOOLTIP_OFFSET, 0), chartWidth - tooltipWidth);
}
