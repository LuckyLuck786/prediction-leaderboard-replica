import { describe, expect, it } from "vitest";

import { CHART_MARGIN, plotScales, tooltipLeft } from "./chart-geometry";

const axis = { min: -100, max: 300, ticks: [-100, 300] };
const scales = plotScales(500, 200, 1_000, 5_000, axis);

describe("plotScales", () => {
  it("puts the first moment and the axis maximum at the plot's top left", () => {
    expect(scales.x(1_000)).toBe(CHART_MARGIN.left);
    expect(scales.y(300)).toBe(CHART_MARGIN.top);
  });

  it("puts the last moment and the axis minimum at the plot's bottom right", () => {
    expect(scales.x(5_000)).toBe(500 - CHART_MARGIN.right);
    expect(scales.y(-100)).toBe(200 - CHART_MARGIN.bottom);
  });

  it("reads back the moment under a pixel", () => {
    expect(scales.timeAt(scales.x(3_210))).toBeCloseTo(3_210, 6);
  });

  it("draws a path that moves to the first point and lines to the rest", () => {
    const d = scales.linePath([
      { t: 1_000, v: 300 },
      { t: 5_000, v: -100 },
    ]);
    expect(d).toBe(`M${CHART_MARGIN.left}.0,${CHART_MARGIN.top}.0L${500 - CHART_MARGIN.right}.0,165.0`);
  });
});

describe("tooltipLeft", () => {
  it("sits beside the point, and never past either edge", () => {
    expect(tooltipLeft(100, 500, 130)).toBe(112);
    expect(tooltipLeft(-50, 500, 130)).toBe(0);
    expect(tooltipLeft(480, 500, 130)).toBe(370);
  });
});
