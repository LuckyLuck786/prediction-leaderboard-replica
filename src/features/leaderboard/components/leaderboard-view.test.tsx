// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PAGE_SIZE, type Trader } from "../model";
import { makeBoards, makeTrader } from "../test-helpers";
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

function renderView(props: Partial<ComponentProps<typeof LeaderboardView>> = {}) {
  return render(
    <LeaderboardView
      heading="Test board"
      description="A board for tests."
      boards={makeBoards(traders)}
      dailyProfit={403821}
      snapshotCapturedAt={null}
      {...props}
    />,
  );
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
    expect(screen.getByRole("button", { name: "Polymarket" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
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

  it("shows the board that belongs to the selected period (HOME-04)", () => {
    const allTime = [makeTrader({ id: "veteran", pnl: 7270821 })];
    renderView({ boards: makeBoards(traders, { all: allTime }) });
    click("ALL");
    expect(firstNames(1)).toEqual(["veteran"]);
    expect(screen.getByText("1 of 1 traders")).toBeTruthy();
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

  it("labels a saved snapshot, and only a saved snapshot", () => {
    const { unmount } = renderView();
    expect(screen.queryByRole("status")).toBeNull();
    unmount();

    renderView({ snapshotCapturedAt: "2026-11-14T12:19:35.677Z" });
    expect(screen.getByRole("status").textContent).toBe(
      "Saved snapshot from 14 Nov, 12:19 UTC. This is not live data.",
    );
  });
});
