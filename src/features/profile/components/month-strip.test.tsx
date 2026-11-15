// @vitest-environment jsdom
// PROF-02 and PROF-03: the month strip's navigation, calendar and views.

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MonthStrip } from "./month-strip";

afterEach(cleanup);

const TODAY = "2026-11-14";
const strip = () => within(screen.getByRole("region", { name: "Results by month" }));
const previous = () => strip().getByRole("button", { name: "Previous month" });
const next = () => strip().getByRole("button", { name: "Next month" });

function renderStrip(changes: ReadonlyArray<readonly [string, number]>) {
  return render(<MonthStrip changes={changes} today={TODAY} accentBorder="" />);
}

describe("MonthStrip", () => {
  it("opens on the current month, with its total and wins and losses", () => {
    renderStrip([
      ["2026-11-02", 500],
      ["2026-11-03", -200],
    ]);
    expect(strip().getByText("Nov 2026")).toBeTruthy();
    expect(strip().getByText("+$300")).toBeTruthy();
    expect(strip().getByText("1W / 1L")).toBeTruthy();
    expect((next() as HTMLButtonElement).disabled).toBe(true);
  });

  it("steps back to the earliest month even when it is not first in the list (BUG-082)", () => {
    // Order as a two-platform trader's results came: the late series first.
    renderStrip([
      ["2026-10-30", 5],
      ["2026-11-02", 7],
      ["2026-09-15", 3],
    ]);
    fireEvent.click(previous());
    expect(strip().getByText("Oct 2026")).toBeTruthy();
    fireEvent.click(previous());
    expect(strip().getByText("Sep 2026")).toBeTruthy();
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
    expect((next() as HTMLButtonElement).disabled).toBe(false);
  });

  it("opens the calendar, switches to the year and back, and closes", () => {
    renderStrip([["2026-11-02", 500]]);
    const toggle = strip().getByRole("button", { name: "Show the calendar" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(strip().getByText("Best")).toBeTruthy();
    fireEvent.click(strip().getByRole("button", { name: "monthly" }));
    expect(strip().getByText("2026 YTD")).toBeTruthy();
    fireEvent.click(strip().getByRole("button", { name: "daily" }));
    fireEvent.click(strip().getByRole("button", { name: "Hide the calendar" }));
    expect(strip().queryByText("Best")).toBeNull();
  });

  it("does not move the month when a step button is pressed inside the clickable row", () => {
    renderStrip([
      ["2026-10-01", 1],
      ["2026-11-02", 2],
    ]);
    fireEvent.click(previous());
    // The row itself toggles the calendar; the step button must not.
    expect(strip().getByRole("button", { name: "Show the calendar" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("disables both steps when there is no history", () => {
    renderStrip([]);
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
    expect((next() as HTMLButtonElement).disabled).toBe(true);
  });
});
