# Luqky's Prediction Leaderboard (demo)

Independent demo built for a hiring assignment. Not affiliated with
predicting.top, Polymarket or Kalshi.

## What this is

A rebuild of the structure and behavior of a public prediction-market trader
leaderboard: a ranked list of the most profitable traders, platform pages,
trader profiles and a platform comparison. The assignment was to replicate
https://predicting.top/ using AI coding tools and to show how the result was
verified.

**Live:** https://prediction-leaderboard-replica.vercel.app

**Status:** the home, Polymarket and Kalshi boards run on live data. Trader
profiles show the header, a month strip that opens into a daily or monthly
calendar, the P&L history chart, Kalshi P&L by category and the Smart Score.
A head-to-head page compares one Polymarket and one Kalshi trader since a
common start. The terms, privacy, get-listed and API pages are in place, and
end-to-end tests run in CI at phone, tablet and desktop size, including
automated accessibility checks (WCAG 2.2 AA), keyboard checks and the
measured layout comparison with the source. The build is finished and
reviewed; what remains is the submission itself.

## What is deliberately different

The layout, routes, components, spacing, responsive behavior and interactions
follow the source as closely as we can measure. The product name, logo, copy,
accent color and favicon are original on purpose. No images,
icons, fonts or text from the source site are in this repository or in the
deployment: the code was written to that rule and reviewed against it, and a
CI check fails if the source's name appears outside the few files allowed to
mention it, or if a raw capture is committed. Publishing a look-alike of a live
product under its own brand would be passing off someone else's work.

There is no login, wallet connection, payment or working submission form. The
site shows only what the upstream public API already publishes.

## Run it

Requires Node.js 24. No API key or environment variable is needed: the data
comes from a public, keyless API.

```bash
npm ci --ignore-scripts
npm run dev
```

Then open http://localhost:3000.

## Check it

```bash
npm run check          # format, lint, typecheck, tests, asset check, production build
npm run test           # unit and component tests only
npm run test:coverage  # the same, with coverage; fails under the thresholds
npm run format         # rewrite files in the Prettier style
npm run check:assets   # no source-site files or names where they do not belong
npm audit --omit=dev   # must report 0 vulnerabilities
```

To run `npm run check` before every push, turn on the repository's hook once
per clone:

```bash
git config core.hooksPath .githooks
```

End-to-end tests build the app and run it against a local fixture server
that replays recorded API answers, so they need no network:

```bash
npx playwright install chromium   # once: the browser the tests drive
npm run test:e2e                  # phone, tablet and desktop sizes
```

`npm run fixtures:e2e` records any of those API answers that are missing
(`-- --force` records all again, thirteen spaced requests).
`npm run check:outage` checks that a production build still passes while the
upstream API is down.
`npm run lighthouse` measures the deployed site (three runs per page, phone
and desktop settings) and prints the median scores.

Results and the measured comparison with the source are in
[docs/EVALS.md](docs/EVALS.md).

`npm run snapshot` refreshes the saved data snapshot from the upstream public
API (nine spaced requests).

## How it was built and verified

| Document | Contents |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | What was observed on the source and what each page must do |
| [docs/EVALS.md](docs/EVALS.md) | Evals plan, parity matrix, rerun commands |
| [docs/BUGLOG.md](docs/BUGLOG.md) | Bugs caught in AI-written code and how they were caught |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | The AI workflow as it actually happened |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Dated choices and trade-offs |
| [CLAUDE.md](CLAUDE.md) | The rules file the AI agent works under |

## Credits

Started from
[JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template)
(MIT). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

All rights reserved. Published for evaluation of a hiring assignment only. See
[LICENSE](LICENSE).
