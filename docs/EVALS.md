# Evals plan

How we verify that the replica matches the source in structure and behavior,
and that it works correctly. Branding differences are expected and excluded:
see `docs/DECISIONS.md`, D-007.

**Status (2026-11-14, end of phase 3):** the three boards, profiles and the
simple pages are built and checked against live data in the browser. End-to-
end automation, axe and Lighthouse are still to come. A cell stays "not run"
until its check has actually been run.

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
| `/` | pass (1) | pass (2) | pass (3) | pass (4) | ours only (5) | ours only (5) | pass, unit (6) | not run |
| `/polymarket` | pass | pass | pass (3) | not run | not run | not run | pass, unit (6) | not run |
| `/kalshi` | pass (7) | pass (7) | pass (7) | not run | not run | not run | pass, unit (6) | not run |
| `/account/[id]` | partial (8) | pass (8) | pass (8) | not run | not run | not run | pass, unit (8) | not run |
| `/battle` | not built | not built | not built | not built | not built | not built | not built | not built |
| `/api-docs` | pass (9) | pass (9) | pass (9) | not run | not run | not run | not run | not run |
| `/submit` | pass (10) | pass (10) | n/a | not run | not run | not run | n/a | not run |
| `/terms`, `/privacy` | pass | n/a | n/a | not run | not run | not run | n/a | not run |

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
   failure is thrown to the error boundary, so it is never cached. Month strip, chart and categories are
   phase 4, hence "partial".
9. Both documented routes return live data; an unknown period returns 404.
10. The form's fieldset and button are disabled; a click on Submit fires no
    submit event; the form has no action.

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

Assumptions in the code that the source did not let us confirm, each marked in
the code where it lives: the amount at which mobile rows switch to short money
(100,000), the esports threshold (0.5), the Sharpe column heading for periods
other than 1D, and the ROI format.

## Rerun commands

| Check | Command | Last result |
|---|---|---|
| Everything below except the audit, in order | `npm run check` | pass, 2026-11-14 |
| Lint | `npm run lint` | pass, 2026-11-14 |
| Type check | `npm run typecheck` | pass, 2026-11-14 |
| Unit and component tests | `npm run test` | 242 of 242 pass, 2026-11-14 |
| Asset check | `npm run check:assets` | pass, 109 files, 2026-11-14 |
| CI on GitHub | push to `main` | pass, 2026-11-14 |
| Live data comparison | see note 3 above | 584 of 584 equal, 2026-11-14 |
| Production build | `npm run build` | pass, 2026-11-14 |
| Production dependency audit | `npm audit --omit=dev` | 0 vulnerabilities, 2026-11-14 |

Two checks were also run by hand to make sure the suite can fail:

- **Planted violation.** A file naming the source site was added under `src/`;
  `npm run check:assets` exited 1 and named the file and line. Removed again.
- **Mutations.** Making the first sort click descending failed 6 tests; letting
  a click on a trader's name also trigger the row failed 1. Both were reverted.

The layout numbers above come from a probe run in the browser console at the
stated viewport. It will become a Playwright test in the evals phase.

**Independent review.** A reviewer agent that had not written the code read
the phase 2 diff: 19 findings, 10 real defects fixed with tests (BUG-006 to
BUG-015), the rest answered in `docs/BUGLOG.md`. After the fixes: 150 tests
pass, a fresh page load logs no console errors, and at 390 px the optional
columns stay hidden with no horizontal scroll.

End-to-end and accessibility commands are added here when those tools are
added.
