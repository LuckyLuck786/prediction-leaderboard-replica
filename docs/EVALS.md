# Evals plan

How we verify that the replica matches the source in structure and behavior,
and that it works correctly. Branding differences are expected and excluded:
see `docs/DECISIONS.md`, D-007.

**Status (2026-11-15, end of phase 7):** every route is built and checked
against live data. The offline end-to-end suite runs in CI at phone, tablet
and desktop size and includes axe, keyboard and measured-parity checks;
Lighthouse has been run on production. A cell says "not run" only if its
check has not actually been run.

## Check groups

| Group | What it checks |
|---|---|
| Structure | Sections present, column set, row count, sort order, navigation links |
| Function | Tabs, timeframe filters, sorting, pagination, search, row-to-profile navigation, loading, empty and error states |
| Data correctness | For a sample of traders, displayed values equal the upstream API response; rank ordering; money formatting (large, small, negative); platform labels |
| Layout | Side-by-side comparison with the source at 390, 768 and 1440 px: structure and spacing |
| Robustness | Upstream down, slow, rate-limited, or returning malformed data |
| Accessibility | Automated axe checks, keyboard navigation |
| Performance | Lighthouse on the deployed site |
| Automation | Unit, component and end-to-end tests plus the asset check, all green in CI |

## Parity matrix

Routes come from `docs/SPEC.md`. Viewports: 390, 768, 1440 px.

Each cell is checked against the acceptance list for that route in
`docs/SPEC.md`, section 4. Formatting rules FMT-01 to FMT-09 become unit tests.

| Route | Structure | Function | Data | Layout 390 | Layout 768 | Layout 1440 | Robustness | A11y |
|---|---|---|---|---|---|---|---|---|
| `/` | pass (1) | pass (2) | pass (3) | pass (4, 19) | ours only, e2e (17) | ours only, e2e (17) | pass, unit (6) | pass (18) |
| `/polymarket` | pass | pass | pass (3) | ours only, e2e (17) | ours only, e2e (17) | ours only, e2e (17) | pass, unit (6) | pass (18) |
| `/kalshi` | pass (7) | pass (7) | pass (7) | ours only, e2e (17) | ours only, e2e (17) | ours only, e2e (17) | pass, unit (6) | pass (18) |
| `/account/[id]` | pass (8) | pass (8, 11) | pass (8, 12) | ours only, e2e (13) | ours only, e2e (17) | pass at 1024 (19) | pass, unit and e2e (8) | pass (18) |
| `/battle` | pass (14) | pass (14) | pass (15) | ours only, e2e (13) | pass at 800 (19) | ours only, e2e (13) | pass, unit and live outage (16) | pass (18) |
| `/api-docs` | pass (9) | pass (9) | pass (9) | ours only, e2e (17) | ours only, e2e (17) | ours only, e2e (17) | n/a | pass (18) |
| `/submit` | pass (10) | pass (10) | n/a | ours only, e2e (17) | ours only, e2e (17) | ours only, e2e (17) | n/a | pass (18) |
| `/terms`, `/privacy` | pass | n/a | n/a | ours only, e2e (17) | ours only, e2e (17) | ours only, e2e (17) | n/a | pass (18) |

Notes, 2026-11-14 (items 2, 3, 6 updated at the end of phase 3):

1. Columns, header labels, footer links, disclaimer and first page of 30 rows
   present. Checked in the browser and by component tests.
2. Period, platform, toggles, optional columns, sorting, search and paging
   pass in component tests and in the browser. Row and name links open the
   trader's profile; footer links open real pages.
3. **Live comparison:** our `/api/boards/1d` against one direct upstream
   response: all 584 traders present, 0 rejected, P&L and score equal for
   every one, top five by P&L in the same order. Live counts in the browser:
   1D 421 of 584, 1M 571 of 652, YTD 678 of 773, ALL 693 of 788.
4. Measured against the source at 390 px: see the table below.
5. Our page renders without horizontal scroll and with the expected columns
   at 768 and 1440 px. The source was not observed at these widths, so this is
   not yet a comparison.
6. Malformed, empty and hostile data, a 429, a timeout, a non-JSON body and
   a network failure are covered by unit tests of the client, the schemas and
   the fallback: the page serves the labelled snapshot, the daily total shows
   a dash, a failed period load offers a retry.
7. `/kalshi` live: no other period is fetched on load; selecting one shows
   skeleton rows, then the board. "1,000 traders", 100 rows then "Show more
   (900 left)",
   search "duck" gives 7 traders with their true ranks (183, 248, ...),
   non-sports 433, 7D reorders the board. 31 of the first 100 names link to a
   local profile, 69 to Kalshi.
8. Profiles for a Kalshi and a Polymarket trader render header, P&L and Smart
   Score equal to the API; an unknown id is a 404 page; a malformed id,
   including `..`, is a 404 without any upstream request; any other upstream
   failure is thrown to the error boundary, so it is never cached. Phase 4
   added the month strip, calendar, chart and category card; share cards and
   the "Last 24h" movers are left out on purpose (DEV-20, DEV-21). A failed
   history or category load leaves the rest of the profile in place with a
   message (unit tests).
9. Both documented routes return live data; an unknown period returns 404.
10. The form's fieldset and button are disabled; a click on Submit fires no
    submit event; the form has no action.
11. Month strip: previous and next month, the disabled ends, the calendar's
    Daily and Monthly views, the chart's hover readout and the Kalshi note
    behind its info button pass in the browser and in end-to-end tests.
12. **Against the source's recorded values** for one Kalshi trader
    (ProbabilityDuck, 2026-11-14): November header "+$161,061, 9W / 4L"
    equal; all 14 day shades equal; chart labels `-$12K +$338K +$688K
    +$1.0M +$1.2M` and `Sep 25 ... Nov 26` equal; 14 category rows equal;
    9 of 11 monthly totals equal (DEV-23). For one Polymarket trader
    (elucidate): labels `-$110K +$190K +$490K +$790K +$1.0M` and
    `Aug 24 Mar 25 Sep 25 Apr 26 Nov 26` equal.
13. End-to-end at 390 and 1440 px: every part renders and the page has no
    horizontal scroll. The source was measured at 1024 px (profile) and
    800 px (head to head) only (tables below).
14. Head to head: both traders with ringed pictures, platform links without
    query strings, X links, the legend, a two-line chart whose lines both
    start on the zero line (end-to-end test), a readout of both values under
    the pointer, the disclaimer. Linked from the footer of every page.
15. **Against the source's recorded answer** (2026-11-13 19:58 UTC): same
    start (2025-09-27 09:23:39 UTC), same baselines ($45,200.28 and
    $21,063.72247), Kalshi line of 1,983 points ending at +$627,817.13, and
    the same value labels `$-96.0K +$154.0K +$404.0K +$723.6K`, computed from
    the documented histories cut at that moment (`comparison.test.ts`). The
    date labels differ on purpose (DEV-28).
16. While the upstream was really down (2026-11-15, from about 00:45 IST
    until at least 01:22; it was back by 10:16): the page showed both traders by id and an "unavailable" chart card
    of the chart's height. The production build then failed (BUG-050); it
    passes since the fix, checked by `npm run check:outage`.
17. The whole end-to-end suite, axe included, runs at 390, 768 and 1440 px.
    No sideways scroll is asserted on the home and Kalshi boards, profiles
    and the head-to-head page. "Ours only": the source was not measured at
    that size.
18. axe (WCAG 2.2 A and AA) passes on every route and on the profile
    calendar open in both views, in both themes, at all three sizes: 78
    checks. Keyboard: Tab reaches every control on seven pages with a ring
    that is drawn, opaque and not cut off. Colour tokens pass 4.6:1 for
    text and 3.1:1 for the focus ring in both themes (`contrast.test.ts`).
19. Measured parity now runs as `e2e/parity.spec.ts`: home at 1024 and 390
    px, profile at 1024 px, head to head at 800 px, against the source's
    numbers in the tables below.

### Measured parity, home page

Same probe, same viewport, source on 2026-11-14 01:10 IST, ours on 2026-11-14
22:20 IST. Sizes in px. Our page has one extra element, the snapshot banner;
vertical positions are compared with its height subtracted.

| Measure | Viewport | Source | Ours |
|---|---|---|---|
| Content column width | 1024 | 896 | 896 |
| Column widths (#, picture, trader, joined, score, P&L) | 1024 | 48 / 56 / 243 / 64 / 243 / 243 | 48 / 56 / 243 / 64 / 243 / 243 |
| Header row height | 1024 | 53 | 53 |
| Row height, with day mover | 1024 | 61 | 61 |
| Avatar | 1024 | 40 | 40 |
| Name, score, P&L font size | 1024 | 18 / 20 / 18 | 18 / 20 / 18 |
| Search input | 1024 | 192 x 30 | 192 x 30 |
| Period buttons `ALL`, `1D` | 1024 | 49.4 x 28, 40.7 x 28 | 49.4 x 28, 40.7 x 28 |
| `$5+`, `All`, `Sharpe` chips | 1024 | 45.8 x 28, 32.1 x 28, 56.2 x 24 | 45.9 x 28, 32.1 x 28, 56.2 x 24 |
| `No sports` chip | 1024 | 71.3 x 28 | 71.3 x 28 |
| `All` chip left edge | 1024 | 483 | 483 |
| Table top edge | 1024 | 279 | 280 |
| Show-more button | 1024 | 896 x 36 | 896 x 36 |
| Footer gap above | 1024 | 64 | 64 |
| Column widths (#, picture, trader, score, P&L) | 390 | 24 / 28 / 105 / 105 / 105 | 24 / 28 / 105 / 105 / 105 |
| Row height, with day mover | 390 | 49 | 49 |
| Period button `1D` | 390 | 35 x 24 | 35 x 24 |
| Heading font size | 390 | 20 | 20 |
| Horizontal scroll | 390 | none | none |

Known differences, all deliberate: the brand mark and "demo" tag beside the
heading, the snapshot banner, letter badges in place of platform logos, no
"our traders" filter, and our own colors and copy.

### Measured parity, head-to-head page

Same viewport as the source capture (800 px wide). Sizes in px.

| Measure | Source | Ours |
|---|---|---|
| Column | 768 | 768 |
| Heading | 768 x 32 | 768 x 32 |
| Subtitle | 768 x 22 | 768 x 22 |
| Trader card | 768 x 272 | 768 x 272 |
| Picture with ring | 128 (96 below 768 px) | 128 (96 below 768 px) |
| "VS" | 30 px bold | 30 px bold |
| Chart card | 768 x 354 | 768 x 354 |
| Chart heading row, chart, caption | 734 x 20, 734 x 256, 734 x 16 | 734 x 20, 734 x 256, 734 x 16 |

Known differences: the host link at the bottom (72 px) is replaced by a back
link, the disclaimer and the data credit (DEV-26); date labels (DEV-28); the
source adds a live "current" point to the Polymarket line, ours ends on the
latest point Polymarket's API returns. The inner layout of the trader card
was not recorded, only its total height.

### Measured parity, profile page

Same probe, same viewport (1024 px), same trader. Source on 2026-11-14 about
23:45 IST, ours on 2026-11-15 00:15 IST. Sizes in px.

| Measure | Source | Ours |
|---|---|---|
| Avatar | 76 x 76 | 76 x 76 |
| Name | 24 px bold | 24 px bold |
| Month strip, collapsed | 864 x 51 | 864 x 51 |
| Strip row | 862 x 48 | 862 x 48 |
| Month label | 80 x 20, 16 below the strip's top | 80 x 20, 16 below the strip's top |
| Day bar | 8 x 16 | 8 x 16 |
| Month strip, expanded | about 747 high | 748.4 high |
| Day cell | 116.3 x 116.3, first at 115 below the strip's top | 116.3 x 116.3, first at 115 below the strip's top |
| P&L history card | 864 x 262 | 864 x 262 |
| Chart area | 830 x 192 | 830 x 192 |
| Category list | 830 x 323, 14 rows | 830 x 323, 14 rows |
| Category row: name, bar, amount | 208 / 502 / 96, 17.5 high | 207.5 / 502.5 / 96, 17.5 high |

Known differences: the category card is 389 px high against 421 because the
"Last 24h" row is not built (DEV-20); everything below the header sits 4 px
higher than on the source, whose header block was not measured in detail;
the expanded calendar is 1.4 px taller. Our colors and copy differ on
purpose.

Assumptions in the code that the source did not let us confirm, each marked in
the code where it lives: the amount at which mobile rows switch to short money
(100,000), the esports threshold (0.5), the Sharpe column heading for periods
other than 1D, and the ROI format. Added in phase 4: Polymarket's 00:00 UTC
points read as the previous day's close, and how a trader on both platforms
is added up (D-042). Added in phase 5: the 20 px cut-off for a
crowded top label (D-044), and the millions unit of the head-to-head labels,
which the source's chart never needed.

### Lighthouse

`npm run lighthouse`: median of three runs per page, Lighthouse 13.6.0,
on the deployed site after the phase 6 deploy (2026-11-15, about 13:25
IST). Scores out of 100; FCP, LCP and TBT are first paint, largest paint and
total blocking time.

| Setting | Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| phone | `/` | 99 | 100 | 77 | 63 | 1.3 s | 1.3 s | 100 ms | 0 |
| phone | `/kalshi` | 100 | 100 | 77 | 63 | 1.1 s | 1.1 s | 60 ms | 0 |
| phone | `/account/ProbabilityDuck` | 100 | 100 | 100 | 63 | 1.0 s | 1.0 s | 50 ms | 0 |
| phone | `/battle` | 100 | 100 | 100 | 63 | 1.0 s | 1.0 s | 60 ms | 0 |
| phone | `/api-docs` | 99 | 100 | 100 | 60 | 0.8 s | 0.8 s | 90 ms | 0 |
| desktop | `/` | 100 | 100 | 77 | 63 | 0.3 s | 0.3 s | 0 ms | 0 |
| desktop | `/kalshi` | 100 | 100 | 77 | 63 | 0.3 s | 0.3 s | 0 ms | 0 |
| desktop | `/account/ProbabilityDuck` | 100 | 100 | 100 | 63 | 0.3 s | 0.6 s | 0 ms | 0 |
| desktop | `/battle` | 100 | 100 | 100 | 63 | 0.3 s | 0.3 s | 0 ms | 0 |
| desktop | `/api-docs` | 100 | 100 | 100 | 60 | 0.2 s | 0.2 s | 0 ms | 0 |

The branch's production build served locally scored the same within a few
points (phone performance 95 to 99) before the deploy.

Before phase 6, on production: accessibility 96 on `/` (touch targets) and
`/api-docs` (contrast); best practices 77 on both boards; 19 profile
prefetches (424 KB) on the home page. Remaining, accepted with reasons: SEO
60 to 63 because pages ask not to be indexed (D-020); best practices 77 on
the boards, from a cookie-deleting header on the data source's picture
routes (D-050); about 3 MB of trader pictures on the home page (D-051). One
earlier median showed a layout shift of 0.8 on desktop `/battle`; three
further runs on the final build showed 0, and its cause was not found.

## Rerun commands

| Check | Command | Last result |
|---|---|---|
| Everything below except the audit and end-to-end, in order | `npm run check` | pass, 2026-11-15 |
| Lint | `npm run lint` | pass, 2026-11-15 |
| Type check | `npm run typecheck` | pass, 2026-11-15 |
| Unit and component tests | `npm run test` | 428 of 428 pass, 2026-11-15 |
| End-to-end, desktop 1440, tablet 768 and phone 390 | `npm run test:e2e` | 202 pass, 23 skipped by design (hover-only checks on the phone, checks that set their own size), 2026-11-15 |
| Colour contrast of every token and calendar shade | part of `npm run test` (`src/app/contrast.test.ts`) | 34 of 34 pass, 2026-11-15 |
| Accessibility (axe), keyboard and measured parity | part of `npm run test:e2e` | see the end-to-end row |
| Lighthouse, deployed site | `npm run lighthouse` | performance 99 to 100, accessibility 100 on every page, 2026-11-15 |
| Build during an upstream outage, stale cache | `npm run check:outage` | pass in 20 s (failed, exit 1 after 185 s, before BUG-050 and BUG-054), 2026-11-15 |
| Asset check | `npm run check:assets` | pass, 160 files, 2026-11-15 |
| CI on GitHub | push to `main` | pass, both jobs (quality, end-to-end at three sizes with axe, keyboard and parity), 2026-11-15, phase 6 merge |
| Live data comparison | see note 3 above | 584 of 584 equal, 2026-11-14 |
| Production build | `npm run build` | pass, 2026-11-15 |
| Production dependency audit | `npm audit --omit=dev` | 0 vulnerabilities, 2026-11-15 |

Two checks were also run by hand to make sure the suite can fail:

- **Planted violation.** A file naming the source site was added under `src/`;
  `npm run check:assets` exited 1 and named the file and line. Removed again.
- **Mutations.** Making the first sort click descending failed 6 tests; letting
  a click on a trader's name also trigger the row failed 1. Both were reverted.

The layout numbers above come from a probe run in the browser console at the
stated viewport. Since phase 6 the same numbers are asserted by
`e2e/parity.spec.ts` (D-052). In CI, on Linux, the widths set by text are
skipped, because the system font differs from the Mac they were measured on;
every size set by CSS is checked there too.

**Independent review.** A reviewer agent that had not written the code read
the phase 2 diff: 19 findings, 10 real defects fixed with tests (BUG-006 to
BUG-015), the rest answered in `docs/BUGLOG.md`. After the fixes: 150 tests
pass, a fresh page load logs no console errors, and at 390 px the optional
columns stay hidden with no horizontal scroll.

**Phase 4 review.** A reviewer agent read the phase 4 diff: 11 findings, 8
real defects fixed with tests (BUG-042 to BUG-049). After the fixes: 355
unit tests and 48 end-to-end tests pass, and the Polymarket profile's last
day reads +$13,493 against the trader record's 1-day P&L of +$13,142.

**End-to-end suite** (`e2e/`): boards, filters, search, paging, profiles of
both platforms with calendar, chart and categories, the head-to-head page,
the 404 and error pages, the disabled form, the saved theme, the API routes,
the security headers, no profile prefetching, axe, keyboard and measured
parity, at phone, tablet and desktop size. It runs offline: every request to
another host is aborted.
