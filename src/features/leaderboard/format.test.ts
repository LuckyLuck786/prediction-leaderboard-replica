import { describe, expect, it } from "vitest";

import {
  MISSING,
  formatDaysSince,
  formatMoney,
  formatMoneyCompact,
  formatMoneyWhole,
  formatMoverAmount,
  formatRoi,
  formatScore,
  formatSharpe,
  formatStamp,
  formatTraderName,
  formatWinRate,
  initialsOf,
} from "./format";

// Expected strings marked "seen" were read off the source site on 2026-11-14,
// next to the raw API value they were rendered from.

describe("formatMoney (FMT-01)", () => {
  it.each([
    [57643.3787, "+$57,643.38"], // seen
    [7270821, "+$7,270,821.00"], // seen
    [80.99, "+$80.99"], // seen
    [-21622, "$-21,622.00"], // seen: dollar sign before the minus
    [-38.71, "$-38.71"], // seen
    [0, "+$0.00"],
    [-0.004, "+$0.00"],
    [0.005, "+$0.01"],
  ])("%d -> %s", (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });
});

describe("formatMoneyWhole (FMT-05)", () => {
  it.each([
    [7943912, "+$7,943,912"], // seen
    [403821, "+$403,821"], // seen
    [-1234.6, "$-1,235"],
    [0.4, "+$0"],
  ])("%d -> %s", (value, expected) => {
    expect(formatMoneyWhole(value)).toBe(expected);
  });
});

describe("formatMoneyCompact (FMT-02)", () => {
  it.each([
    [7270821, "+$7.3M"], // seen
    [719177.11, "+$719k"], // seen
    [353458.24, "+$353k"], // seen
    [351588.3, "+$352k"], // seen
    [349762.45, "+$350k"], // seen
    [57643.38, "+$57,643.38"], // seen: stays full
    [-21622, "$-21,622.00"], // seen: stays full
    [999600, "+$1.0M"],
    [-2500000, "$-2.5M"],
  ])("%d -> %s", (value, expected) => {
    expect(formatMoneyCompact(value)).toBe(expected);
  });
});

describe("formatMoverAmount (FMT-03)", () => {
  it.each([
    [51920.984, "+$52K"], // seen
    [26831.24, "+$27K"], // seen
    [10653.69, "+$11K"], // seen
    [8813.3, "+$9K"], // seen
    [699.2, "+$699"], // seen
    [509.69, "+$510"], // seen
    [-12000, "-$12K"], // seen as text; raw value not captured
    [999.6, "+$1K"],
    [1250000, "+$1.3M"],
    [0, "+$0"],
    [-0.3, "+$0"], // a loss that rounds to nothing is not "-$0"
    [-0.5, "-$1"],
  ])("%d -> %s", (value, expected) => {
    expect(formatMoverAmount(value)).toBe(expected);
  });
});

describe("formatDaysSince (FMT-06)", () => {
  const asOf = "2026-11-13T19:38:16.611Z";

  it.each([
    ["2024-10-19T00:00:00.000Z", "755d"], // seen
    ["2024-06-07T03:09:59.204Z", "889d"], // seen
    ["2026-08-30T00:00:00.000Z", "75d"], // seen
  ])("%s -> %s", (joinedAt, expected) => {
    expect(formatDaysSince(joinedAt, asOf)).toBe(expected);
  });

  it("shows the missing mark when there is no join date", () => {
    expect(formatDaysSince(null, asOf)).toBe(MISSING);
  });

  it("shows the missing mark for a join date after the data timestamp", () => {
    expect(formatDaysSince("2027-01-01T00:00:00.000Z", asOf)).toBe(MISSING);
  });
});

describe("formatTraderName (FMT-07)", () => {
  it("shortens a bare wallet address", () => {
    expect(formatTraderName("0xcf19c420814435ffb1c459588208ed23a7ee6402")).toBe(
      "0xcf19…6402", // seen
    );
  });

  it("leaves display names alone", () => {
    expect(formatTraderName("genetic.silkworm8197")).toBe("genetic.silkworm8197");
    expect(formatTraderName("0xNotAWallet")).toBe("0xNotAWallet");
  });
});

describe("formatStamp (FMT-08)", () => {
  it.each([
    ["2026-11-13T19:37:16.000Z", "Asia/Kolkata", "14 Nov, 1:07"], // seen
    ["2026-11-13T17:56:04.425Z", "Asia/Kolkata", "13 Nov, 23:26"], // seen
    ["2026-09-05T00:05:00.000Z", "UTC", "5 Sep, 0:05"],
  ])("%s in %s -> %s", (iso, timeZone, expected) => {
    expect(formatStamp(iso, timeZone)).toBe(expected);
  });
});

describe("score, win rate, Sharpe and ROI (FMT-09)", () => {
  it("formats scores with at most one decimal", () => {
    expect(formatScore(50.3)).toBe("50.3"); // seen
    expect(formatScore(81)).toBe("81"); // seen
    expect(formatScore(null)).toBe(MISSING);
  });

  it("formats win rate as a whole percent", () => {
    expect(formatWinRate(0.471)).toBe("47%"); // seen
    expect(formatWinRate(null)).toBe(MISSING);
  });

  it("formats Sharpe with two decimals", () => {
    expect(formatSharpe(0.11)).toBe("0.11"); // seen
    expect(formatSharpe(-0.18)).toBe("-0.18"); // seen
    expect(formatSharpe(null)).toBe(MISSING);
  });

  it("formats ROI as a percent with one decimal", () => {
    expect(formatRoi(0.013207699834670461)).toBe("1.3%");
    expect(formatRoi(null)).toBe(MISSING);
  });
});

describe("initialsOf", () => {
  it.each([
    ["sorcerer.money", "SM"],
    ["Kenobi", "KE"],
    ["0xcf19c420814435ffb1c459588208ed23a7ee6402", "CF"],
    ["...", "?"],
    ["𝔐ax Power", "𝔐P"], // a letter outside the basic plane is not cut in half
    ["𝔐ax", "𝔐A"],
    ["Z", "Z"],
  ])("%s -> %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
