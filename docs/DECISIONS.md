# Decisions

Short dated notes on choices and trade-offs. Newest at the bottom.

## 2026-11-14

### D-001 Start from a public template, with fresh history

The project starts from `JCodesMore/ai-website-cloner-template` (MIT) at
upstream commit `5426e0e`. The files were copied in without the template's git
history or remote, so this repository's history shows only our own work on top
of one clearly labeled starting commit.

### D-002 Read the template before installing it

Downloaded code is untrusted until read. Before `npm install` we read
`package.json` scripts, `AGENTS.md`, `CLAUDE.md`, the `clone-website` skill
and its references, both workflows and the lockfile. Findings:

- No install hooks in `package.json`. `scripts/` is empty.
- All 703 locked packages resolve to the npm registry. Two carry postinstall
  scripts (`msw`, `unrs-resolver`), both pulled in by build tooling.
- `token-badge.yml` checks out a third-party repository and force-pushes a
  `badges` branch with write permission. Removed.
- The template's instructions tell the agent to copy the source site's real
  text, fonts, images and SVGs. That conflicts with this project's hard rules,
  so `CLAUDE.md` states that the project rules win.

### D-003 Install with package scripts disabled

Dependencies are installed with `npm ci --ignore-scripts`. Lint, typecheck and
build all pass without the two postinstall scripts, so there is no reason to
let third-party code run at install time.

### D-004 Remove template housekeeping

Removed: the token-badge workflow, the funding file, the sponsor banner, issue
templates, the Docker setup and the template's demo screenshot. They describe
the upstream project, not this one. Deployment target is Vercel.

### D-005 Bump Next.js before writing any code

The template pinned `next` 16.3.5. `npm audit` listed eleven advisories against
it, three rated critical (remote code execution in `next/og`, in image
optimization and in `use cache`). We moved to 16.4.6, the patched release, and
`eslint-config-next` with it. `source-map-js` took its patch release.

The `shadcn` CLI moved to `devDependencies`: it is used only at build time.
After that, `npm audit --omit=dev` reports 0 vulnerabilities.

Accepted for now: `npm audit` without `--omit=dev` still lists advisories in
packages that only the `shadcn` CLI pulls in (`proxy-addr`, `body-parser`,
`@modelcontextprotocol/sdk`, `zod`, `brace-expansion`). They never reach the
deployed bundle. Revisit if the CLI is still needed after the UI is built.

### D-006 Commit identity

Commits are authored by the repository owner using GitHub's private noreply
address, set for this repository only, so a personal email is not published.
Commits written with AI help keep the `Co-Authored-By` trailer as honest
evidence of the workflow.

### D-007 Original branding, mirrored structure

The assignment asks for an exact replica. We mirror everything that can be
measured (routes, layout, components, spacing, responsive behavior,
interactions, functionality) and deliberately use our own name, logo, copy,
accent color, favicon and social image. Publishing a look-alike of a live
product under someone else's brand would be passing off their work, and the
template's own README says logos, brand assets and original copy belong to
their owners. Every page carries a disclaimer.

### D-008 License

`LICENSE` reserves all rights in the original work and states that the
repository is published for evaluation only. Template-derived portions stay
under MIT; the text is in `THIRD_PARTY_NOTICES.md`.

### D-009 Observe politely, and only what a visitor sees

`robots.txt` and the terms were read before any page visit. Each route was
loaded once. Response shapes were read by repeating, once each, the requests
the pages themselves make, well inside the stated rate limit. A few of those
requests go to endpoints outside the public API reference; they were read to
understand the pages, and whether the replica may depend on them is an open
question for the owner (spec Q-02). Raw captures are kept out of the
repository.

### D-010 The spec describes, it does not copy

`docs/SPEC.md` records structure, measurements and behavior in our own words.
It contains no markup, styles or copy text from the source, because the
source's terms protect its design, code and original content.

### D-011 Data source: the source's documented public API

Decided by the owner at the phase 1 gate. The API is documented as free,
keyless and rate-limited, and it already carries the computed values (score,
sports share, day mover, linked accounts, Kalshi history) that the platforms'
own APIs do not. We fetch it on our server, cache it for at least five
minutes, validate it, and fall back to a labeled snapshot. The footer credits
the source and links back, as its API terms ask.

### D-012 No dependence on undocumented endpoints

Only endpoints in the public API reference are used. Polymarket chart history
comes from Polymarket's own data API. The Kalshi non-sports toggle filters
locally on `sports_share`. Anything that cannot be built from documented data
is left out and listed as a difference.

### D-013 Avatars load from the URLs the API returns

Plain lazy images with an initials fallback, no image proxy or optimizer, so
the deployment cannot run up image-optimization costs. This is the one place
a visitor's browser contacts a third-party host; requests send no referrer.

### D-014 Source-specific features

The "our traders" filter is dropped: it only has meaning for the source's own
business. The battle page becomes a neutral head-to-head of the same two
public profiles, without the host promotion.

### D-015 Privacy page

Added, short: the demo collects nothing. The source has terms but no privacy
page.

### D-016 Branch flow

Each phase is built on its own branch and fast-forwarded into `main` at the
gate, after the owner's go.

### D-017 System font, no web font

The source uses the operating system's UI font and loads no font files. So do
we: text metrics match the source exactly, and there is nothing to license or
ship. The template's Geist font is gone.

### D-018 Letter badges instead of platform logos

The source shows the Polymarket, Kalshi, Hyperliquid and X logos. Those are
other companies' trademarks and the hard rules forbid extracted icons, so each
platform gets a small letter badge in our own colors.

### D-019 Palette

Warm neutrals in place of the source's pure greys: near-black `#141311` in the
dark theme (the default, as on the source) and off-white `#f3f1ec` in the
light theme. Gain, loss, score bands and platform accents keep their meaning
but use our own shades. Every text color was checked for contrast against its
background when chosen: at least 6:1 in the dark theme and at least 4.6:1 in
the light theme. Automated checks follow in the evals phase.

### D-020 Pages are marked noindex

A look-alike demo should not compete with the original in search results.

### D-021 The snapshot stores upstream objects as received

`npm run snapshot` keeps the 50 best and 10 worst traders of each period,
untouched. Live responses and the snapshot therefore go through the same
schema, and a test fails if the committed snapshot stops matching it. The
losers are kept on purpose so negative amounts are always on screen to check.

### D-022 "Joined" is counted to the data timestamp

The source counts days up to the visitor's clock. We count up to the
timestamp of the data. For live data the two agree; for a snapshot ours is the
honest number; and the server and the browser always render the same text.

### D-023 Mirror what is rendered, not what the class names suggest

The source's chips carry a border class but render no border. The replica
follows the measured result. See BUG-001.

### D-024 End-to-end tests wait for the data layer

Playwright is added in the next phase, together with live data and error
states, which are the flows worth driving end to end. Until then the layout is
checked with a browser probe (see `docs/EVALS.md`) and behavior with component
tests.

### D-025 Review findings are checked, not obeyed

The reviewer's report is input, not instruction. Each finding was checked
against the code and the source observations first. Two were kept as they
were because the source behaves that way or because the link belongs to the
source's brand; both are recorded in `docs/BUGLOG.md` with the reason.

### D-026 A broken snapshot stops the build

The snapshot is our own committed file. If it ever fails validation the build
and the schema test fail loudly. Handled error states are for upstream data,
which we do not control.

### D-027 Hosting on Vercel, deployed from GitHub

The repository is linked to a Vercel project through Vercel's GitHub app, so
every push to `main` deploys to production and every other branch gets a
preview deployment. The Docker-only `output: "standalone"` setting is removed,
and Node is pinned to `24.x` in `package.json` so local, CI and Vercel builds
use the same major version. Hobby plan, no paid features.

### D-028 Theme script lives in the head, as plain inline script

The script that applies a saved light theme must run before the first paint.
It now sits in `<head>`, where it runs while the HTML is parsed, before the
body exists. `next/script` with `beforeInteractive` was tried and rejected:
in the production HTML it was placed at the end of `<body>` and only queued,
running after the app's own scripts load, which would flash the dark theme.

Correction, same day: the React notice about a script it renders in the
browser was first put down to Fast Refresh only. It also appeared on a fresh
load of a 404 page (BUG-019). The script is now rendered only into the server
HTML and dropped after hydration, and the saved theme is re-applied once
mounted (BUG-018). Errors from Fast Refresh picking up a half-edited file
remain possible while editing and are not app defects.

### D-029 One period ships with the page, the others load from our route

Each upstream board is 570 to 700 KB of JSON. Sending all four periods with
the page would make it several times heavier, so the server renders the 1D
board and the browser fetches the other periods from our cached
`/api/boards/{period}` right after the first paint, as the source does with
its own API. Switching period is then instant, and the browser still never
calls upstream for data.

### D-030 Daily total is never mixed with the snapshot

If upstream's daily total cannot be read, the header shows a dash. Showing
the snapshot's total next to live rows would put two different moments on one
screen.

### D-031 Profiles in two steps

Phase 3 builds the profile page from the documented trader endpoint so every
row link resolves: header, P&L by period and the Smart Score card. The P&L by
period card is an interim summary that the source does not have; phase 4
replaces it with the month strip, the history chart and the category bars,
after a closer look at the source's profile pages.

### D-032 Unknown profile ids never reach upstream

`/account/{id}` accepts only a wallet address or a username made of letters,
digits, dots, dashes and underscores. Anything else is a 404 without a
request, so a crafted path cannot be forwarded to the upstream API.

### D-033 Pictures are exempt from "the browser never calls upstream"

Amends D-013, after the phase 3 review asked. Trader figures are always
fetched by our server. Pictures are not: a visitor's browser loads each
avatar or market icon from the URL the API gives, which can be X,
Polymarket's image hosts or the data source's own site. The owner chose this
over an image proxy (Q-03): a proxy would put every image request through our
host and its bandwidth for no gain in what is shown. The privacy page says so.

### D-034 Kalshi periods load on demand

The home board prefetches its other periods (D-029); the Kalshi board does
not. Each Kalshi period is a 1,000-row board, and the source fetches them only
when selected (KAL-07), so this board does the same and shows skeleton rows
while a period loads.

### D-035 Where profile history comes from (2026-11-14, phase 4)

Kalshi history comes from the documented `/api/kalshi/{username}/history`.
Polymarket history comes from Polymarket's own documented data API,
`GET /v2/user-pnl?interval=all&fidelity=1d`, one request per wallet; a trader
with several wallets gets the sum, each wallet's last value carried forward.
Its `trade_pnl` field gave the same all-time figure and the same chart labels
as the source, so it is the field used. The source's own Polymarket history
route is undocumented and is not used (Q-02). Traders listed only on
Hyperliquid have no documented history, so their profile says so instead of
showing a chart.

### D-036 Calendar days are UTC, and a day needs the day before

A day's result is that day's last cumulative value minus the previous UTC
day's last value, and it exists only when the previous day has data. This
rule was chosen by computing monthly totals from the real history and
comparing them with the eleven totals the source showed for 2026: UTC days
with this rule matched 9 exactly. IST days matched 3, New York days 1, and
UTC days that bridge a gap got August, September and October wrong. The two
months that still differ (August and September, by about $2.5K and $1.2K)
are recorded as a known difference (DEV-23).

### D-037 Calendar shading by fixed dollar steps

Every day shade recorded on the source fits fixed steps: under $100 is flat,
then steps at $500, $2K, $5K and $10K, the same for gains and losses, and the
month's best gain gets the highlight color. A first rule that scaled shades
to the month's largest day did not fit (BUG-033). The thresholds live in
`history.ts` and the test file holds every observed day.

### D-038 The P&L chart is plain SVG

No chart library: one line, a dashed zero line, five date labels, four or
five money labels and a hover readout are about 200 lines of SVG and React.
The value axis copies the observed behavior instead of guessing: the data
range is padded by 10% on each side, the step is a quarter of the range
rounded up to a multiple of 0.05 of its order of magnitude, and the top label
is the padded maximum. That reproduces both recorded source charts label for
label (`history.test.ts`).

### D-039 Two profile pieces are not built

- **"Last 24h" category movers.** They come from an undocumented endpoint
  (Q-02). The category rows themselves come from the documented one.
- **Share cards (PROF-06).** Marked "first to cut" in the spec. They need
  server-rendered images and share actions, and add nothing to the data.

Both are listed in `docs/SPEC.md` as DEV-20 and DEV-21.

### D-040 End-to-end tests run offline

Playwright drives the production build against a local fixture server that
replays the committed snapshot and five recorded API answers
(`npm run fixtures:e2e` records them again). History is moved forward by
whole days so it always ends today, which keeps the current month's calendar
populated whatever the date. The two upstream origins can be pointed at the
fixture server through `UPSTREAM_ORIGIN` and `POLYMARKET_DATA_ORIGIN`; each
must be an absolute URL or the server refuses to start, and only the origin
part is used. Every request to a non-local host is aborted inside the tests,
pictures included. The test build goes to `.next-e2e`, so it never disturbs
a running development server. Playwright is pinned to 1.64.0 because that
release uses the Chromium build already installed on the owner's machine,
which saved a browser download; CI installs its own copy.

### D-041 A failed history card is cached with the page

If the history or category request fails while a profile is rendered, the
page shows the rest of the profile with a short message in that card, and
that version is cached for the usual five minutes. The alternative, failing
the whole page so nothing is cached (as BUG-023 does for the trader record),
would take away a working profile because of one card. Raised by the phase
4 review.

### D-042 Two history readings checked against the API, not the source

- **Polymarket days.** A daily point stamped 00:00 UTC is read as the
  previous day's close (BUG-043). The source's Polymarket calendar was not
  recorded, so this is checked against the trader record's 1-day P&L from
  the documented API instead.
- **Traders on both platforms.** Each series' daily changes are added, and
  the chart holds a series that starts late at its first value (BUG-042). The
  source's route for these traders is undocumented and was not observed.

Both are listed as assumptions in `docs/EVALS.md`.

### D-043 The head-to-head is rebuilt from documented histories (2026-11-15, phase 5)

The source draws its battle chart from an undocumented route (Q-02). Its
recorded answer showed how the chart is made: the start is the first point
of the Kalshi history, 2025-09-27 09:23:39 UTC, where the Kalshi P&L was
$45,200.28; the Polymarket line starts from its first daily point after
that, $21,063.72247 on 2025-09-28; both lines show change since then. The
documented Kalshi history and Polymarket's documented P&L series give
exactly those figures, so the page computes the same comparison from them:
the start is the later of the two histories' first points, and each line is
its change since its first point at or after the start. The pair stays fixed
(BATTLE-04), the host promotion is dropped (D-014).

### D-044 Head-to-head axis: 15% padding, crowded top label left out

The head-to-head chart pads its value range by 15% on each side, not the
profile chart's 10%: computed from the pair's real histories cut at the
moment the source was captured, 15% is what gives the source's labels
exactly ($-96.0K, +$154.0K, +$404.0K, +$723.6K), and 10% does not
(BUG-051). The same data also shows what the source's chart library does
with a step label close to the top one: one 17.9 px below it was left out
here, one 21.3 px below it was kept on the profile chart. Both charts now
leave out a label closer than 20 px, a cut-off between the two.

### D-045 What the head-to-head page adds and drops

- In the slot of the host link: a link back to the leaderboard, the
  disclaimer and the data credit. The source's bare page has no footer; ours
  needs the disclaimer on every page (CLAUDE.md rule 6).
- The site footer links to the page. The source links to it from nowhere
  that was observed, so on ours it would be reachable only by URL.
- During a build, if a trader record cannot be loaded, that side shows the
  wallet or username the pair is defined by and links to our profile route;
  if a history cannot be loaded, the chart card says so at the chart's
  height. So a build never fails on this page. At any other time an
  incomplete load throws: Next.js keeps serving the last complete page and
  retries on the next request (BUG-055).

### D-046 End-to-end fixtures are recorded only when missing

`npm run fixtures:e2e` now records a fixture only if its file is not there,
so adding the head-to-head pair did not change the profile fixtures the
existing tests were written against. `-- --force` records all of them again.

### D-047 Upstream requests skip the fetch cache

Upstream data is cached once, as each route's rendered output, for five
minutes, instead of also in Next.js's fetch cache. A stale fetch-cache entry
is refreshed without the request's timeout, which hung builds during an
upstream outage (BUG-050). Leaving out the fetch's cache options is not
enough, because a build caches such fetches anyway (BUG-054). So every
upstream fetch says `cache: "no-store"`, and every route that reads upstream
exports `dynamic = "force-static"` next to `revalidate = 300`, which keeps it
static instead of letting `no-store` make it dynamic. A test checks both on
every such route; the build output shows each with a five-minute refresh.

Trade-offs, accepted: during an outage a regenerated board shows the
snapshot, where the fetch cache would have kept data a few minutes old; the
dev server asks upstream on every reload (at most four requests a page); a
profile render still makes one trader request, through a per-render memo.

### D-048 Boards do not prefetch profile pages (2026-11-15, phase 6)

Next.js prefetches every link that scrolls into view. On a board that meant
up to 19 profile pages per visit, each rendered on our server with its own
upstream requests, for pages most visitors never open (BUG-063). The source
loads a profile only when it is opened, so profile links now say
`prefetch={false}`, and a loading skeleton shows at once while a profile
that is not cached yet is built (BUG-070).

### D-049 Accessibility target: WCAG 2.2 AA, checked three ways

- **axe** on 13 page states (every route, plus the profile calendar open in
  both views and the 404 page), in both themes, at phone, tablet and
  desktop size: `e2e/a11y.spec.ts`.
- **Keyboard**: Tab reaches every control on seven pages, each with a ring
  that is drawn, opaque and not cut off; the main controls work by keyboard
  alone: `e2e/keyboard.spec.ts`.
- **Token contrast**: every text colour against every surface and its badge
  tint, every calendar shade, the focus ring, in both themes, with a 0.1
  margin for colour rounding: `src/app/contrast.test.ts`.

What this changed in our own palette: light-theme accents about 12 to 17%
darker, dark-theme muted text and loss red a little lighter, dark calendar
shades at most 52%, one 2 px focus ring in the full ring colour. On phones
the badges in a row sit 4 px apart instead of the source's 2 px, so each
20 px link meets WCAG 2.5.8 (DEV-29).

### D-050 Pictures stay plain image requests

To avoid a third-party cookie, pictures from the hosts that allow it were
briefly requested anonymously (CORS). That was dropped: such a request sends
an `Origin` header, which tells the picture host which site shows the
picture, and the privacy page promises it does not (BUG-067). It also broke
the data source's wallet pictures, which do not allow it (BUG-066). The
cookie in question is a header from the data source's picture routes that
deletes a cookie (`Max-Age=0`). Accepted: Lighthouse's best-practices score
is 77 on the boards that show such pictures, for that header alone.

### D-051 Performance: measured, nothing to optimise

Lighthouse, median of three runs per page, phone and desktop settings
(`npm run lighthouse`), on the deployed site: performance 99 to 100 on
every page, cumulative layout shift 0, largest paint at most 1.3 s on the
phone setting. The
largest cost is the home page's 3.9 MB, of which 3 MB is trader pictures at
their full size (one 933 KB GIF shown at 40 px); that follows from loading
pictures from the addresses the API gives, without a proxy (owner decision
Q-03, D-033). SEO scores 60 to 63 only because every page asks not to be
indexed (D-020).

### D-052 How the parity test measures

The layout probe is now `e2e/parity.spec.ts`. It sets the viewport the source
was measured at and a pixel density of 2, as in the measuring browser: at 1x
Chrome rounds some text lines to whole pixels. Sizes set by CSS are checked
on every platform; widths set by text depend on the system font (D-017) and
are checked only on macOS, where they were measured. A tablet size (768 px)
joins the phone and desktop sizes for every end-to-end test.

### D-053 Lighthouse and axe as tools

axe runs through `@axe-core/playwright` 4.14.0, a dev dependency pinned
exactly (its only dependency is axe-core); no local code could replace the
rule engine. Lighthouse 13.6.0 runs through `npx`, pinned, with install
scripts off, against Playwright's Chromium, so nothing is added to the
project or installed globally.

## Open items

