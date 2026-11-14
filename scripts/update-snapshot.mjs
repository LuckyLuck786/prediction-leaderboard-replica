// Refreshes the saved leaderboard snapshot from the upstream public API.
//
// The snapshot is what the site renders when upstream is down or rate-limited.
// It stores upstream objects exactly as received (a trimmed list, every
// field), so the app parses live data and the snapshot through the same
// schema. This script checks only the outline of each response. The schema
// test is what proves the saved file is usable, and CI runs it.
// Run with: npm run snapshot, then npm run test

import { mkdir, readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SOURCE_FILE = new URL("src/upstream/source.json", ROOT);
const OUT_DIR = new URL("src/upstream/snapshot/", ROOT);
const OUT_FILE = new URL("leaderboard.json", OUT_DIR);

// Keep the best and the worst of each period: enough rows to page, filter
// and sort, including negative values, without committing the full list.
const TOP_COUNT = 50;
const BOTTOM_COUNT = 10;
// The Kalshi board is ranked by profit with no losses at the top 1,000 level,
// so its first page is what the fallback needs.
const KALSHI_KEEP = 100;
// Upstream allows 100 requests a minute. Nine spaced requests stay far below.
const REQUEST_GAP_MS = 2000;
// A stalled connection must fail the run, not hang it.
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "snapshot-script/1.0 (node)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function trim(traders) {
  const byRank = [...traders].sort((a, b) => a.rank - b.rank);
  if (byRank.length <= TOP_COUNT + BOTTOM_COUNT) return byRank;
  return [...byRank.slice(0, TOP_COUNT), ...byRank.slice(-BOTTOM_COUNT)];
}

async function main() {
  const source = JSON.parse(await readFile(SOURCE_FILE, "utf8"));
  const periods = {};

  for (const period of source.leaderboardPeriods) {
    const body = await getJson(`${source.origin}/api/leaderboard?period=${period}`);
    if (typeof body?.lastUpdated !== "string" || !Array.isArray(body?.traders)) {
      throw new Error(`Unexpected leaderboard shape for period ${period}`);
    }
    periods[period] = {
      lastUpdated: body.lastUpdated,
      upstreamTotal: body.traders.length,
      traders: trim(body.traders),
    };
    console.log(`${period}: kept ${periods[period].traders.length} of ${body.traders.length}`);
    await sleep(REQUEST_GAP_MS);
  }

  const kalshi = {};
  for (const period of source.kalshiPeriods) {
    const body = await getJson(
      `${source.origin}/api/kalshi-leaderboard?period=${period}&limit=${source.kalshiLimit}`,
    );
    if (typeof body?.lastUpdated !== "string" || !Array.isArray(body?.traders)) {
      throw new Error(`Unexpected Kalshi board shape for period ${period}`);
    }
    kalshi[period] = {
      lastUpdated: body.lastUpdated,
      upstreamTotal: body.traders.length,
      traders: [...body.traders].sort((a, b) => a.rank - b.rank).slice(0, KALSHI_KEEP),
    };
    console.log(`kalshi ${period}: kept ${kalshi[period].traders.length} of ${body.traders.length}`);
    await sleep(REQUEST_GAP_MS);
  }

  const dailyProfit = await getJson(`${source.origin}/api/daily-profit`);
  if (typeof dailyProfit?.raw !== "number") {
    throw new Error("Unexpected daily-profit shape");
  }

  const snapshot = {
    capturedAt: new Date().toISOString(),
    source: source.origin,
    dailyProfit,
    periods,
    kalshi,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${OUT_FILE.pathname}`);
}

await main();
