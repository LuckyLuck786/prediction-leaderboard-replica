// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyButton } from "./copy-button";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubClipboard(writeText: (text: string) => Promise<void>) {
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
}

describe("CopyButton (API-02, API-03)", () => {
  it("copies its text and says so", async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<CopyButton text="/api/boards/30d" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })));
    expect(writeText).toHaveBeenCalledWith("/api/boards/30d");
    expect(screen.getByRole("button").textContent).toBe("Copied");
  });

  it("says when the browser refuses, and logs why", async () => {
    stubClipboard(async () => {
      throw new Error("not allowed");
    });
    render(<CopyButton text="x" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })));
    expect(screen.getByRole("button").textContent).toBe("Copy failed");
    expect(console.error).toHaveBeenCalled();
  });
});
