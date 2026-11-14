// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KalshiPayload } from "../data";
import { KALSHI_SKELETON_ROWS, type KalshiPeriod, type KalshiTrader } from "../model";
import { KalshiView } from "./kalshi-view";

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

afterEach(cleanup);

const trader = (rank: number, username: string, extra: Partial<KalshiTrader> = {}): KalshiTrader => ({
  rank,
  username,
  name: username,
  avatarUrl: null,
  pnl: 1_000_000 - rank,
  profileId: null,
  kalshiUrl: `https://kalshi.com/ideas/profiles/${username}`,
  xHandle: null,
  sportsShare: 0,
  ...extra,
});

const payload = (period: KalshiPeriod, traders: KalshiTrader[]): KalshiPayload => ({
  board: { period, lastUpdated: "2026-11-14T15:56:06.009Z", traders, rejectedCount: 0 },
  source: { kind: "live" },
});

const ALL = [trader(1, "final.lamb3899"), trader(2, "dogname", { profileId: "dogname" })];

describe("KalshiView", () => {
  it("links to a local profile when there is one, otherwise to Kalshi (KAL-04)", () => {
    render(<KalshiView initial={payload("all", ALL)} fetchBoard={vi.fn()} />);
    expect(screen.getByRole("link", { name: "dogname" }).getAttribute("href")).toBe("/account/dogname");
    const external = screen.getByRole("link", { name: "final.lamb3899" });
    expect(external.getAttribute("href")).toBe("https://kalshi.com/ideas/profiles/final.lamb3899");
    expect(external.getAttribute("rel")).toContain("noopener");
  });

  it("fetches a period only when it is selected, showing placeholders meanwhile (KAL-07)", async () => {
    let answer!: (value: KalshiPayload) => void;
    const fetchBoard = vi.fn(() => new Promise<KalshiPayload>((resolve) => (answer = resolve)));
    render(<KalshiView initial={payload("all", ALL)} fetchBoard={fetchBoard} />);
    expect(fetchBoard).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "7D" }));
    expect(fetchBoard).toHaveBeenCalledExactlyOnceWith("7d");
    expect(screen.getByText("Loading traders")).toBeTruthy();
    expect(document.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(KALSHI_SKELETON_ROWS);

    answer(payload("7d", [trader(1, "creative.octopus7605")]));
    expect(await screen.findByText("1 traders")).toBeTruthy();
    expect(screen.getByRole("link", { name: "creative.octopus7605" })).toBeTruthy();
  });

  it("keeps true ranks while searching (KAL-05)", () => {
    render(<KalshiView initial={payload("all", ALL)} fetchBoard={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "dog" } });
    const firstCell = document.querySelector("tbody tr td");
    expect(firstCell?.textContent).toBe("2");
  });
});
