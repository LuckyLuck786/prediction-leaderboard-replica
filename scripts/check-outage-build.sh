#!/usr/bin/env bash
# Eval for BUG-050: does a production build pass while the upstream API is
# down and the fetch cache holds stale entries, as on a Vercel rebuild during
# an outage?
#
# 1. Build against the local fixture server, so any fetch cache fills.
# 2. Replace that server with one that accepts connections and never answers.
# 3. Make every cache file a day old, then build again. Exit code = result.
#
# Builds into .next-e2e (gitignored, rebuilt by the end-to-end tests anyway).
# Run with: npm run check:outage
set -u
PORT=4011
LOGS=$(mktemp -d)
cd "$(dirname "$0")/.."
export NEXT_DIST_DIR=.next-e2e NEXT_TELEMETRY_DISABLED=1
export UPSTREAM_ORIGIN=http://127.0.0.1:$PORT POLYMARKET_DATA_ORIGIN=http://127.0.0.1:$PORT
rm -rf .next-e2e

FIXTURE_PORT=$PORT node e2e/fixture-server.mjs > "$LOGS/fixtures.log" 2>&1 &
FIXTURES=$!
node e2e/wait-for.mjs "http://127.0.0.1:$PORT/health" || { kill $FIXTURES; exit 2; }
npx next build > "$LOGS/warm.log" 2>&1 || { echo "Warm build failed: $LOGS/warm.log"; kill $FIXTURES; exit 2; }
kill $FIXTURES; wait $FIXTURES 2>/dev/null

node -e "require('net').createServer(() => {}).listen($PORT)" &
SILENT=$!
sleep 1
if [ -d .next-e2e/cache/fetch-cache ]; then
  echo "Fetch cache entries: $(find .next-e2e/cache/fetch-cache -type f | wc -l | tr -d ' '), made a day old"
  find .next-e2e/cache/fetch-cache -type f -exec touch -t "$(date -v-1d +%Y%m%d%H%M 2>/dev/null || date -d yesterday +%Y%m%d%H%M)" {} +
else
  echo "Fetch cache entries: none"
fi

START=$(date +%s)
npx next build > "$LOGS/outage.log" 2>&1
RESULT=$?
kill $SILENT; wait $SILENT 2>/dev/null
echo "Build during the outage: exit $RESULT after $(( $(date +%s) - START )) s (log: $LOGS/outage.log)"
exit $RESULT
