# Luqky's Prediction Leaderboard (demo)

Independent demo built for a hiring assignment. Not affiliated with
predicting.top, Polymarket or Kalshi.

## What this is

A rebuild of the structure and behavior of a public prediction-market trader
leaderboard: a ranked list of the most profitable traders, platform pages,
trader profiles and a platform comparison. The assignment was to replicate
https://predicting.top/ using AI coding tools and to show how the result was
verified.

**Status: the home page is built and runs on a saved snapshot of the data.**
Live data, the platform pages and trader profiles come next. This section is
updated as pages are built.

## What is deliberately different

The layout, routes, components, spacing, responsive behavior and interactions
follow the source as closely as we can measure. The product name, logo, copy,
accent color, favicon and social image are original on purpose. No images,
icons, fonts or text from the source site are in this repository or in the
deployment, and a CI check enforces that. Publishing a look-alike of a live
product under its own brand would be passing off someone else's work.

There is no login, wallet connection, payment or working submission form. The
site shows only what the upstream public API already publishes.

## Run it

Requires Node.js 24 or newer.

```bash
npm ci --ignore-scripts
npm run dev
```

Then open http://localhost:3000.

## Check it

```bash
npm run check          # lint, typecheck, tests, asset check, production build
npm run test           # unit and component tests only
npm run check:assets   # no source-site files or names where they do not belong
npm audit --omit=dev   # must report 0 vulnerabilities
```

Results and the measured comparison with the source are in
[docs/EVALS.md](docs/EVALS.md).

`npm run snapshot` refreshes the saved data snapshot from the upstream public
API (five spaced requests).

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
