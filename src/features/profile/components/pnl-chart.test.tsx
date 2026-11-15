// @vitest-environment jsdom
// PROF-04 acceptance: the chart draws the full history, and its first and last
// points are the series' first and last points.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatChartDate, formatChartMoney } from "@/lib/format";
import { nth } from "@/lib/test-utils";

import { PnlChart } from "./pnl-chart";

const CHART_WIDTH = 830;

beforeEach(() => {
  // jsdom has no layout: report a width as soon as the chart observes itself.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        this.callback([{ contentRect: { width: CHART_WIDTH } } as ResizeObserverEntry], this as never);
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const series = [
  { t: Date.UTC(2025, 8, 26), v: 90_139.43 },
  { t: Date.UTC(2026, 0, 1), v: 400_000 },
  { t: Date.UTC(2026, 10, 14), v: 1_108_537.5 },
];

describe("PnlChart (PROF-04)", () => {
  it("names its first and last points and draws every point", () => {
    render(<PnlChart series={series} />);
    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toBe(
      `Cumulative profit and loss from ${formatChartDate(nth(series, 0).t)} to ${formatChartDate(nth(series, 2).t)}, ending at ${formatChartMoney(nth(series, 2).v)}`,
    );
    const path = chart.querySelector("path")?.getAttribute("d") ?? "";
    expect(path.match(/[ML]/g)).toHaveLength(series.length);
    // The line runs across the plot: the first point at its left edge, the last at its right.
    const xs = [...path.matchAll(/[ML]([\d.]+),/g)].map(([, x]) => Number(x));
    // The rest of the width is the margin that holds the value labels.
    const MIN_SPAN_SHARE = 0.85;
    expect(xs[0]).toBe(Math.min(...xs));
    expect(xs.at(-1)).toBe(Math.max(...xs));
    expect((xs.at(-1) ?? 0) - nth(xs, 0)).toBeGreaterThan(CHART_WIDTH * MIN_SPAN_SHARE);
  });
});
