// Lighthouse on the deployed site (docs/EVALS.md, "Performance"): five routes,
// phone and desktop settings, three runs each (single runs vary a lot on the
// phone setting), then a table of the median run for each page. Uses the
// pinned Lighthouse release through npx (nothing installed in the project or
// globally) and the Chromium build the end-to-end tests already use.
//
// Usage: npm run lighthouse [-- <base URL>]   (default: the production URL)

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const LIGHTHOUSE = "lighthouse@13.6.0";
const DEFAULT_BASE = "https://prediction-leaderboard-replica.vercel.app";
const ROUTES = ["/", "/kalshi", "/account/ProbabilityDuck", "/battle", "/api-docs"];
const FORM_FACTORS = ["mobile", "desktop"];
const RUNS = 3;
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const METRICS = {
  "first-contentful-paint": "FCP",
  "largest-contentful-paint": "LCP",
  "total-blocking-time": "TBT",
  "cumulative-layout-shift": "CLS",
};

const base = process.argv[2] ?? DEFAULT_BASE;
const outDir = mkdtempSync(join(tmpdir(), "lighthouse-"));
const chromePath = chromium.executablePath();

const rows = [];
const failing = new Map();

/** One Lighthouse run; returns the parsed report. */
function run(formFactor, route, attempt) {
  const file = join(outDir, `${formFactor}${route.replaceAll("/", "_")}-${attempt}.json`);
  const args = [
    "--yes",
    LIGHTHOUSE,
    `${base}${route}`,
    "--quiet",
    "--output=json",
    `--output-path=${file}`,
    "--chrome-flags=--headless=new",
    ...(formFactor === "desktop" ? ["--preset=desktop"] : []),
  ];
  // Throws, and so stops the script, if Lighthouse fails. Its own packages
  // are installed without install scripts, as the project's are.
  execFileSync("npx", args, {
    stdio: "inherit",
    env: { ...process.env, CHROME_PATH: chromePath, npm_config_ignore_scripts: "true" },
  });
  return JSON.parse(readFileSync(file, "utf8"));
}

for (const formFactor of FORM_FACTORS) {
  for (const route of ROUTES) {
    const reports = Array.from({ length: RUNS }, (_, attempt) => run(formFactor, route, attempt));
    reports.sort((a, b) => (a.categories.performance.score ?? 0) - (b.categories.performance.score ?? 0));
    const report = reports[Math.floor(RUNS / 2)];
    const scores = CATEGORIES.map((category) => {
      const score = report.categories[category].score;
      // Lighthouse gives no score when a run fails part-way; that is a failed run, not a 0.
      if (score === null) throw new Error(`No ${category} score for ${formFactor} ${route}`);
      return Math.round(score * 100);
    });
    const metrics = Object.keys(METRICS).map((id) => report.audits[id].displayValue);
    rows.push([formFactor, route, ...scores, ...metrics]);
    for (const audit of Object.values(report.audits)) {
      if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== "informative") {
        const key = `${audit.id}: ${audit.title}`;
        failing.set(key, [...(failing.get(key) ?? []), `${formFactor} ${route}`]);
      }
    }
  }
}

const header = ["form", "route", ...CATEGORIES, ...Object.values(METRICS)];
console.log(`\n| ${header.join(" | ")} |\n|${header.map(() => "---").join("|")}|`);
for (const row of rows) console.log(`| ${row.join(" | ")} |`);
console.log("\nAudits below 0.9:");
for (const [audit, where] of failing) console.log(`- ${audit} (${where.join(", ")})`);
console.log(`\nReports: ${outDir}`);
