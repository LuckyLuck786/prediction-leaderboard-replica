# Submission

Independent demo built for a hiring assignment. Not affiliated with
predicting.top, Polymarket or Kalshi.

## Links

- Live site: https://prediction-leaderboard-replica.vercel.app
- Repository: https://github.com/LuckyLuck786/prediction-leaderboard-replica

The site rebuilds the structure and behaviour of predicting.top. The
product name, logo, copy, accent colour and favicon are original on
purpose, and no image, font, icon or text from the source is in the
repository. Copying a live product's branding would be passing off
someone else's work.

## Evals plan: how the copy was checked against the source

The full plan, the parity matrix and the commands to rerun each check are in
[docs/EVALS.md](EVALS.md).

- **Measured layout.** A layout probe recorded the source's sizes in the
  browser, for example the home table's columns at 1024 px: 48 / 56 / 243 /
  64 / 243 / 243 px. The same numbers are asserted on our pages by
  `e2e/parity.spec.ts`. EVALS lists each measure next to the source's value,
  and every known difference.
- **Data.** On 2026-11-14 a comparison of all 584 traders on the 1D board
  against the upstream API found 584 equal.
- **Function, accessibility and keyboard.** 217 end-to-end tests run offline
  against recorded API answers at phone, tablet and desktop size. They
  include axe checks in both themes. 481 unit and component tests also run.
  Coverage is 90.6% of statements, with thresholds enforced in CI.
- **Robustness.** A production build passes while the upstream API is down
  (`npm run check:outage`). A failed upstream answer falls back to a saved
  snapshot, and the page labels it as one.
- **Performance.** Lighthouse on production (2026-11-15, median of three
  runs): performance 99 to 100 and accessibility 100 on every page.
- **Every check was shown to fail on its defect before it was trusted.** For
  example, the CSP test was run against a blocking policy and the coverage
  gate against a 95% threshold.

## Bug log: bugs caught in AI-written code

[docs/BUGLOG.md](BUGLOG.md) has 87 entries, BUG-001 to BUG-087. Each is a real
bug, with how it was caught and the commit that fixed it. Examples:

- **BUG-050 and BUG-054: a fix that only looked proven.** Production builds
  hung while the upstream API was down. The first fix was "proven" by
  copying the fetch cache back with `cp -R`, which reset the file times, so
  the check could not fail. An independent review agent caught it. The
  failure was then reproduced properly (exit 1 after 185 s), and the real
  fix passes the same reproduction (`npm run check:outage`).
- **BUG-082: the calendar stopped too early.** For a trader on both
  platforms, the month strip could not step back before the second
  platform's history began, while the chart showed two more years. Caught
  in an independent AI code review the owner ran in a separate Claude
  session. Two unit tests failed on the old code, and an
  end-to-end test with a real two-platform trader now guards it. Checked on
  production: it reaches January 2024.
- **BUG-085: an API error that was not JSON.** An unknown period on our API
  answered with the HTML 404 page. The fix brought a trade-off of its own:
  each unknown path is now cached. The independent review found that, it
  was confirmed on a production server, and it was accepted (D-064).
- **BUG-087: a build rewrote a config file.** `allowJs` was removed from
  `tsconfig.json`, but `next build` writes back any suggested key that is
  missing. That rewrite went into a later commit unnoticed. It was caught by
  reading that commit's file list, and fixed by setting the key to `false`.
- **BUG-066 and BUG-067: a privacy fix that broke privacy.** Requesting
  trader pictures anonymously removed a third-party cookie. It also broke
  one picture route, and made the privacy page untrue, because anonymous
  requests send an `Origin` header. Lighthouse and the review caught it. The
  change was dropped (D-050).

## Skills and AI workflow

The workflow as it happened, including the slips, is in
[docs/WORKFLOW.md](WORKFLOW.md). The rules the agent works under are in
[CLAUDE.md](../CLAUDE.md).

- **Tools.** Claude Code built the site in phases, and stopped at each gate
  for the owner's go.
- **Standing rules in `CLAUDE.md`.** They cover original branding only, an
  asset check in CI, server-only upstream access, Zod at the boundary, and
  reproducing a failure before trusting a fix.
- **Independent review.** Before each phase was called done, a reviewer
  agent that had not written the code reviewed it.
- **Other tools.** A code knowledge graph (graphify) for navigation,
  bundled framework docs, Playwright, axe and Lighthouse for evals, and
  GitHub CI with SHA-pinned actions.
- **Commits.** Every commit is authored by the owner. Each one written with AI
  help keeps its co-author trailer, as honest evidence of the workflow.

## Deliberately not done

- **Loading other periods only on hover, and sending fewer traders with the
  page** (D-062). The source prefetches the other periods and keeps the
  whole board in the browser, so changing either would make the copy less
  faithful.
- **Refusing unknown API periods before they are cached** (D-064). That
  would need middleware on every board request. It is accepted for a demo,
  like the open profile route (D-056).
- **A firewall rate limit on `/account/*`.** It is a Vercel dashboard setting
  for the owner to decide on, and is not set.
