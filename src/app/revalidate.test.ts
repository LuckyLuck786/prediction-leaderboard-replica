// Next.js reads `revalidate` only as a literal, so each route repeats the
// number. This keeps every copy equal to the one definition.

import { describe, expect, it, vi } from "vitest";

import { UPSTREAM_REVALIDATE_SECONDS } from "@/upstream/client";

vi.mock("next/navigation", () => ({ notFound: vi.fn(), useRouter: vi.fn() }));

const ROUTES = {
  "/": () => import("./page"),
  "/polymarket": () => import("./polymarket/page"),
  "/kalshi": () => import("./kalshi/page"),
  "/account/[id]": () => import("./account/[id]/page"),
  "/api/boards/[period]": () => import("./api/boards/[period]/route"),
  "/api/kalshi/[period]": () => import("./api/kalshi/[period]/route"),
};

describe("revalidate", () => {
  it.each(Object.entries(ROUTES))("%s revalidates with upstream", async (_route, load) => {
    const routeModule = (await load()) as { revalidate?: number };
    expect(routeModule.revalidate).toBe(UPSTREAM_REVALIDATE_SECONDS);
  });
});
