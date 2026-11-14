// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HistoryHeading } from "./history-heading";

afterEach(cleanup);

const NOTE = "History starts when tracking began.";

describe("HistoryHeading (PROF-04)", () => {
  it("keeps the note hidden until the info button is pressed, then hides it again", () => {
    render(<HistoryHeading note={NOTE} />);
    const button = screen.getByRole("button", { name: "About this history" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText(NOTE).hidden).toBe(true);

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(NOTE).hidden).toBe(false);
    expect(button.getAttribute("aria-controls")).toBe(screen.getByText(NOTE).id);

    fireEvent.click(screen.getByRole("button", { name: "Hide the note about this history" }));
    expect(screen.getByText(NOTE).hidden).toBe(true);
  });

  it("shows no button when there is no note", () => {
    render(<HistoryHeading note={null} />);
    expect(screen.getByRole("heading", { name: "P&L history" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
