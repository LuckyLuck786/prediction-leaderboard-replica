import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { formatBattleMoney } from "@/lib/format";
import { roomyTicks } from "@/features/profile/history";
import { parseKalshiHistory, parsePolymarketPnl } from "@/features/profile/history-data";

import { BATTLE_PLOT_HEIGHT } from "./components/battle-chart";
import { changeSince, compare, comparisonAxis } from "./comparison";

const at = (iso: string) => Date.parse(iso);

// Shapes recorded on 2026-11-14 from the two documented histories of the
// source's pair. The source's own comparison reported the same start, the
// same baselines ($45,200.28 and $21,063.72247) and lines starting at 0.
const KALSHI_START = at("2025-09-27T09:23:39Z");
const kalshi = [
  { t: KALSHI_START, v: 45_200.28 },
  { t: at("2025-09-28T10:00:00Z"), v: 46_000 },
  { t: at("2026-11-14T18:27:49Z"), v: 675_134.8 },
];
const polymarket = [
  { t: at("2025-09-26T23:59:59.999Z"), v: 21_251.493227 },
  { t: at("2025-09-27T23:59:59.999Z"), v: 21_063.72247 },
  { t: at("2026-11-14T00:59:12Z"), v: 114_987.150194 },
];

describe("compare (BATTLE-03)", () => {
  const comparison = compare(polymarket, kalshi);

  it("starts where both traders have data, the Kalshi history's first point", () => {
    expect(comparison?.start).toBe(KALSHI_START);
    expect(comparison?.end).toBe(at("2026-11-14T18:27:49Z"));
  });

  it("starts both lines at zero, against the source's recorded baselines", () => {
    expect(comparison?.kalshi[0]).toEqual({ t: KALSHI_START, v: 0 });
    expect(comparison?.polymarket[0]?.v).toBe(0);
    expect(comparison?.polymarket[0]?.t).toBe(at("2025-09-27T23:59:59.999Z"));
    expect(comparison?.kalshi.at(-1)?.v).toBeCloseTo(675_134.8 - 45_200.28, 6);
    expect(comparison?.polymarket.at(-1)?.v).toBeCloseTo(114_987.150194 - 21_063.72247, 6);
  });

  it("drops the points before the start", () => {
    expect(comparison?.polymarket).toHaveLength(2);
  });

  it("is null when a history is empty or ends before the other begins", () => {
    expect(compare([], kalshi)).toBeNull();
    expect(compare(polymarket, [])).toBeNull();
    const early = [{ t: at("2025-01-01T00:00:00Z"), v: 5 }];
    const late = [{ t: at("2026-01-01T00:00:00Z"), v: 9 }];
    expect(compare(early, late)).toBeNull();
  });
});

describe("changeSince", () => {
  it("is empty when nothing is at or after the start", () => {
    expect(changeSince([{ t: 1, v: 3 }], 2)).toEqual([]);
  });
});

describe("comparisonAxis (BATTLE-03)", () => {
  it("handles a long history, which spreading into Math.min would refuse (BUG-084)", () => {
    const long = Array.from({ length: 300_000 }, (_, index) => ({ t: index, v: index % 1_000 }));
    const axis = comparisonAxis({ start: 0, end: 299_999, polymarket: long, kalshi: [{ t: 0, v: -500 }] });
    expect(axis.min).toBeLessThan(-500);
    expect(axis.max).toBeGreaterThan(999);
  });

  // The pair's real histories, recorded for the end-to-end tests, cut at the
  // moment the source's battle page was captured (2026-11-13 19:58:40 UTC).
  const CAPTURED_AT = 1_794_542_320_000;
  const fixture = (name: string): unknown =>
    JSON.parse(readFileSync(new URL(`../../../e2e/fixtures/${name}`, import.meta.url), "utf8"));
  const kalshiLine = parseKalshiHistory(fixture("kalshi-history-PredMTrader.json")).filter(
    (point) => point.t <= CAPTURED_AT,
  );
  const polymarketLine = parsePolymarketPnl(
    fixture("polymarket-pnl-0x75e765216a57942d738d880ffcda854d9f869080.json"),
  ).filter((point) => point.t <= CAPTURED_AT);
  const captured = compare(polymarketLine, kalshiLine);

  it("rebuilds the source's Kalshi line exactly", () => {
    // The source reported 1,983 points ending at +$627,817.13.
    expect(captured?.kalshi).toHaveLength(1983);
    expect(captured?.kalshi.at(-1)?.v).toBeCloseTo(627_817.13, 2);
  });

  it("gives the value labels the source showed: $-96.0K, +$154.0K, +$404.0K, +$723.6K", () => {
    if (!captured) throw new Error("no comparison");
    const axis = comparisonAxis(captured);
    const labels = roomyTicks(axis.ticks, BATTLE_PLOT_HEIGHT / (axis.max - axis.min)).map(formatBattleMoney);
    expect(labels).toEqual(["$-96.0K", "+$154.0K", "+$404.0K", "+$723.6K"]);
  });
});
