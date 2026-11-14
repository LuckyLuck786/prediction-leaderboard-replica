// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePeriodData } from "./use-period-data";

const PERIODS = ["a", "b", "c"] as const;
type Period = (typeof PERIODS)[number];

/** A promise the test settles by hand, to control the order of answers. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
});

function setup(prefetch: boolean) {
  const pending = new Map<Period, ReturnType<typeof deferred<string>>>();
  const fetchPeriod = vi.fn((period: Period) => {
    const next = deferred<string>();
    pending.set(period, next);
    return next.promise;
  });
  const hook = renderHook(() =>
    usePeriodData({ periods: PERIODS, initialPeriod: "a", initialValue: "A0", fetchPeriod, prefetch }),
  );
  return { hook, fetchPeriod, pending };
}

describe("usePeriodData", () => {
  it("has the initial period ready and never fetches it", () => {
    const { hook, fetchPeriod } = setup(true);
    expect(hook.result.current.get("a")).toEqual({ status: "ready", value: "A0" });
    expect(fetchPeriod).not.toHaveBeenCalledWith("a");
  });

  it("with prefetch, asks for every other period once after mounting", () => {
    const { fetchPeriod } = setup(true);
    expect(fetchPeriod.mock.calls.map(([period]) => period)).toEqual(["b", "c"]);
  });

  it("without prefetch, asks only when requested, and only once", () => {
    const { hook, fetchPeriod } = setup(false);
    expect(fetchPeriod).not.toHaveBeenCalled();
    act(() => {
      hook.result.current.request("b");
      hook.result.current.request("b");
    });
    expect(fetchPeriod).toHaveBeenCalledExactlyOnceWith("b");
    expect(hook.result.current.get("b")).toEqual({ status: "loading" });
  });

  it("files answers under the right period whatever order they arrive in", async () => {
    const { hook, pending } = setup(true);
    await act(async () => {
      pending.get("c")?.resolve("C1");
      pending.get("b")?.resolve("B1");
    });
    expect(hook.result.current.get("b")).toEqual({ status: "ready", value: "B1" });
    expect(hook.result.current.get("c")).toEqual({ status: "ready", value: "C1" });
  });

  it("marks a failed period, retries it on request, and recovers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { hook, pending, fetchPeriod } = setup(true);
    await act(async () => pending.get("b")?.reject(new Error("offline")));
    expect(hook.result.current.get("b")).toEqual({ status: "failed" });

    act(() => hook.result.current.retry("b"));
    expect(hook.result.current.get("b")).toEqual({ status: "loading" });
    expect(fetchPeriod.mock.calls.filter(([period]) => period === "b")).toHaveLength(2);

    await act(async () => pending.get("b")?.resolve("B2"));
    await waitFor(() => expect(hook.result.current.get("b")).toEqual({ status: "ready", value: "B2" }));
  });

  it("does not fetch again while a request is still in flight", () => {
    const { hook, fetchPeriod } = setup(true);
    act(() => hook.result.current.request("b"));
    expect(fetchPeriod.mock.calls.filter(([period]) => period === "b")).toHaveLength(1);
  });

  it("ignores an answer that arrives after unmounting", async () => {
    const error = vi.spyOn(console, "error");
    const { hook, pending } = setup(true);
    hook.unmount();
    await act(async () => pending.get("b")?.resolve("late"));
    expect(error).not.toHaveBeenCalled();
  });
});
