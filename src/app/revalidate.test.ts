// Next.js reads route config only as literals, so each route repeats it.
// This keeps every copy equal to the one definition, and makes sure no route
// that reads upstream is left out.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { UPSTREAM_REVALIDATE_SECONDS } from "@/upstream/client";

vi.mock("next/navigation", () => ({ notFound: vi.fn(), useRouter: vi.fn() }));

const ROUTES = {
  "page.tsx": () => import("./page"),
  "polymarket/page.tsx": () => import("./polymarket/page"),
  "kalshi/page.tsx": () => import("./kalshi/page"),
  "account/[id]/page.tsx": () => import("./account/[id]/page"),
  "api/boards/[period]/route.ts": () => import("./api/boards/[period]/route"),
  "api/kalshi/[period]/route.ts": () => import("./api/kalshi/[period]/route"),
};

const APP_DIR = join(process.cwd(), "src/app");

function routeFilesWithRevalidate(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFilesWithRevalidate(path);
    const isRoute = /^(page\.tsx|route\.ts)$/.test(entry.name);
    return isRoute && readFileSync(path, "utf8").includes("export const revalidate")
      ? [relative(APP_DIR, path)]
      : [];
  });
}

describe("route config (D-047)", () => {
  it.each(Object.entries(ROUTES))("%s revalidates with upstream and stays static", async (_file, load) => {
    const routeModule = (await load()) as { revalidate?: number; dynamic?: string };
    expect(routeModule.revalidate).toBe(UPSTREAM_REVALIDATE_SECONDS);
    // Upstream fetches use cache: "no-store"; without this the route would
    // turn dynamic and ask upstream on every visit (BUG-050).
    expect(routeModule.dynamic).toBe("force-static");
  });

  it("lists every route that revalidates", () => {
    expect(routeFilesWithRevalidate(APP_DIR).sort()).toEqual(Object.keys(ROUTES).sort());
  });
});
