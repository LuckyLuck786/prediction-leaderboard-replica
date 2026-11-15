// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BoardPayload } from "../data";
import { PAGE_SIZE, type LeaderboardPeriod, type Trader } from "../model";
import { makeBoard, makeTrader } from "../test-helpers";
import { LeaderboardView } from "./leaderboard-view";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
// A plain anchor that stays on the page: jsdom cannot navigate.
vi.mock("next/link", () => ({
  default: ({ onClick, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    />
  ),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

const TOTAL = 70;

/** 70 traders, p01 richest. Every third is on Kalshi; p70 has lost money. */
const traders: Trader[] = Array.from({ length: TOTAL }, (_, index) => {
  const number = index + 1;
  const id = `p${String(number).padStart(2, "0")}`;
  return makeTrader({
    id,
    pnl: number === TOTAL ? -21622 : (TOTAL - index) * 1000,
    platform: number % 3 === 0 ? "kalshi" : "polymarket",
    score: number,
  });
});

const LIVE = { kind: "live" } as const;
const payload = (period: LeaderboardPeriod, list: Trader[] = traders): BoardPayload => ({
  board: makeBoard(period, list),
  source: LIVE,
});

/**
 * Renders the view with the 1D board and a fake loader for the other periods.
 * `perPeriod` replaces the trader list of a period.
 */
function renderView(
  props: Partial<ComponentProps<typeof LeaderboardView>> = {},
  perPeriod: Partial<Record<LeaderboardPeriod, Trader[]>> = {},
) {
  const fetchBoard = vi.fn(async (period: LeaderboardPeriod) => payload(period, perPeriod[period]));
  const view = render(
    <LeaderboardView
      heading="Test board"
      description="A board for tests."
      initial={payload("1d", perPeriod["1d"])}
      dailyProfit={403821}
      fetchBoard={fetchBoard}
      {...props}
    />,
  );
  return { ...view, fetchBoard };
}

const bodyRows = () => screen.getAllByRole("row").slice(1);
const cellsOf = (row: HTMLElement) => within(row).getAllByRole("cell");
const firstNames = (count: number) =>
  bodyRows()
    .slice(0, count)
    .map((row) => within(row).getAllByRole("link")[0].textContent);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("LeaderboardView", () => {
  it("shows the first page, the count and the heading", () => {
    renderView();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Test board");
    expect(bodyRows()).toHaveLength(PAGE_SIZE);
    expect(screen.getByText(`${TOTAL} of ${TOTAL} traders`)).toBeTruthy();
    expect(screen.getByText("+$403,821")).toBeTruthy();
  });

  it("numbers rows from 1 and orders by P&L, highest first (HOME-14, HOME-18)", () => {
    renderView();
    expect(firstNames(3)).toEqual(["p01", "p02", "p03"]);
    expect(cellsOf(bodyRows()[0])[0].textContent).toBe("1");
    expect(cellsOf(bodyRows()[29])[0].textContent).toBe("30");
  });

  it("adds a page per click and removes the button at the end (HOME-19)", () => {
    renderView();
    click(`Show more (${PAGE_SIZE} of ${TOTAL})`);
    expect(bodyRows()).toHaveLength(PAGE_SIZE * 2);
    click(`Show more (${PAGE_SIZE * 2} of ${TOTAL})`);
    expect(bodyRows()).toHaveLength(TOTAL);
    expect(screen.queryByRole("button", { name: /Show more/ })).toBeNull();
  });

  it("sorts ascending with a down arrow, then descending with an up arrow (HOME-18)", () => {
    renderView();
    click("P&L");
    expect(screen.getByRole("button", { name: "P&L ↓" })).toBeTruthy();
    expect(firstNames(1)).toEqual(["p70"]);
    click("P&L ↓");
    expect(screen.getByRole("button", { name: "P&L ↑" })).toBeTruthy();
    expect(firstNames(1)).toEqual(["p01"]);
  });

  it("formats a loss the way the source does (FMT-01)", () => {
    renderView();
    click("P&L");
    expect(cellsOf(bodyRows()[0]).at(-1)?.textContent).toContain("$-21,622.00");
  });

  it("filters by platform and returns to the first page (HOME-06)", () => {
    renderView();
    click(`Show more (${PAGE_SIZE} of ${TOTAL})`);
    click("Kalshi");
    const kalshiCount = traders.filter((trader) => trader.platform === "kalshi").length;
    expect(screen.getByText(`${kalshiCount} of ${TOTAL} traders`)).toBeTruthy();
    expect(bodyRows()).toHaveLength(kalshiCount);
    expect(firstNames(2)).toEqual(["p03", "p06"]);
  });

  it("can start with a platform preselected (POLY-01)", () => {
    renderView({ initialPlatform: "polymarket" });
    expect(screen.getByRole("button", { name: "Polymarket" }).getAttribute("aria-pressed")).toBe("true");
    expect(firstNames(3)).toEqual(["p01", "p02", "p04"]);
  });

  it("searches as you type and says so when nothing matches (HOME-20)", () => {
    renderView();
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "P07" } });
    expect(firstNames(1)).toEqual(["p07"]);
    expect(screen.getByText(`1 of ${TOTAL} traders`)).toBeTruthy();

    fireEvent.change(search, { target: { value: "nobody-here" } });
    expect(bodyRows()).toHaveLength(0);
    expect(screen.getByText("No traders match these filters.")).toBeTruthy();
  });

  it("offers the $5+ filter in 1D only (HOME-05)", () => {
    renderView();
    expect(screen.getByRole("button", { name: "$5+" })).toBeTruthy();
    click("ALL");
    expect(screen.queryByRole("button", { name: "$5+" })).toBeNull();
  });

  it("loads every other period after the first paint, once each", async () => {
    const { fetchBoard } = renderView();
    await screen.findByText(`${TOTAL} of ${TOTAL} traders`);
    expect(fetchBoard.mock.calls.map(([period]) => period).sort()).toEqual(["30d", "all", "ytd"]);
  });

  it("shows the board that belongs to the selected period (HOME-04)", async () => {
    const allTime = [makeTrader({ id: "veteran", pnl: 7270821 })];
    renderView({}, { all: allTime });
    click("ALL");
    expect(await screen.findByText("1 of 1 traders")).toBeTruthy();
    expect(firstNames(1)).toEqual(["veteran"]);
  });

  it("draws placeholder rows while a period loads (STATE-03)", () => {
    const never = new Promise<BoardPayload>(() => {});
    renderView({ fetchBoard: () => never });
    click("ALL");
    expect(screen.getByText("Loading traders")).toBeTruthy();
    // Placeholders are hidden from assistive technology, so query the DOM.
    expect(document.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(PAGE_SIZE);
    expect(bodyRows()).toHaveLength(0);
  });

  it("says when a period fails to load, and retries on request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let attempt = 0;
    const fetchBoard = vi.fn(async (period: LeaderboardPeriod) => {
      if (period === "all" && attempt++ === 0) throw new Error("offline");
      return payload(period);
    });
    renderView({ fetchBoard });
    click("ALL");
    expect((await screen.findByRole("alert")).textContent).toContain("Could not load this period.");
    expect(screen.getByText("No traders loaded")).toBeTruthy();

    await act(async () => click("Try again"));
    expect(await screen.findByText(`${TOTAL} of ${TOTAL} traders`)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    vi.mocked(console.error).mockRestore();
  });

  it("shows a dash when the daily total is unavailable (HOME-02)", () => {
    renderView({ dailyProfit: null });
    expect(screen.getByText("Today:").textContent).toContain("–");
  });

  it("adds an optional column named for the period (HOME-10)", () => {
    renderView();
    expect(screen.queryByRole("columnheader", { name: /Sharpe/ })).toBeNull();
    click("Sharpe");
    expect(screen.getByRole("columnheader", { name: "Sharpe 3D" })).toBeTruthy();
    click("1M");
    expect(screen.getByRole("columnheader", { name: "Sharpe 1M" })).toBeTruthy();
  });

  it("opens the profile when a row is clicked, once (HOME-13)", () => {
    renderView();
    const [firstRow] = bodyRows();
    fireEvent.click(cellsOf(firstRow)[0]);
    expect(push).toHaveBeenCalledExactlyOnceWith("/account/p01");

    push.mockClear();
    const nameLink = within(firstRow).getAllByRole("link")[0];
    expect(nameLink.getAttribute("href")).toBe("/account/p01");
    fireEvent.click(nameLink);
    expect(push).not.toHaveBeenCalled();
  });

  it("labels a saved snapshot, and only a saved snapshot (DEV-15)", async () => {
    const { unmount } = renderView();
    expect(screen.queryByRole("status")).toBeNull();
    unmount();

    const snapshotOf = (period: LeaderboardPeriod, upstreamTotal: number): BoardPayload => ({
      board: makeBoard(period, traders),
      source: { kind: "snapshot", capturedAt: "2026-11-14T12:19:35.677Z", upstreamTotal },
    });
    renderView({
      initial: snapshotOf("1d", 581),
      fetchBoard: async (period) => (period === "all" ? snapshotOf("all", 788) : payload(period)),
    });
    expect(screen.getByRole("status").textContent).toBe(
      `Live data is unavailable right now. Showing a saved snapshot from 14 Nov, 12:19 UTC: ${TOTAL} of the 581 traders listed for this period, the best and the worst by P&L.`,
    );
    // A live daily total next to snapshot rows would mix two moments.
    expect(screen.getByText("Today:").textContent).toContain("–");

    // The banner follows the board on screen: live periods have none.
    click("1M");
    await screen.findByText(`${TOTAL} of ${TOTAL} traders`);
    expect(screen.queryByRole("status")).toBeNull();
    click("ALL");
    expect((await screen.findByRole("status")).textContent).toContain(`${TOTAL} of the 788 traders`);
  });

  it("keeps optional columns off narrow screens, where their toggles are hidden (HOME-10)", () => {
    renderView();
    click("Win%");
    // jsdom has no layout, so assert the responsive rule itself.
    const heading = screen.getByRole("columnheader", { name: "Win%" });
    expect(heading.className).toContain("hidden");
    expect(heading.className).toContain("sm:table-cell");
    const winRateCell = cellsOf(bodyRows()[0]).at(-2);
    expect(winRateCell?.textContent).toBe("50%");
    expect(winRateCell?.className).toContain("hidden");
  });

  it("names a platform for screen readers even when there is no page to link to (BUG-080)", () => {
    const unlinked = [makeTrader({ id: "no-page", pnl: 9, platform: "polymarket", polymarketUrl: null })];
    renderView({}, { "1d": unlinked });
    const [row] = bodyRows();
    expect(within(row).queryByRole("link", { name: /on Polymarket/ })).toBeNull();
    expect(within(row).getByText("Polymarket").className).toContain("sr-only");
  });

  it("does not link a trader whose id our routes refuse (BUG-083)", () => {
    renderView({}, { "1d": [makeTrader({ id: "has space", pnl: 9, profileId: null })] });
    const [row] = bodyRows();
    expect(within(row).queryByRole("link", { name: "has space" })).toBeNull();
    expect(within(row).getByText("has space")).toBeTruthy();
    fireEvent.click(row);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the day's biggest mover in 1D only (HOME-17)", async () => {
    const moved = [
      makeTrader({ id: "labelled", pnl: 3, dayMover: { label: "Politics", change: -11962, iconUrl: null } }),
      makeTrader({
        id: "pictured",
        pnl: 2,
        dayMover: { label: "Will it rain?", change: 8813.3, iconUrl: "https://example.com/i.png" },
      }),
    ];
    renderView({}, { "1d": moved, all: moved });
    click("$5+");

    const [labelled, pictured] = bodyRows().map((row) => cellsOf(row).at(-1));
    expect(labelled?.textContent).toContain("Politics");
    expect(labelled?.textContent).toContain("-$12K");
    // With a picture, the label is still there for screen readers.
    expect(pictured?.querySelector("img")?.getAttribute("src")).toBe("https://example.com/i.png");
    expect(pictured?.querySelector(".sr-only")?.textContent).toBe("Will it rain?");
    expect(pictured?.textContent).toContain("+$9K");

    click("ALL");
    await screen.findByText("2 of 2 traders");
    expect(cellsOf(bodyRows()[0]).at(-1)?.textContent).not.toContain("Politics");
  });
});
