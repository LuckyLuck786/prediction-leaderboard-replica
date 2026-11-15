// Records the API answers the end-to-end tests replay, so the tests run
// offline and give the same result every time. Boards come from the saved
// snapshot; this script records trader profiles and histories: one Kalshi
// trader with history and categories, one Polymarket trader with
// Polymarket's P&L series, and the head-to-head pair. Fields the app does not
// read are dropped to keep the files small.
//
// Only fixtures not yet on disk are recorded, so adding one does not change
// the others. Run with: npm run fixtures:e2e [-- --force to record all again]

import { access, mkdir, readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const OUT_DIR = new URL("e2e/fixtures/", ROOT);
const SOURCE = JSON.parse(await readFile(new URL("src/upstream/source.json", ROOT), "utf8"));
/** The head-to-head pair, from the file the app reads it from. */
const BATTLE_PAIR = JSON.parse(await readFile(new URL("src/features/battle/pair.json", ROOT), "utf8"));
const POLYMARKET_DATA_ORIGIN = "https://data-api.polymarket.com";

export const KALSHI_TRADER = "ProbabilityDuck";
export const POLYMARKET_WALLET = "0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd";

const REQUEST_GAP_MS = 2000;
const REQUEST_TIMEOUT_MS = 30_000;
const USER_AGENT = "e2e-fixture-script/1.0 (node)";
const FORCE = process.argv.includes("--force");

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

async function exists(name) {
  try {
    await access(new URL(name, OUT_DIR));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Records one fixture unless it is already on disk. */
async function record(name, load) {
  if (!FORCE && (await exists(name))) {
    console.log(`Kept e2e/fixtures/${name}`);
    return;
  }
  await writeFile(new URL(name, OUT_DIR), `${JSON.stringify(await load())}\n`);
  console.log(`Wrote e2e/fixtures/${name}`);
}

const trader = (id) => () => getJson(`${SOURCE.origin}/api/trader/${id}`);

const kalshiHistory = (username) => async () => {
  const body = await getJson(`${SOURCE.origin}/api/kalshi/${username}/history`);
  return { history: body.history.map(({ timestamp, pnl }) => ({ timestamp, pnl })) };
};

const polymarketPnl = (wallet) => async () => {
  const body = await getJson(
    `${POLYMARKET_DATA_ORIGIN}/v2/user-pnl?user=${wallet}&interval=all&fidelity=1d`,
  );
  return {
    data: {
      proxy_wallet: body.data.proxy_wallet,
      points: body.data.points.map(({ timestamp, trade_pnl }) => ({ timestamp, trade_pnl })),
    },
  };
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  await record(`trader-${KALSHI_TRADER}.json`, trader(KALSHI_TRADER));
  await record(`kalshi-history-${KALSHI_TRADER}.json`, kalshiHistory(KALSHI_TRADER));
  await record(`kalshi-categories-${KALSHI_TRADER}.json`, () =>
    getJson(`${SOURCE.origin}/api/kalshi/${KALSHI_TRADER}/categories`),
  );
  await record(`trader-${POLYMARKET_WALLET}.json`, trader(POLYMARKET_WALLET));
  await record(`polymarket-pnl-${POLYMARKET_WALLET}.json`, polymarketPnl(POLYMARKET_WALLET));

  await record(`trader-${BATTLE_PAIR.polymarket}.json`, trader(BATTLE_PAIR.polymarket));
  await record(`trader-${BATTLE_PAIR.kalshi}.json`, trader(BATTLE_PAIR.kalshi));
  await record(`kalshi-history-${BATTLE_PAIR.kalshi}.json`, kalshiHistory(BATTLE_PAIR.kalshi));
  await record(`polymarket-pnl-${BATTLE_PAIR.polymarket}.json`, polymarketPnl(BATTLE_PAIR.polymarket));
}

await main();
