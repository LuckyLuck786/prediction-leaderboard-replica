// @vitest-environment jsdom
// Every error page keeps the disclaimer on screen (CLAUDE.md rule 6) and
// offers a retry that works.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DISCLAIMER } from "@/features/shell/brand";

import ProfileError from "./account/[id]/error";
import BattleError from "./battle/error";
import PageError from "./error";
import GlobalError from "./global-error";

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PAGES: Array<[string, ComponentType<{ error: unknown; retry: () => void }>]> = [
  ["any page", PageError],
  ["a profile", ProfileError],
  ["the head to head", BattleError],
  ["the root layout", GlobalError],
];

describe.each(PAGES)("error page for %s", (_name, ErrorPage) => {
  it("shows the disclaimer, says what happened, and retries", () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error("upstream down")} retry={retry} />);
    expect(screen.getByText(DISCLAIMER)).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalled();
  });
});
