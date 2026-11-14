// Records the API answers the end-to-end tests replay, so the tests run
// offline and give the same result every time. Boards come from the saved
// snapshot; this script records two trader profiles: one Kalshi trader with
// history and categories, and one Polymarket trader with Polymarket's P&L
// series. Fields the app does not read are dropped to keep the files small.
//
// Run with: npm run fixtures:e2e

import { mkdir, readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const OUT_DIR = new URL("e2e/fixtures/", ROOT);
const SOURCE = JSON.parse(await readFile(new URL("src/upstream/source.json", ROOT), "utf8"));
const POLYMARKET_DATA_ORIGIN = "https://data-api.polymarket.com";

export const KALSHI_TRADER = "ProbabilityDuck";
export const POLYMARKET_WALLET = "0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd";

const REQUEST_GAP_MS = 2000;
const REQUEST_TIMEOUT_MS = 30_000;
const USER_AGENT = "e2e-fixture-script/1.0 (node)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const body = await response.json();
  await sleep(REQUEST_GAP_MS);
  return body;
}

async function save(name, body) {
  await writeFile(new URL(name, OUT_DIR), `${JSON.stringify(body)}\n`);
  console.log(`Wrote e2e/fixtures/${name}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  await save(`trader-${KALSHI_TRADER}.json`, await getJson(`${SOURCE.origin}/api/trader/${KALSHI_TRADER}`));

  const history = await getJson(`${SOURCE.origin}/api/kalshi/${KALSHI_TRADER}/history`);
  await save(`kalshi-history-${KALSHI_TRADER}.json`, {
    history: history.history.map(({ timestamp, pnl }) => ({ timestamp, pnl })),
  });

  await save(
    `kalshi-categories-${KALSHI_TRADER}.json`,
    await getJson(`${SOURCE.origin}/api/kalshi/${KALSHI_TRADER}/categories`),
  );

  await save(`trader-${POLYMARKET_WALLET}.json`, await getJson(`${SOURCE.origin}/api/trader/${POLYMARKET_WALLET}`));

  const pnl = await getJson(
    `${POLYMARKET_DATA_ORIGIN}/v2/user-pnl?user=${POLYMARKET_WALLET}&interval=all&fidelity=1d`,
  );
  await save(`polymarket-pnl-${POLYMARKET_WALLET}.json`, {
    data: {
      proxy_wallet: pnl.data.proxy_wallet,
      points: pnl.data.points.map(({ timestamp, trade_pnl }) => ({ timestamp, trade_pnl })),
    },
  });
}

await main();
