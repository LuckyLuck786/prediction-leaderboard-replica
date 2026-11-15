// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TraderProfile } from "@/features/profile/model";
import { DISCLAIMER } from "@/features/shell/brand";

import type { Battle } from "../data";
import { BATTLE_PAIR } from "../data";
import { BattleView } from "./battle-view";

beforeEach(() => {
  // The chart waits for its width; jsdom has no layout, so it stays a placeholder.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function profile(overrides: Partial<TraderProfile>): TraderProfile {
  return {
    id: "x",
    name: "x",
    platform: "polymarket",
    wallet: null,
    wallets: [],
    kalshiUsername: null,
    avatarUrl: null,
    xUrl: null,
    joined: null,
    views: null,
    pnl: { "1d": null, "7d": null, "30d": null, all: null },
    score: null,
    polymarketUrl: null,
    kalshiUrl: null,
    hyperliquidUrl: null,
    ...overrides,
  };
}

const START = Date.UTC(2025, 8, 27, 9, 23, 39);

const full: Battle = {
  sides: [
    {
      platform: "polymarket",
      id: BATTLE_PAIR.polymarket,
      profile: profile({
        name: "25usdc",
        polymarketUrl: `https://polymarket.com/profile/${BATTLE_PAIR.polymarket}`,
        xUrl: "https://x.com/25usdc",
      }),
    },
    {
      platform: "kalshi",
      id: BATTLE_PAIR.kalshi,
      profile: profile({
        name: "PredMTrader",
        platform: "kalshi",
        kalshiUrl: "https://kalshi.com/ideas/profiles/PredMTrader",
      }),
    },
  ],
  comparison: {
    start: START,
    end: START + 86_400_000,
    polymarket: [{ t: START, v: 0 }],
    kalshi: [{ t: START, v: 0 }],
  },
};

describe("BattleView (spec 4.5)", () => {
  it("shows both traders with their platform links, the legend and the start date", () => {
    render(<BattleView battle={full} />);
    const traders = within(screen.getByRole("region", { name: "The two traders" }));
    expect(traders.getByRole("link", { name: "@25usdc" }).getAttribute("href")).toBe(
      `https://polymarket.com/profile/${BATTLE_PAIR.polymarket}`,
    );
    expect(traders.getByRole("link", { name: "@PredMTrader" }).getAttribute("target")).toBe("_blank");
    expect(traders.getByRole("link", { name: "25usdc on X" })).toBeTruthy();
    expect(traders.queryByRole("link", { name: "PredMTrader on X" })).toBeNull();
    const legend = within(screen.getByRole("list", { name: "Legend" }));
    expect(legend.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "@25usdc",
      "@PredMTrader",
    ]);
    expect(screen.getByText(/since Sep 27, 2025, the first day both traders were tracked/)).toBeTruthy();
    expect(screen.getByText(DISCLAIMER)).toBeTruthy();
  });

  it("keeps the page when the trader records failed: ids, local links", () => {
    render(
      <BattleView
        battle={{
          ...full,
          sides: [
            { ...full.sides[0], profile: null },
            { ...full.sides[1], profile: null },
          ],
        }}
      />,
    );
    const traders = within(screen.getByRole("region", { name: "The two traders" }));
    const wallet = traders.getByRole("link", { name: "@0x75e7…9080" });
    expect(wallet.getAttribute("href")).toBe(`/account/${BATTLE_PAIR.polymarket}`);
    expect(wallet.getAttribute("target")).toBeNull();
    expect(traders.getByRole("link", { name: "@PredMTrader" }).getAttribute("href")).toBe(
      "/account/PredMTrader",
    );
  });

  it("says so when the comparison is unavailable", () => {
    render(<BattleView battle={{ ...full, comparison: null }} />);
    expect(screen.getByText("The comparison is unavailable right now.")).toBeTruthy();
    expect(screen.queryByText(/the first day both traders were tracked/)).toBeNull();
  });
});
