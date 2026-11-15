// A stand-in for the two outside APIs during end-to-end tests. Serves the
// committed snapshot for the boards and the recorded fixtures for profiles,
// on one local port. Anything it does not know is a 404, as upstream does.
//
// History timestamps are moved forward by whole days so the latest point
// falls on today: the calendar then has data for the current month whenever
// the tests run, and each day's change stays exactly as recorded.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const PORT = Number(process.env.FIXTURE_PORT ?? 4010);
const HOST = "127.0.0.1";
const MS_PER_DAY = 86_400_000;

/** A trader id the server always answers 429 for, to exercise error states. */
export const RATE_LIMITED_TRADER = "e2e-rate-limited";

const snapshot = JSON.parse(
  await readFile(new URL("src/upstream/snapshot/leaderboard.json", ROOT), "utf8"),
);
/** A fixture file name: one plain name, no folders, no "..". */
const FIXTURE_NAME = /^[A-Za-z0-9._-]+\.json$/;
/** Thrown for a request that cannot name a fixture; answered as 404. */
const NOT_A_FIXTURE = "ENOENT";

async function fixture(name) {
  if (!FIXTURE_NAME.test(name) || name.includes("..")) {
    throw Object.assign(new Error(`Not a fixture name: ${name}`), { code: NOT_A_FIXTURE });
  }
  return JSON.parse(await readFile(new URL(`e2e/fixtures/${name}`, ROOT), "utf8"));
}

/** Whole days between a timestamp's UTC day and today's. */
function daysToToday(lastMs) {
  const startOfDay = (ms) => Math.floor(ms / MS_PER_DAY);
  return startOfDay(Date.now()) - startOfDay(lastMs);
}

async function kalshiHistory(username) {
  const body = await fixture(`kalshi-history-${username}.json`);
  const shift = daysToToday(body.history.at(-1).timestamp) * MS_PER_DAY;
  return { history: body.history.map((point) => ({ ...point, timestamp: point.timestamp + shift })) };
}

async function polymarketPnl(wallet) {
  const body = await fixture(`polymarket-pnl-${wallet}.json`);
  const lastSeconds = body.data.points.at(-1).timestamp;
  const shiftSeconds = (daysToToday(lastSeconds * 1000) * MS_PER_DAY) / 1000;
  return {
    data: {
      ...body.data,
      interval: "all",
      fidelity: "1d",
      source_fidelity: "1d",
      points: body.data.points.map((point) => ({ ...point, timestamp: point.timestamp + shiftSeconds })),
    },
  };
}

async function route(url) {
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const period = url.searchParams.get("period");

  if (url.pathname === "/health") return [200, { ok: true }];
  if (url.pathname === "/api/daily-profit") return [200, snapshot.dailyProfit];
  if (url.pathname === "/api/leaderboard" && snapshot.periods[period]) {
    const { lastUpdated, traders } = snapshot.periods[period];
    return [200, { lastUpdated, traders }];
  }
  if (url.pathname === "/api/kalshi-leaderboard" && snapshot.kalshi[period]) {
    const { lastUpdated, upstreamTotal, traders } = snapshot.kalshi[period];
    return [200, { lastUpdated, period, total: upstreamTotal, tracked: upstreamTotal, traders }];
  }
  if (parts[0] === "api" && parts[1] === "trader" && parts.length === 3) {
    if (parts[2] === RATE_LIMITED_TRADER) return [429, { error: "rate limited" }];
    return [200, await fixture(`trader-${parts[2]}.json`)];
  }
  if (parts[0] === "api" && parts[1] === "kalshi" && parts[3] === "history") {
    return [200, await kalshiHistory(parts[2])];
  }
  if (parts[0] === "api" && parts[1] === "kalshi" && parts[3] === "categories") {
    return [200, await fixture(`kalshi-categories-${parts[2]}.json`)];
  }
  if (url.pathname === "/v2/user-pnl") {
    return [200, await polymarketPnl(url.searchParams.get("user"))];
  }
  return [404, { error: "not found" }];
}

createServer(async (request, response) => {
  let status;
  let body;
  try {
    [status, body] = await route(new URL(request.url, `http://localhost:${PORT}`));
  } catch (error) {
    // A missing fixture file means an unknown trader, as upstream would say.
    if (error?.code === "ENOENT") [status, body] = [404, { error: "not found" }];
    else {
      console.error("Fixture server failed:", error);
      [status, body] = [500, { error: "fixture server failed" }];
    }
  }
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
  // This machine only: the server reads files from the repository.
}).listen(PORT, HOST, () => console.log(`Fixture server on http://${HOST}:${PORT}`));
