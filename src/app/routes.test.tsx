// @vitest-environment jsdom
// Behaviour of the route modules themselves: the profile page's 404 and
// failure paths, the two API routes, and the switched-off submit form.

import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getKalshiBoard } from "@/features/kalshi/data";
import { getBoard } from "@/features/leaderboard/data";
import { makeBoard } from "@/features/leaderboard/test-helpers";
import { ProfileUnavailableError, getProfile } from "@/features/profile/data";

import ProfilePage from "./account/[id]/page";
import { GET as getBoardRoute } from "./api/boards/[period]/route";
import { GET as getKalshiRoute } from "./api/kalshi/[period]/route";
import SubmitPage from "./submit/page";

const NOT_FOUND = new Error("NEXT_NOT_FOUND");

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("@/features/profile/data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/profile/data")>()),
  getProfile: vi.fn(),
}));
vi.mock("@/features/leaderboard/data", () => ({ getBoard: vi.fn() }));
vi.mock("@/features/kalshi/data", () => ({ getKalshiBoard: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const params = <T,>(value: T) => ({ params: Promise.resolve(value) });

describe("/account/[id]", () => {
  it("is a 404 when the trader does not exist", async () => {
    vi.mocked(getProfile).mockResolvedValue({ kind: "not-found" });
    await expect(ProfilePage(params({ id: "nobody" }))).rejects.toBe(NOT_FOUND);
  });

  it("throws on any other failure, so the error boundary shows it and nothing is cached", async () => {
    vi.mocked(getProfile).mockResolvedValue({ kind: "unavailable" });
    await expect(ProfilePage(params({ id: "busy" }))).rejects.toBeInstanceOf(
      ProfileUnavailableError,
    );
  });
});

describe("API routes", () => {
  it("/api/boards/{period} returns the board payload as JSON", async () => {
    const payload = { board: makeBoard("30d", []), source: { kind: "live" as const } };
    vi.mocked(getBoard).mockResolvedValue(payload);
    const response = await getBoardRoute(new Request("http://test/api/boards/30d"), params({ period: "30d" }));
    expect(getBoard).toHaveBeenCalledWith("30d");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
  });

  it("/api/kalshi/{period} returns the board payload as JSON", async () => {
    const payload = {
      board: { period: "7d" as const, lastUpdated: "2026-11-14T00:00:00.000Z", traders: [], rejectedCount: 0 },
      source: { kind: "live" as const },
    };
    vi.mocked(getKalshiBoard).mockResolvedValue(payload);
    const response = await getKalshiRoute(new Request("http://test/api/kalshi/7d"), params({ period: "7d" }));
    expect(getKalshiBoard).toHaveBeenCalledWith("7d");
    expect(await response.json()).toEqual(payload);
  });
});

describe("/submit (SUB-02)", () => {
  it("cannot send anything", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<SubmitPage />);
    const form = container.querySelector("form");
    const onSubmit = vi.fn();
    form?.addEventListener("submit", onSubmit);

    screen.getByRole("button", { name: "Submit" }).click();

    expect(form?.getAttribute("action")).toBeNull();
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    // A disabled fieldset disables its fields without setting their own
    // `disabled` attribute, so ask the :disabled state instead.
    for (const field of [...screen.getAllByRole("textbox"), screen.getByRole("combobox")]) {
      expect(field.matches(":disabled")).toBe(true);
    }
    expect(onSubmit).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
