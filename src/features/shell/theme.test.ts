// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DARK_CLASS, THEME_INIT_SCRIPT, THEME_STORAGE_KEY, toggleTheme } from "./theme";

const root = document.documentElement;
const runInitScript = () => new Function(THEME_INIT_SCRIPT)();

beforeEach(() => {
  localStorage.clear();
  root.className = DARK_CLASS;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toggleTheme (TOK-04)", () => {
  it("switches between dark and light and remembers the choice", () => {
    expect(toggleTheme()).toBe("light");
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    expect(toggleTheme()).toBe("dark");
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("still switches, and reports it, when storage is blocked", () => {
    const blocked = new Error("storage is blocked");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw blocked;
    });
    const report = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(toggleTheme()).toBe("light");
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("theme"), blocked);
  });
});

describe("theme script that runs before first paint", () => {
  it("keeps the dark default when nothing is saved", () => {
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
  });

  it("applies a saved light theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
  });

  it("keeps the default, and reports it, when storage is blocked", () => {
    const blocked = new Error("storage is blocked");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw blocked;
    });
    const report = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(runInitScript).not.toThrow();
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("theme"), blocked);
  });
});
