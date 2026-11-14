// Waits until a URL answers, then exits. Playwright starts its web servers
// at the same time, and the app's production build needs the fixture server
// already up, because building pre-renders pages from its data.
//
// Usage: node e2e/wait-for.mjs <url> [timeoutMs]

const [url, timeoutArg] = process.argv.slice(2);
const DEFAULT_TIMEOUT_MS = 30_000;
const POLL_MS = 250;

if (!url) {
  console.error("Usage: node e2e/wait-for.mjs <url> [timeoutMs]");
  process.exit(2);
}

const deadline = Date.now() + Number(timeoutArg ?? DEFAULT_TIMEOUT_MS);
let lastError = null;
while (Date.now() < deadline) {
  try {
    const response = await fetch(url);
    if (response.ok) process.exit(0);
    lastError = new Error(`answered ${response.status}`);
  } catch (error) {
    lastError = error;
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
console.error(`Gave up waiting for ${url}:`, lastError);
process.exit(1);
