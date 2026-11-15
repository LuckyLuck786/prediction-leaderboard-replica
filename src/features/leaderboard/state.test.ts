import { describe, expect, it } from "vitest";

import { PAGE_SIZE } from "./model";
import { scoreBandClass } from "@/features/trader/score-band";
import { createInitialState, reduceLeaderboard } from "./state";

describe("leaderboard state", () => {
  const initial = createInitialState("all");

  it("starts on 1D with the source's default filters (HOME-04 to HOME-09)", () => {
    expect(initial.period).toBe("1d");
    expect(initial.query).toMatchObject({
      bigMoversOnly: true,
      platform: "all",
      linkedOnly: false,
      hideSports: true,
      hideEsports: true,
      search: "",
      sort: null,
    });
    expect(initial.visibleCount).toBe(PAGE_SIZE);
  });

  it("can start with a platform preselected (POLY-01)", () => {
    expect(createInitialState("polymarket").query.platform).toBe("polymarket");
  });

  it("adds one page per show-more (HOME-19)", () => {
    const more = reduceLeaderboard(initial, { type: "showMore" });
    expect(more.visibleCount).toBe(PAGE_SIZE * 2);
  });

  it("goes back to the first page when the matching rows change", () => {
    const paged = reduceLeaderboard(initial, { type: "showMore" });
    const actions = [
      { type: "setPeriod", period: "all" },
      { type: "patchQuery", patch: { search: "a" } },
      { type: "sortBy", key: "score" },
    ] as const;
    for (const action of actions) {
      expect(reduceLeaderboard(paged, action).visibleCount, action.type).toBe(PAGE_SIZE);
    }
  });

  it("keeps the page when only a column is toggled", () => {
    const paged = reduceLeaderboard(initial, { type: "showMore" });
    const toggled = reduceLeaderboard(paged, { type: "toggleColumn", column: "roi" });
    expect(toggled.visibleCount).toBe(PAGE_SIZE * 2);
    expect(toggled.extraColumns).toEqual(["roi"]);
  });

  it("drops the sort when its column is hidden", () => {
    let state = reduceLeaderboard(initial, { type: "toggleColumn", column: "sharpe" });
    state = reduceLeaderboard(state, { type: "sortBy", key: "sharpe" });
    expect(state.query.sort).toEqual({ key: "sharpe", direction: "asc" });
    state = reduceLeaderboard(state, { type: "toggleColumn", column: "sharpe" });
    expect(state.extraColumns).toEqual([]);
    expect(state.query.sort).toBeNull();
  });

  it("keeps an unrelated sort when a column is hidden", () => {
    let state = reduceLeaderboard(initial, { type: "toggleColumn", column: "sharpe" });
    state = reduceLeaderboard(state, { type: "sortBy", key: "pnl" });
    state = reduceLeaderboard(state, { type: "toggleColumn", column: "sharpe" });
    expect(state.query.sort).toEqual({ key: "pnl", direction: "asc" });
  });
});

describe("scoreBandClass (TOK-05)", () => {
  it.each([
    [10, "text-score-risky"],
    [34.9, "text-score-risky"],
    [35, "text-score-weak"],
    [49.9, "text-score-weak"],
    [50, "text-score-fair"],
    [64.9, "text-score-fair"],
    [65, "text-score-good"],
    [79.9, "text-score-good"],
    [80, "text-score-strong"],
    [100, "text-score-strong"],
  ])("%d -> %s", (score, expected) => {
    expect(scoreBandClass(score)).toBe(expected);
  });
});
