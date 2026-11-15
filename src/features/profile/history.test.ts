import { describe, expect, it } from "vitest";

import { formatChartMoney } from "@/features/leaderboard/format";

import {
  combineSeries,
  nearestIndex,
  roomyTicks,
  dailyChanges,
  dayKey,
  summariseMonth,
  sumDailyChanges,
  summariseYear,
  timeTicks,
  toneFor,
  valueAxis,
  type SeriesPoint,
} from "./history";

const at = (iso: string) => Date.parse(iso);

describe("dailyChanges", () => {
  it("measures each UTC day against the previous day's last value", () => {
    const series: SeriesPoint[] = [
      { t: at("2026-11-01T02:00:00Z"), v: 100 },
      { t: at("2026-11-01T20:00:00Z"), v: 150 }, // day 1 closes at 150
      { t: at("2026-11-02T10:00:00Z"), v: 120 },
      { t: at("2026-11-02T23:59:00Z"), v: 90 }, // day 2: 90 - 150 = -60
      { t: at("2026-11-03T08:00:00Z"), v: 90 }, // day 3: 0
    ];
    expect([...dailyChanges(series)]).toEqual([
      ["2026-11-02", -60],
      ["2026-11-03", 0],
    ]);
  });

  it("gives no change for the first day, or for a day after a gap (as the source)", () => {
    const series: SeriesPoint[] = [
      { t: at("2026-10-15T12:00:00Z"), v: 1000 },
      // 16 to 22 October: no data
      { t: at("2026-10-23T22:00:00Z"), v: 900 },
      { t: at("2026-10-24T22:00:00Z"), v: 11_453 },
    ];
    const changes = dailyChanges(series);
    expect(changes.has("2026-10-15")).toBe(false);
    expect(changes.has("2026-10-23")).toBe(false);
    expect(changes.get("2026-10-24")).toBe(10_553);
  });

  it("is empty for an empty series", () => {
    expect(dailyChanges([]).size).toBe(0);
  });
});

describe("sumDailyChanges", () => {
  it("adds each series' own daily changes, keeping each series' gaps", () => {
    const a = [
      { t: at("2026-11-01T12:00:00Z"), v: 100 },
      { t: at("2026-11-02T12:00:00Z"), v: 150 },
      { t: at("2026-11-03T12:00:00Z"), v: 140 },
    ];
    // Starts on 2 Nov at $90K: its first day has no change, not +$90K.
    const b = [
      { t: at("2026-11-02T12:00:00Z"), v: 90_000 },
      { t: at("2026-11-03T12:00:00Z"), v: 90_500 },
    ];
    expect(Object.fromEntries(sumDailyChanges([a, b]))).toEqual({
      "2026-11-02": 50,
      "2026-11-03": 490,
    });
  });

  it("equals dailyChanges for a single series", () => {
    const a = [
      { t: at("2026-11-01T12:00:00Z"), v: 1 },
      { t: at("2026-11-02T12:00:00Z"), v: 4 },
    ];
    expect(sumDailyChanges([a])).toEqual(dailyChanges(a));
    expect(sumDailyChanges([])).toEqual(new Map());
  });
});

describe("combineSeries", () => {
  it("adds the latest value of each series at every timestamp", () => {
    const a = [
      { t: 1, v: 10 },
      { t: 3, v: 30 },
    ];
    const b = [
      { t: 2, v: 5 },
      { t: 3, v: 7 },
    ];
    expect(combineSeries([a, b])).toEqual([
      { t: 1, v: 15 }, // b has not started: held at its first value
      { t: 2, v: 15 },
      { t: 3, v: 37 },
    ]);
  });

  it("does not draw a late series' starting total as a jump (review finding)", () => {
    // Kalshi tracking starts at the trader's total so far, $90,139 in the
    // recorded history, while Polymarket has data from long before.
    const polymarket = [
      { t: at("2025-09-25T00:00:00Z"), v: 1_000 },
      { t: at("2025-09-26T00:00:00Z"), v: 1_200 },
    ];
    const kalshi = [{ t: at("2025-09-26T14:25:32Z"), v: 90_139 }];
    const combined = combineSeries([polymarket, kalshi]);
    expect(combined[0].v).toBe(91_139);
    expect(combined.at(-1)?.v).toBe(91_339);
  });

  it("passes a single series through and ignores empty ones", () => {
    const a = [{ t: 1, v: 1 }];
    expect(combineSeries([a, []])).toEqual(a);
    expect(combineSeries([])).toEqual([]);
  });
});

// The source's November 2026 for one trader, as recorded on 2026-11-14.
const NOVEMBER: Record<number, number> = {
  1: 2152, 2: 7069, 3: -10863, 4: 145139, 5: 2433, 6: 3901, 7: 0,
  8: -827, 9: 7324, 10: -1500, 11: -4900, 12: 4700, 13: 1300, 14: 5200,
};
const novemberChanges = new Map(
  Object.entries(NOVEMBER).map(([day, change]) => [`2026-11-${day.padStart(2, "0")}`, change]),
);

describe("summariseMonth (PROF-02, PROF-03)", () => {
  const month = summariseMonth(novemberChanges, 2026, 10, "2026-11-14");

  it("counts wins and losses as the source does: 9W / 4L", () => {
    expect([month.wins, month.losses]).toEqual([9, 4]);
    expect(month.total).toBe(Object.values(NOVEMBER).reduce((sum, value) => sum + value, 0));
  });

  it("starts the grid on Sunday", () => {
    expect(month.leadingBlanks).toBe(0); // 1 Nov 2026 is a Sunday
    expect(summariseMonth(novemberChanges, 2026, 9, "2026-11-14").leadingBlanks).toBe(4);
  });

  it("marks the month's best gain on its own", () => {
    expect(month.days[3].tone).toBe("best");
    expect(month.days.filter((cell) => cell.tone === "best")).toHaveLength(1);
  });

  it("counts a small loss as a loss even though it is shaded flat", () => {
    const small = summariseMonth(new Map([["2026-09-19", -78]]), 2026, 8, "2026-11-14");
    expect(small.losses).toBe(1);
    expect(small.days[18].tone).toBe("flat");
  });

  it("leaves future days and days without data empty", () => {
    const day15 = month.days[14];
    expect(day15).toMatchObject({ day: 15, future: true, change: null, tone: "none" });
    const sparse = summariseMonth(new Map([["2026-10-02", 5]]), 2026, 9, "2026-11-14");
    expect(sparse.days[0]).toMatchObject({ future: false, change: null, tone: "none" });
    expect(sparse.total).toBe(5);
  });

  it("has no total for a month without data", () => {
    expect(summariseMonth(new Map(), 2026, 0, "2026-11-14").total).toBeNull();
  });
});

// Every shaded day read off the source's calendar for Sep to Nov 2026,
// except each month's best day: the dollar change and the shade it had.
describe("toneFor (PROF-03)", () => {
  it.each([
    [0, "flat"], [-78, "flat"],
    [-208, "loss-1"],
    [603, "gain-2"], [625, "gain-2"], [765, "gain-2"], [914, "gain-2"], [1300, "gain-2"],
    [1571, "gain-2"], [-827, "loss-2"], [-909, "loss-2"], [-1500, "loss-2"],
    [2152, "gain-3"], [2250, "gain-3"], [2433, "gain-3"], [2695, "gain-3"], [3901, "gain-3"],
    [4223, "gain-3"], [4700, "gain-3"], [-2873, "loss-3"], [-4366, "loss-3"], [-4563, "loss-3"],
    [-4900, "loss-3"],
    [5200, "gain-4"], [6087, "gain-4"], [6799, "gain-4"], [7069, "gain-4"], [7324, "gain-4"],
    [9035, "gain-4"], [-7582, "loss-4"],
    [10553, "gain-5"], [12420, "gain-5"], [15205, "gain-5"], [20535, "gain-5"],
    [28525, "gain-5"], [38031, "gain-5"], [-10863, "loss-5"], [-28045, "loss-5"],
  ])("%d -> %s", (change, expected) => {
    expect(toneFor(change)).toBe(expected);
  });
});

describe("summariseYear", () => {
  it("lists months up to today's and adds them up", () => {
    const year = summariseYear(
      new Map([
        ["2026-01-05", 100],
        ["2026-08-01", -40],
        ["2026-11-14", 10],
      ]),
      2026,
      "2026-11-14",
    );
    expect(year.months).toHaveLength(11);
    expect(year.months[0].total).toBe(100);
    expect(year.months[1].total).toBeNull();
    expect(year.total).toBe(70);
  });

  it("lists all twelve months of a past year", () => {
    expect(summariseYear(new Map(), 2025, "2026-11-14").months).toHaveLength(12);
  });
});

describe("chart ticks (PROF-04)", () => {
  it("reproduces the source's value axis for a recorded Kalshi chart", () => {
    // Recorded labels: -$12K, +$338K, +$688K, +$1.0M, +$1.2M, for data
    // running from about $89.6K to $1.105M.
    const axis = valueAxis(89_600, 1_104_963);
    expect(axis.ticks.map(formatChartMoney)).toEqual(["-$12K", "+$338K", "+$688K", "+$1.0M", "+$1.2M"]);
    expect(axis.ticks[1] - axis.ticks[0]).toBeCloseTo(350_000);
  });

  it("reproduces the step of a recorded Polymarket chart", () => {
    // Recorded labels: -$110K, +$190K, +$490K, +$790K, +$1.0M.
    const axis = valueAxis(-15_600, 926_285);
    expect(axis.ticks.map(formatChartMoney)).toEqual(["-$110K", "+$190K", "+$490K", "+$790K", "+$1.0M"]);
  });

  it("copes with a flat series", () => {
    const axis = valueAxis(500, 500);
    expect(axis.min).toBeLessThan(500);
    expect(axis.max).toBeGreaterThan(500);
  });

  it("ends for a range smaller than the values' precision (review finding)", () => {
    // This pair once made the tick loop run forever: its step was too small
    // to move a value of this size.
    const axis = valueAxis(932354.190485, 932354.1904850001);
    expect(axis.ticks.length).toBeGreaterThan(1);
    expect(axis.ticks.length).toBeLessThanOrEqual(11);
    expect(axis.max - axis.min).toBeGreaterThan(1);
  });

  it("copes with a series that never leaves zero", () => {
    expect(valueAxis(0, 0).ticks.length).toBeGreaterThan(1);
  });

  it("keeps the profile chart's label that sits 21 px under the top one", () => {
    const axis = valueAxis(89_600, 1_104_963);
    const pixelsPerUnit = 147 / (axis.max - axis.min);
    expect(roomyTicks(axis.ticks, pixelsPerUnit)).toHaveLength(5);
  });

  it("finds the point nearest in time for the pointer", () => {
    const line = [
      { t: 10, v: 1 },
      { t: 20, v: 2 },
      { t: 30, v: 3 },
    ];
    expect([5, 14, 16, 20, 26, 99].map((t) => nearestIndex(line, t))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(nearestIndex([{ t: 1, v: 0 }], 50)).toBe(0);
  });

  it("spaces time ticks evenly from first to last", () => {
    expect(timeTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
    expect(timeTicks(5, 5)).toEqual([5]);
  });

  it("names UTC days", () => {
    expect(dayKey(at("2026-11-14T23:59:59Z"))).toBe("2026-11-14");
  });
});
