// @vitest-environment jsdom
// The profile page body (spec 4.4): header, history, categories and score.

import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CategoriesResult, HistoryResult } from "../history-data";
import type { SmartScore } from "../model";
import { makeProfile } from "../test-helpers";
import { ProfileView } from "./profile-view";

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

const TODAY = "2026-11-15";
const WALLET = "0x6d3c5bd13984b2de47c3a88ddc455309aab3d294";
const NO_HISTORY: HistoryResult = { kind: "unsupported" };
const UNAVAILABLE: HistoryResult = { kind: "unavailable" };
const NO_CATEGORIES: CategoriesResult = { kind: "none" };

const score: SmartScore = {
  score: 81.24,
  tier: "Great",
  winRate: 0.471,
  sharpe: 1.234,
  maxDrawdown: 0.086,
  profitFactor: 2.5,
  rSquared: 0.912,
};

const history = (points: number): Extract<HistoryResult, { kind: "ready" }> => ({
  kind: "ready",
  series: Array.from({ length: points }, (_, index) => ({
    t: Date.UTC(2026, 10, 1 + index),
    v: index * 100,
  })),
  changes: new Map([["2026-11-02", 100]]),
  walletsLeftOut: 0,
});

function renderView(props: Partial<ComponentProps<typeof ProfileView>> = {}) {
  return render(
    <ProfileView
      profile={makeProfile()}
      history={NO_HISTORY}
      categories={NO_CATEGORIES}
      today={TODAY}
      {...props}
    />,
  );
}

beforeEach(() => {
  // The chart measures itself; jsdom has no layout, so report a width.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        this.callback([{ contentRect: { width: 800 } } as ResizeObserverEntry], this as never);
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProfileView header", () => {
  it("shortens a wallet name and shows the wallet, join date and views (PROF-01)", () => {
    renderView({
      profile: makeProfile({ name: WALLET, wallet: WALLET, joined: "Nov 2024", views: 12_345 }),
    });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("0x6d3c…d294");
    expect(screen.getByText("Joined Nov 2024 · 12,345 views")).toBeTruthy();
    expect(screen.getByTitle(WALLET).textContent).toBe("0x6d3c…d294");
  });

  it("links each platform page and X, in new tabs without a referrer", () => {
    renderView({
      profile: makeProfile({
        name: "someone",
        platform: "both",
        polymarketUrl: "https://polymarket.com/profile/someone",
        kalshiUrl: "https://kalshi.com/profile/someone",
        xUrl: "https://x.com/someone",
      }),
    });
    const polymarket = screen.getByRole("link", { name: "View on Polymarket" });
    expect(polymarket.getAttribute("href")).toBe("https://polymarket.com/profile/someone");
    expect(polymarket.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("link", { name: "View on Kalshi" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "View on Hyperliquid" })).toBeNull();
    expect(screen.getByRole("link", { name: "someone on X" }).getAttribute("target")).toBe("_blank");
    expect(screen.getByText("Polymarket + Kalshi")).toBeTruthy();
  });
});

describe("ProfileView history", () => {
  it.each([
    ["unsupported", NO_HISTORY, "No documented history is available for this trader."],
    ["unavailable", UNAVAILABLE, "History is unavailable right now."],
    ["one point", history(1), "Not enough history to draw yet."],
  ])("says why there is no chart: %s", (_case, result, message) => {
    renderView({ history: result });
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Cumulative profit and loss/ })).toBeNull();
  });

  it("draws the chart from two points on", () => {
    renderView({ history: history(2) });
    expect(screen.getByRole("img", { name: /Cumulative profit and loss/ })).toBeTruthy();
  });

  it("says when wallets past the cap were left out (D-058)", () => {
    renderView({ history: { ...history(2), walletsLeftOut: 2 } });
    expect(screen.getByText("Adds up the first 10 of this trader's 12 wallets.")).toBeTruthy();
    cleanup();
    renderView({ history: history(2) });
    expect(screen.queryByText(/Adds up the first/)).toBeNull();
  });

  it("explains where Kalshi history starts, for Kalshi traders only", () => {
    renderView({ profile: makeProfile({ platform: "kalshi" }) });
    expect(screen.getByRole("button", { name: "About this history" })).toBeTruthy();
    cleanup();
    renderView({ profile: makeProfile({ platform: "polymarket" }) });
    expect(screen.queryByRole("button", { name: "About this history" })).toBeNull();
  });
});

describe("ProfileView categories", () => {
  it("shows the category card when there are rows (PROF-05)", () => {
    renderView({ categories: { kind: "ready", rows: [{ category: "Politics", pnl: 5_000, markets: 12 }] } });
    expect(screen.getByRole("heading", { name: "P&L by category" })).toBeTruthy();
  });

  it("says so when categories could not be loaded, and shows nothing when there are none", () => {
    renderView({ categories: { kind: "unavailable" } });
    expect(screen.getByText("Categories are unavailable right now.")).toBeTruthy();
    cleanup();
    renderView({ categories: NO_CATEGORIES });
    expect(screen.queryByRole("heading", { name: "P&L by category" })).toBeNull();
    expect(screen.queryByText("Categories are unavailable right now.")).toBeNull();
  });
});

describe("ProfileView Smart Score", () => {
  it("shows the score, its tier and each figure (PROF-06)", () => {
    renderView({ profile: makeProfile({ score }) });
    const card = within(screen.getByRole("region", { name: "Smart Score" }));
    expect(card.getByText("81.2")).toBeTruthy();
    expect(card.getByText("Great").className).toContain("text-score-strong");
    for (const [label, value] of [
      ["Win rate", "47%"],
      ["Sharpe", "1.23"],
      ["Max drawdown", "8.6%"],
      ["Profit factor", "2.50"],
      ["R²", "91%"],
    ] as const) {
      expect(card.getByText(label).nextElementSibling?.textContent, label).toBe(value);
    }
  });

  it("says when there is not enough history for a score (DATA-08)", () => {
    renderView({ profile: makeProfile({ score: null }) });
    expect(screen.getByText("Not enough daily history for a score yet.")).toBeTruthy();
  });
});
