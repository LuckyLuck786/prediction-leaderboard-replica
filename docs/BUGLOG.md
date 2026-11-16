# Bug log

Bugs found in AI-written code during this build, written down at the moment
they were found. Real bugs only. If this log is short, that is because few
were found, not because some were left out.

Findings from reviewing the starter template (dependency advisories, an
unwanted workflow) are not bugs in code we wrote. They are recorded in
`docs/DECISIONS.md`.

## Entry format

| Field | Meaning |
|---|---|
| ID | `BUG-001`, `BUG-002`, ... |
| Time | Date and time found (IST) |
| Feature / file | Where the bug lived |
| What the AI wrote | The faulty code or behavior, briefly |
| Symptom | What went wrong and how it showed |
| How it was caught | test, typecheck, lint, review, visual diff, runtime error or manual check |
| Root cause | Why the code was wrong |
| Fix commit | Short hash of the commit that fixed it |
| Prevention | Test added, or rule added to `CLAUDE.md` |

## Entries

Times are IST on 2026-11-14 and approximate to a few minutes. "Fix commit" is
the commit that contains the corrected code. Bugs caught before their code was
first committed name that first commit.

### BUG-001 Filter chips two pixels wider than the source

- **Time:** about 17:58
- **Feature / file:** home controls, `leaderboard-controls.tsx`
- **What the AI wrote:** every chip had a one-pixel border (transparent when
  inactive) so active and inactive chips would be the same size.
- **Symptom:** `1D` measured 43 px wide against 40.7 px on the source, `ALL`
  51 against 49.4, and "Show more" 38 px high against 36. Everything to the
  right of the period buttons sat 6 px too far right.
- **How it was caught:** visual diff by measurement. The same layout probe
  that recorded the source was run on the local page and the numbers compared.
- **Root cause:** an assumption. The source's chips look bordered in its
  class names, but the computed border is zero; I built from the idea, not
  from the measurement.
- **Fix commit:** `4caaca4`
- **Prevention:** borders removed; control sizes are now part of the measured
  parity table in `docs/EVALS.md`.

### BUG-002 Filter chips in the wrong group, labels one size too big

- **Time:** about 22:10
- **Feature / file:** home controls, `leaderboard-controls.tsx`
- **What the AI wrote:** "linked", "No sports" and "No esports" as siblings
  of the platform group, vertically centered, with 14 px labels.
- **Symptom:** "No sports" measured 79.1 px against 71.3 px on the source and
  sat 16 px lower than it should.
- **How it was caught:** visual diff by measurement, then re-reading the
  recorded accessibility tree, which showed the label inside its own smaller
  element.
- **Root cause:** the source nests these chips in the same row as the platform
  group, above the optional-column toggles, and sets their labels at 12 px. I
  had flattened the structure.
- **Fix commit:** `4caaca4`
- **Prevention:** chip positions and sizes added to the measured parity table.

### BUG-003 Active optional-column chip was unreadable

- **Time:** about 22:11
- **Feature / file:** home controls, `leaderboard-controls.tsx`
- **What the AI wrote:** the Sharpe, Win% and ROI chips always carried the
  muted text color.
- **Symptom:** when one was switched on, muted grey text sat on the primary
  background: very low contrast.
- **How it was caught:** review of my own diff before the visual check.
- **Root cause:** a later class overrode the active state's text color.
- **Fix commit:** `4caaca4`
- **Prevention:** muted color applied only when the chip is off. Automated
  contrast checks (axe) are planned for the evals pass.

### BUG-004 Mobile rows six pixels too short

- **Time:** about 22:12
- **Feature / file:** home table, `leaderboard-table.tsx`
- **What the AI wrote:** the day-mover line with a 10 px font and no explicit
  line height.
- **Symptom:** rows measured 43 px at 390 px wide against 49 px on the source.
- **How it was caught:** visual diff by measurement at the mobile width.
- **Root cause:** Tailwind v4 sets line height as a ratio, so the small line
  inherited 14 px. The source's line inherits a fixed 20 px.
- **Fix commit:** `4caaca4`
- **Prevention:** explicit line heights on that line; mobile row height added
  to the measured parity table.

### BUG-005 Asset check crashed on a deleted file and ignored new files

- **Time:** about 22:13
- **Feature / file:** `scripts/check-assets.mjs`
- **What the AI wrote:** the list of files to check came from `git ls-files`,
  and each one was read from disk.
- **Symptom:** `npm run check:assets` died with `ENOENT` on
  `public/images/.gitkeep`.
- **How it was caught:** runtime error on the first real run.
- **Root cause:** `git ls-files` lists the index. A file deleted in the
  working tree but not yet committed is still listed. The same choice also
  meant brand-new files were not checked until after they were committed,
  which is too late for a check meant to stop a bad commit.
- **Fix commit:** `0560c93`
- **Prevention:** missing paths are skipped, untracked non-ignored files are
  included, and two tests cover it. A planted violation was used to confirm
  the check fails when it should.

### Found by the independent review pass (2026-11-14, about 22:30)

A separate reviewer agent, which had not written the code, read the whole
phase 2 diff against the spec and `CLAUDE.md`. It reported 19 findings: 1
high, 6 medium, 12 low, and none on security. Each was checked against the
code before acting. The ones below were real defects and are fixed. The rest
are listed at the end with what was done about them.

### BUG-006 Trader count misstated the size of the board (high)

- **Feature / file:** home header, `snapshot.ts`, `leaderboard-view.tsx`
- **What the AI wrote:** the count used the length of the saved snapshot,
  and the snapshot loader dropped the upstream total that the snapshot file
  records.
- **Symptom:** the page said "48 of 60 traders" while upstream listed 581 for
  that period. The snapshot keeps only the 50 best and 10 worst, and the page
  did not say so.
- **How it was caught:** independent review.
- **Root cause:** two facts, "rows we hold" and "rows upstream has", were
  collapsed into one.
- **Fix commit:** `ac7dc98`
- **Prevention:** the snapshot banner states "holds 60 of the 581 traders
  listed for this period", per period, with a component test; a snapshot test
  checks the recorded total.

### BUG-007 Footer linked six pages that do not exist

- **Feature / file:** `site-footer.tsx`
- **What the AI wrote:** footer links to the board, submit, API, terms and
  privacy pages ahead of building them.
- **Symptom:** every footer link returned 404. The footer test checked only
  the text, so it passed.
- **How it was caught:** independent review.
- **Root cause:** the footer was written from the spec's final page list,
  not from the pages that exist.
- **Fix commit:** `1d40f62`
- **Prevention:** links are added in the same commit as their page; a test
  fails for any footer link without a page file.

### BUG-008 Optional columns could get stuck on a phone

- **Feature / file:** `leaderboard-table.tsx`
- **What the AI wrote:** the Sharpe, Win% and ROI columns had no breakpoint,
  while their toggles are hidden below 640 px.
- **Symptom:** switch a column on at desktop width, narrow the window, and
  the column stays with no control to remove it.
- **How it was caught:** independent review; then confirmed in the browser.
- **Root cause:** the toggle's breakpoint was not applied to what it toggles.
- **Fix commit:** `ac7dc98`
- **Prevention:** a component test checks the responsive rule on the column.

### BUG-009 Asset check could be dodged by letter case or a file name

- **Feature / file:** `scripts/check-assets.mjs`
- **What the AI wrote:** case-sensitive folder matching, and a name check on
  file contents only.
- **Symptom:** `Public/Sites/logo.svg` passed, and so did a file whose path
  named the source site.
- **How it was caught:** independent review.
- **Root cause:** macOS disks ignore letter case by default; the check did
  not. Paths were never searched.
- **Fix commit:** `ace1d2e`
- **Prevention:** two tests, one for each hole.

### BUG-010 Repeated trader ids were not handled

- **Feature / file:** `schema.ts`
- **What the AI wrote:** every valid upstream entry became a row.
- **Symptom:** none yet: the current data has no repeats. Two entries with
  the same wallet would share a React key and a profile route, and rows could
  vanish or duplicate on re-sort.
- **How it was caught:** independent review.
- **Root cause:** the id's uniqueness was assumed, not enforced.
- **Fix commit:** `ac7dc98`
- **Prevention:** repeats are dropped and counted; tests cover the parser and
  check the snapshot has unique ids.

### BUG-011 to BUG-015 Smaller defects from the same review

| ID | File | Symptom | Fix commit | Test added |
|---|---|---|---|---|
| BUG-011 | `format.ts` | A loss under 50 cents showed as "-$0" | `ac7dc98` | yes |
| BUG-012 | `format.ts` | Initials cut a letter outside the basic plane in half | `ac7dc98` | yes |
| BUG-013 | `theme.ts` | With storage blocked, the theme script and toggle threw | `1d40f62` | yes |
| BUG-014 | `leaderboard-table.tsx` | A day mover shown as a picture had no text for screen readers | `ac7dc98` | yes |
| BUG-015 | `leaderboard-controls.tsx` | The trader count was a live region and re-announced on every keystroke | `ac7dc98` | no, markup removed |

### BUG-016 A test used URL objects with Node's file functions under jsdom

- **Time:** about 22:35
- **Feature / file:** `site-footer.test.tsx`, written while fixing BUG-007
- **What the AI wrote:** paths built as `new URL(..., import.meta.url)` and
  passed to `existsSync` and `readFileSync`.
- **Symptom:** `TypeError: The URL must be of scheme file`, in jsdom only.
- **How it was caught:** the test run.
- **Root cause:** in a jsdom test the global `URL` is jsdom's, which Node's
  file functions refuse.
- **Fix commit:** `1d40f62`
- **Prevention:** plain paths via `fileURLToPath`; the test was also run from
  another working directory.

### Review findings not treated as bugs

- **Esports rule hides only traders without an X account.** Kept: it matches
  the source's own tooltip, observed on 2026-11-14. A comment in `query.ts`
  now cites it.
- **Footer has no X account link (HOME-21).** Kept out: that link points to
  the source's own account. Recorded as DEV-13 in the spec.
- **Snapshot script does not validate with Zod.** The script is plain Node and
  cannot import the TypeScript schema. The schema test does the validation and
  CI runs it. A request timeout was added (`c69e629`).
- **Loading the snapshot throws on a bad file.** Kept on purpose: the snapshot
  is our own committed file, so a broken one should stop the build, not ship.
  It is now validated with Zod before use (`ac7dc98`).
- **ROI tooltip, duplicated labels, hard-coded score weights.** Wording and
  single-source fixes, not defects; done in `ac7dc98`.

## Phase 3 (2026-11-14, about 23:00 to 23:40)

### BUG-017 Theme script would have flashed dark in production

- **Feature / file:** `src/app/layout.tsx`
- **What the AI wrote:** to silence a development warning, the theme script
  was moved to `next/script` with `strategy="beforeInteractive"`.
- **Symptom:** none shipped. In the production HTML the script sat at the
  end of `<body>`, queued, and ran only after the app's own scripts loaded:
  a visitor with a saved light theme would have seen the dark page first.
- **How it was caught:** inspecting the production build's HTML before
  committing, instead of trusting the strategy's name.
- **Root cause:** for inline scripts in this Next.js version, the strategy
  queues the code rather than placing a blocking tag in the head.
- **Fix commit:** `3db08b4` (plain script in `<head>`), refined in `efcfcd1`
- **Prevention:** decision D-028; the theme check in the evals now loads a
  page with a saved light theme.

### BUG-018 Saved light theme lost on a 404 page

- **Feature / file:** `src/features/shell/theme.ts`, `theme-script.tsx`
- **What the AI wrote:** the theme was applied only by the head script.
- **Symptom:** with "light" saved, `/account/unknown` showed the dark theme.
- **How it was caught:** browser check of the 404 page with a saved theme.
- **Root cause:** on a not-found page React renders the root layout in the
  browser and resets the class on `<html>` to the server's dark default,
  after the head script has already run.
- **Fix commit:** `efcfcd1`
- **Prevention:** the saved theme is re-applied once mounted; a unit test
  covers restoring it after a reset.

### BUG-019 React error from a client-rendered script tag

- **Feature / file:** `src/app/layout.tsx`
- **What the AI wrote:** the inline theme script as a plain `<script>`
  element in the root layout.
- **Symptom:** "Encountered a script tag while rendering React component"
  in the console. Decision D-028 first called this Fast Refresh noise only;
  that was wrong: it also appeared on a fresh load of a 404 page.
- **How it was caught:** reading the console after a fresh 404 load.
- **Root cause:** React never runs a script it creates in the browser and
  says so whenever it renders one there, which the 404 page triggers.
- **Fix commit:** `efcfcd1`
- **Prevention:** the script is rendered only into the server HTML, then
  dropped after hydration; D-028 corrected.

### BUG-020 to BUG-022 Caught by lint and by the test run

| ID | File | What was wrong | How caught | Fix commit |
|---|---|---|---|---|
| BUG-020 | `leaderboard-view.tsx`, `kalshi-view.tsx` | Manual `useMemo` on values the React Compiler could not prove stable, so it skipped optimising both components | lint | `ce347b9`, `d12ae00` |
| BUG-021 | `leaderboard-view.test.tsx` | The loading test looked for placeholder rows by role, but they are hidden from assistive technology, so it found none | test run | `ce347b9` |
| BUG-022 | `src/app/revalidate.test.ts` | A variable named `module`, which Next.js reserves | lint | `513f444` |

### Found by the phase 3 independent review (2026-11-14, about 23:50)

A reviewer subagent that had not written the code read the phase 3 diff:
16 findings and 1 question, 3 rated medium. Each was checked against the
code; the two marked "confirmed" were also reproduced by hand before fixing.

| ID | File | Defect | Fix |
|---|---|---|---|
| BUG-023 | `src/app/account/[id]/page.tsx` | An upstream failure rendered an "unavailable" page that was then cached for five minutes for every visitor of that trader | Thrown instead; `error.tsx` shows the message with a retry, nothing is cached |
| BUG-024 | `src/features/profile/model.ts` | The id `..` passed validation and turned `/api/trader/..` into a request for the upstream API root (confirmed) | Dot-only ids refused; tests for `.`, `..`, `...` |
| BUG-025 | three schemas | Three URL cleaners disagreed: a relative picture showed on the Kalshi board but became initials on a profile | One shared module, `src/upstream/urls.ts`, with tests |
| BUG-026 | `src/features/kalshi/schema.ts` | A Kalshi username our profile route rejects still got a local profile link, which would 404 | Local link only when the username is a valid profile id |
| BUG-027 | `src/features/leaderboard/format.ts` | `formatProfileMoney(999960)` printed `+$1000.0K` (confirmed) | Unit chosen on the rounded figure; boundary tests |
| BUG-028 | `src/features/leaderboard/format.ts` | Profile cards used the title's two-decimal millions (`+$1.20M`) where the source shows `+$1.2M` | Two named formatters, card and title |
| BUG-029 | `src/features/profile/schema.ts` | A score of null made the whole profile "unavailable" | Score fields optional; only the score card is dropped |
| BUG-030 | both board views | After a failed load the count still said "Loading traders" | Separate "No traders loaded" label, tested |
| BUG-031 | `leaderboard-view.tsx` | A live "Today" total could sit next to snapshot rows | The total shows only beside live rows, tested |
| BUG-032 | `kalshi-view.tsx` | Every Kalshi visit fetched three other 1,000-row boards, against KAL-07 | Fetched when selected, as on the source, tested |

How they were caught: independent review. Fix commit for all ten: `d93c875`.

Not treated as defects, with the reason:

- **Pictures load from upstream hosts in the browser.** Owner decision Q-03 /
  D-013; D-013 now states the exemption explicitly and `CLAUDE.md` says the
  "browser never calls upstream" rule is about data.
- **Profile month strip, chart and categories missing.** Planned for phase 4
  (D-031, DEV-17); the parity matrix marks profiles "partial".
- **"Sharpe 3D" heading over the 1D Sharpe value.** Checked against the
  source: its "Sharpe 3D" column showed 0.11 for a trader whose `sharpe1d` is
  0.11. Field and heading both match the source.
- **Period lists repeated in `source.json` and in code.** Kept: the code needs
  literal types the JSON cannot give, and a test fails if the two differ.
- **A magic number for skeleton rows.** Cleaned up (named constant), not a
  defect.

## Phase 4 (2026-11-14 23:45 to 2026-11-15 00:20 IST)

Times in this section are IST. Every phase 4 bug was caught before its code
was first committed, so "Fix commit" names that first commit.

### BUG-033 Calendar shades scaled to the month's biggest day

- **Time:** 2026-11-14, about 23:50
- **Feature / file:** month strip and calendar, `src/features/profile/history.ts`
- **What the AI wrote:** each day's shade as a share of the month's largest
  gain or loss, with a separate "worst day" shade, inferred from how the
  source's colors looked.
- **Symptom:** against the recorded November month, 10 November came out
  as a medium loss instead of a light one and 11 November as a strong loss
  instead of a medium one.
- **How it was caught:** test. The first test of the function used the
  source's recorded day shades as its expected values, and failed.
- **Root cause:** the rule was guessed from appearance instead of read from
  the numbers. Every observed shade fits fixed dollar steps (D-037).
- **Fix commit:** `eab2de9`
- **Prevention:** every day shade observed on the source is a test case.

### BUG-034 A test expected `-$4.35K` where the source shows `-$4.34K`

- **Time:** 2026-11-14, about 23:53
- **Feature / file:** `src/features/leaderboard/format.test.ts`
- **What the AI wrote:** an expected value for -4,345 rounded by hand to
  `-$4.35K`.
- **Symptom:** the month-total format test failed; the code printed
  `-$4.34K`, which is what the source shows for the same month.
- **How it was caught:** test run, checked against the value recorded on the
  source.
- **Root cause:** in floating point 4.345 is 4.34499..., so it rounds down.
  The test was wrong, the code was right.
- **Fix commit:** `1f4a581`
- **Prevention:** expected strings in format tests come from recorded source
  values and are marked "seen".

### BUG-035 to BUG-036 Chart axis and calendar sums

| ID | Time | File | What was wrong | How caught | Fix commit |
|---|---|---|---|---|---|
| BUG-035 | 23:58 | `history.ts`, `pnl-chart.tsx` | The value axis ran from the data's own minimum to its maximum (`+$89K` to `+$1.1M`) where the source shows `-$12K` to `+$1.2M`, and the last date label was cut off at the right edge | visual diff against the recorded source labels, then a test with both recorded source axes as expected values | `eab2de9`, `bc342de` |
| BUG-036 | 2026-11-15 00:00 | `history.ts` | A day after a gap in the history took the whole change since the last recorded day, so monthly totals differed from the source's (for example October: +$55,262 against +$57,523) | computing all eleven 2026 monthly totals from the real history and comparing them with the totals recorded on the source | `eab2de9` |

Root causes: the axis was written as "nice numbers around the data" without
looking at how the source pads it; the daily rule assumed a change is always
"close minus previous close". The source pads the range by 10% (D-038) and
counts a day only when the day before has data (D-036). Prevention: both
recorded axes and the consecutive-day rule are unit tests.

### BUG-037 to BUG-041 Caught by lint, typecheck and the layout probe

| ID | Time | File | What was wrong | How caught | Fix commit |
|---|---|---|---|---|---|
| BUG-037 | 23:55 | `src/app/account/[id]/page.tsx` | `Date.now()` read during render to decide "today", which can differ between server and browser | lint (React Compiler purity rule) | `a945cd3`, `bc342de` |
| BUG-038 | 00:00 | `month-strip.tsx` | Calendar titles used the board format, `$-10,863`, where the profile shows `-$10,863` | browser check against the recorded source titles | `1f4a581`, `bc342de` |
| BUG-039 | 00:04 | `e2e/test.ts` | The offline test fixture was declared so that every test's arguments were typed `never` | typecheck | `6351b05` |
| BUG-040 | 00:15 | `category-card.tsx` | Category rows 20 px high against 17.5 px on the source, making the list 35 px taller | layout probe at the source's viewport | `bc342de` |
| BUG-041 | 00:15 | `profile-view.tsx` | The Kalshi note was printed under the chart heading, making the card 278 px high against 262 px; the source keeps it behind an info icon | layout probe at the source's viewport | `bc342de` |

### Found by the phase 4 independent review (2026-11-15, about 00:20)

A reviewer subagent that had not written the code read the phase 4 diff:
11 findings, 2 rated high and 2 medium. Each was checked against the code
and the recorded data before fixing.

| ID | File | Defect | Fix |
|---|---|---|---|
| BUG-042 | `history.ts` | For a trader on both platforms, the Kalshi series counted as 0 before its first point, so the day Kalshi tracking began showed the trader's whole Kalshi total (+$90,139 in the recorded history) as a one-day gain, marked "best", with a cliff in the chart (confirmed from the fixture) | Calendar adds each series' own daily changes; the chart holds a late series at its first value; tests |
| BUG-043 | `history-data.ts` | Polymarket's daily points are stamped 00:00 UTC and hold the total as the day begins, but were filed as that day's close, so every Polymarket calendar day showed the previous day's result. For the recorded trader the last day read +$2,987 where the trader record's own 1-day P&L is +$13,142 (confirmed) | A point at exactly 00:00 UTC is filed as the previous day's close; the last day now reads +$13,493; test with the recorded points |
| BUG-044 | `history.ts` | The chart's tick loop never ended when the data range was below the values' float precision, which would hang the page render on the server (reproduced by the reviewer) | Near-flat ranges drawn flat; the loop counts ticks; regression test with the reproducing pair |
| BUG-045 | `history-data.ts` | History timestamps were not range-checked; one far outside any real date crashed date formatting outside the error handling and took the whole profile to the error page (reproduced by the reviewer) | Whole numbers between 2015 and 2100 only, in the right unit for each API; a bad record makes the history "unavailable" instead; tests |
| BUG-046 | `profile-view.tsx` | Every trader without documented history saw "not available for Hyperliquid traders", including a Kalshi trader without a username | One message that fits every case |
| BUG-047 | `origins.ts` | The origin overrides accepted any URL, including remote `http:` and schemes without an origin, against the https-only data rule | https only, or http on localhost; tests |
| BUG-048 | `e2e/profile.spec.ts` | "404 without asking upstream" would also pass if the app did ask, because the fixture server answers 404 too | Title now claims only the 404; the no-request part stays with the unit tests of `getProfile`, which do check it |
| BUG-049 | `schema.ts` | Wallets were de-duplicated by exact text, so one address in two letter cases would be fetched twice and its P&L counted twice | Lowercased before de-duplicating; test |

How they were caught: independent review. All eight were caught before the
code was first committed. Fix commits: BUG-042 in `eab2de9` and `a945cd3`;
BUG-043, BUG-045 and BUG-049 in `a945cd3`; BUG-044 in `eab2de9`; BUG-046 in
`bc342de`; BUG-047 in `e13ba10`; BUG-048 in `6351b05`.

Not treated as defects, with the reason:

- **A degraded history or category card is cached for five minutes.** True,
  and kept on purpose: the rest of the profile stays available, which
  matters more than five minutes of a missing card. Recorded as D-041.
- **`e2e/fixtures/` allowed to name the source.** No fixture names it, so the
  entry was removed rather than widening rule 5.
- **Two symbols left unused by this phase, a hard-coded dash, a comment
  pointing at a note that did not exist yet.** Clean-ups, done in the same
  commit.

## Phase 5 (2026-11-15, 00:35 to 10:30 IST)

### BUG-050 A production build failed while the upstream API was down

- **Time:** 2026-11-15, about 00:56
- **Feature / file:** `src/upstream/client.ts`
- **What the AI wrote (phase 3):** every upstream request used Next.js's
  fetch cache (`next: { revalidate: 300 }`) and an 8-second abort signal.
- **Symptom:** with the upstream unreachable, `npm run build` stopped after
  three 60-second attempts on `/api/boards/30d` and `/api/kalshi/all`. A push
  to `main` during an outage would have failed its Vercel deployment.
- **How it was caught:** the upstream went down during this phase, so the
  full check was run on purpose while it was unreachable.
- **Root cause:** when a cached fetch is stale, Next.js serves it and
  refreshes it in the background without passing the request's signal
  (`patch-fetch.js`: "don't pass through signal when revalidating"). The
  local build reused earlier builds' cache, and Vercel restores the same
  cache between builds, so the refresh waited on a dead connection and the
  build waited on the refresh. Confirmed by building once with the cache
  moved aside: it passed in 16.5 s.
- **Fix commit:** `8499c2b`. The first fix did not work; see BUG-054.
- **Prevention:** upstream fetches use `cache: "no-store"` and every route
  that reads upstream exports `dynamic = "force-static"` with its
  five-minute `revalidate` (D-047); a test fails if a route lacks either.
  `npm run check:outage` repeats the outage with a stale cache: it failed
  (exit 1 after 185 s) before the fix and passes (20 s) after it.

### BUG-051 to BUG-053 Head-to-head chart and layout

| ID | Time | File | What was wrong | How caught | Fix commit |
|---|---|---|---|---|---|
| BUG-051 | 10:18 | `comparison.ts`, `history.test.ts` | The chart padded its value range by 10%, as the profile chart does, and its axis test fed in a data range worked backwards from the source's labels, so the test could not fail | Replacing the made-up range with the pair's real histories cut at the moment the source was captured: the labels came out $-64.5K to +$692.1K against the source's $-96.0K to +$723.6K. The gap on both ends is 15% of the range, so this chart pads 15% | `cf44af6`, test data in `292820f` |
| BUG-052 | 00:51 | `battle-view.tsx` | When the comparison was unavailable, its message box was 212 px high, so the card would jump by 44 px when the chart returned | layout probe of the page while the upstream was down | `cf44af6` |
| BUG-053 | 10:18 | `battle-view.tsx` | Subtitle 24 px high against 22 on the source; trader card 270 against 272 | layout probe at the source's viewport | `cf44af6` |

### Found by the phase 5 independent review (2026-11-15, about 10:35)

A reviewer subagent that had not written the code read the phase 5 diff: 6
findings, 1 rated high. Each was checked; the high one was first reproduced.

| ID | File | Defect | Fix |
|---|---|---|---|
| BUG-054 | `src/upstream/client.ts` | The first fix for BUG-050 only removed `next.revalidate`. During a build Next.js still caches a fetch with no cache option, under the route's revalidate time, and refreshes it without the signal, so the build would still have failed. The check that "proved" the fix copied the cache back with `cp -R`, which reset the files' times, so the entries looked fresh and the stale path never ran | Reproduced properly first (stale times kept, a server that never answers: exit 1 after 185 s), then `cache: "no-store"` plus `dynamic = "force-static"` on the seven routes; the same reproduction passes in 20 s and is now `npm run check:outage` |
| BUG-055 | `src/features/battle/data.ts` | Outside a build, one failed request (a 429, a timeout) made the page cache a degraded version for five minutes | Degrades only during a build; otherwise it throws, so Next.js keeps serving the last complete page and retries; an error page covers the case of no complete page at all |
| BUG-056 | `battle-chart.tsx` | The hover dot used the previous point's value at the pointer's time, so it could sit about 13 px off the drawn line on a day that moved a lot | Each dot and value now come from that line's nearest data point; one shared nearest-point search for both charts, tested |
| BUG-057 | `e2e/battle.spec.ts` | The hover test only looked for the two names, which the readout prints even without values | It now requires an amount after each name |

How they were caught: independent review. All four were caught before the
code was first committed. Fix commits: BUG-054 in `8499c2b`; BUG-055 in
`cf44af6`; BUG-056 in `a1ad1ac` and `cf44af6`; BUG-057 in `292820f`.

Not treated as defects, with the reason:

- **The pair was written in two places** (the app and the fixture script).
  A one-source-of-truth clean-up: both now read `pair.json`.
- **The dev server now asks upstream on every reload.** True and accepted:
  a page makes at most four requests, well inside the documented limits.
  Recorded in D-047.

### BUG-058 An end-to-end test read the profile chart before it was drawn

- **Time:** 2026-11-15, about 11:15
- **Feature / file:** `e2e/profile.spec.ts` (written in phase 4)
- **What the AI wrote:** the test read the chart's labels with
  `allTextContents()`, which takes whatever is on the page at that instant.
- **Symptom:** the CI end-to-end job failed on the phase 5 merge: 0 value
  labels instead of 5, on both attempts. It had passed on CI before and
  passes locally.
- **How it was caught:** CI. The page snapshot saved with the failure,
  taken a moment later, shows the chart with all five labels, so the test
  had read the chart before it was drawn: the chart draws only once it knows
  its width, after the page has loaded.
- **Root cause:** a read that does not wait, racing a chart that renders
  after load. Throttling the CPU 20 times locally did not make it fail, so
  the race depends on the CI runner's timing.
- **Fix commit:** `972e0bb`
- **Prevention:** chart checks use assertions that wait (`toHaveCount`), in
  both chart tests.

## Phase 6 (2026-11-15, 11:30 to 13:00 IST)

Every phase 6 bug was caught before its code was first committed, so "Fix
commit" names that first commit. IDs follow the order they were cited in
code, which is close to the order they were found.

### Found by the new evals

| ID | Time | File | What was wrong | How caught | Fix commit |
|---|---|---|---|---|---|
| BUG-059 | 11:36 | `globals.css` | Light theme: platform badges and score chips at 4.13 to 4.45:1 against their backgrounds; dark theme: muted text at 4.3:1 on the lighter "secondary" surface (the API page's "JavaScript" label). WCAG AA needs 4.5:1 | axe | `e09b60f` |
| BUG-060 | 11:36 | `leaderboard-table.tsx` | On phones the platform and X badge links in each row were 20 px and 2 px apart, below WCAG 2.5.8's 24 px target or spacing | axe | `e09b60f` |
| BUG-061 | 11:36 | `api-docs/page.tsx` | The example code block scrolls sideways on a phone but could not be reached from the keyboard | axe | `e09b60f` |
| BUG-062 | 11:41 | `category-card.tsx` | Category rows measured 18 px in Playwright's Chromium 156 against 17.5 px on the source and in the in-app browser: the 12 px market count on a 14 px line made some Chromium versions round the line up | the layout probe turned into a test | `e445ca8` |
| BUG-063 | 11:49 | `leaderboard-table.tsx`, `kalshi-view.tsx` | Every profile link on a board was prefetched as it scrolled into view: 19 profile pages (424 KB) on one home visit, each rendered on our server with its upstream requests. The source loads a profile only when it is opened | Lighthouse's network list, then an end-to-end test that failed with 12 and 8 prefetches before the fix | `2863d1f` |
| BUG-066 | 11:57 | `urls.ts`, `trader-avatar.tsx` | To avoid a third-party cookie, pictures from the data source were requested anonymously by host; its wallet pictures do not allow that, so those traders lost their picture | Lighthouse console errors on the local production build | change dropped (D-050) |

### Found by the phase 6 independent review (2026-11-15, about 12:05)

A reviewer subagent that had not written the code read the phase 6 diff: 10
findings, 2 rated high. Each was checked against the code before fixing.

| ID | File | Defect | Fix |
|---|---|---|---|
| BUG-064 | `tone-styles.ts`, `month-strip.tsx` | Calendar day amounts were drawn in their shade's colour on that shade's own tint: 1.8 to 2.6:1. The axe runs never opened the calendar, so they could not see it | Shaded cells use the plain text colour; dark-theme shades capped at 52%, light top shades at 65%; axe now audits the open calendar in both views; a token contrast test covers every shade (it failed at 3.28:1 when the old shade was put back) |
| BUG-065 | `globals.css`, `focus.ts` | The focus ring was the browser default in a half-transparent colour (about 2.2 to 3:1), and inside containers that clip (board names and badges, the code block) it was cut off. The keyboard test only checked that a ring style was set | One 2 px ring in the full ring colour everywhere, drawn inside the element where its container clips; the test now fails on a missing, faint or cut-off ring |
| BUG-067 | `privacy/page.tsx` | The anonymous picture requests of BUG-066 send an `Origin` header, so the privacy page's "sends no information about this site" was no longer true | Anonymous requests removed; the page's wording is true again (D-050) |
| BUG-068 | `e2e/parity.spec.ts` | The expanded calendar's height was compared with a five-week month's, but the calendar opens on the current month: the test would fail in January 2027 with no code change | Everything but the day grid is compared |
| BUG-069 | `e2e/leaderboard.spec.ts` | The no-prefetch test scrolled without waiting, so only the first screen of rows was checked, and the Kalshi board not at all | Scrolls to the last row, waits a named settle time, covers both boards |
| BUG-070 | `account/[id]/loading.tsx` | With prefetch off, opening a profile that was not built yet showed nothing until the server answered | A loading skeleton shaped like the profile |
| BUG-071 | `globals.css` | Darkening the light theme's "good" score colour left it 1.11:1 from "strong": the two bands looked the same | "Strong" darkened to stay apart; the contrast test checks the step |
| BUG-072 | `e2e/a11y.spec.ts` | The light-theme runs copied the storage key and never checked the light theme was on screen, so a change could make them test dark and still pass | Key imported from the app; the theme is asserted before each run |
| BUG-073 | `scripts/lighthouse.mjs` | Lighthouse's own packages were installed with install scripts on, against the project rule, and a missing score printed as 0 | Installs without scripts; a missing score stops the script |

How they were caught: independent review. Fix commits: BUG-064, BUG-065
and BUG-071 in `e09b60f`; BUG-070 in `2863d1f`; BUG-068, BUG-069 and BUG-072
in `23178a7`; BUG-073 in `e736d6a`. BUG-067 never reached a commit: the
change that caused it was dropped before committing.

Not treated as a defect: the review's tenth point, code citing bug and
decision numbers before the log had them. These entries are that fix.

## Phase 7 (2026-11-15, final review)

### BUG-074 No error page of last resort

- **Feature / file:** `src/app/error.tsx`, `src/app/global-error.tsx` (new)
- **What the AI wrote:** error pages for profiles and the head-to-head page
  only.
- **Symptom:** an unexpected error on any other page would have shown
  Next.js's default error screen, without the disclaimer every page must
  carry (CLAUDE.md rule 6).
- **How it was caught:** the definition-of-done audit, checking every page,
  error, 404 and loading file for the disclaimer; the final review found it
  too.
- **Fix commit:** `117dda4`
- **Prevention:** a component test renders all four error pages and checks
  the disclaimer and the retry.

### Found by the final whole-repository review (2026-11-15, about 14:00)

A reviewer subagent read the whole repository, not a diff: 14 findings, none
rated high. Each was checked against the code first; the traversal was
reproduced with requests against the fixture server.

| ID | File | Defect | Fix |
|---|---|---|---|
| BUG-075 | `profile/schema.ts`, `leaderboard/schema.ts` | The Kalshi username from upstream went unchecked into upstream request paths and local profile links: `..` would have pointed `/api/kalshi/../history` at `/api/history` | Kept only if our routes accept it as a profile id; tests |
| BUG-076 | `src/upstream/urls.ts` | Outbound links were resolved against the data source's origin, so a bare handle in the `twitter` field would have become a link to the data source labelled "on X" | Outbound links must be absolute https URLs; tests |
| BUG-077 | `e2e/fixture-server.mjs` | The test server read any `.json` file a request could name with `..`, and listened on every network interface | Plain fixture names only; listens on 127.0.0.1; traversal requests now get 404 |
| BUG-078 | `leaderboard/query.ts` | A code comment quoted the source's tooltip word for word, against rule 3 | Paraphrased |
| BUG-079 | README, CLAUDE.md, SPEC, EVALS, AGENTS.md, two comments | Docs said more than was true: that the asset check catches copied images, fonts and text (it checks names and capture folders); that a social preview image exists; test sizes; what `npm run check` runs; a theme script "in the body"; a React Compiler that is not enabled; submission links still "not deployed" | Each statement corrected to what the code does |

How they were caught: final review. Fix commits: BUG-075 and BUG-076 in
`ab172be`; BUG-077 in `e4a2d15`; BUG-078 in `2ea93f6`; BUG-079 in `2ea93f6`
(the comments) and in the phase 7 docs commit (the docs).

Not treated as defects, with the reason: the unused template component and
packages (removed, D-055), version ranges (pinned, D-055), missing security
headers (added, D-054), the shared upstream limit (accepted, D-056), the
template's skill (kept, D-057), and an unused test helper and snapshot field
(removed).

## Code audit at the owner's request (2026-11-15, after phase 7)

| ID | File | Defect | How caught | Fix commit |
|---|---|---|---|---|
| BUG-080 | `leaderboard-table.tsx` | A platform badge with no page to link to was shown with no text: the badge is hidden from assistive technology, so screen readers heard nothing there | independent review of the audit, after a new doc comment claimed "the link around it carries the name" | `24c9d75` |
| BUG-081 | `api-docs/page.tsx` | The API page listed this site's two routes but not the seven upstream requests the site makes, which its acceptance item asks for | ticking every spec acceptance item against its evidence | `949ba45` |

The audit also added doc comments to the exports that had none (now 176 of
178), un-exported three values used only in their own file, named one
number, and added tests for four acceptance items that had none. The
review of the audit caught four evidence claims in the spec that said more
than their tests show; they were narrowed.

## Independent AI code review (2026-11-15, fixed 2026-11-15 and 16)

The owner ran an AI code review in a separate Claude session, with no
knowledge of how the site was built. It read the whole repository and
listed five bugs among other findings. Each was reproduced first: the new test failed on the old code,
then passed on the fix.

| ID | File | Defect | How caught | Fix commit |
|---|---|---|---|---|
| BUG-082 | `month-strip.tsx`, `history.ts` | The month strip took its earliest month from the first entry of the summed daily changes, which kept the order of the series rather than of the days. For a trader on both platforms, or with several wallets, it could not step back before the first series began, while the chart showed earlier months | independent AI review; two unit tests failed on the old code; an end-to-end test with a trader whose Polymarket history starts two years before the Kalshi one now guards it | `bf4dfb3` |
| BUG-083 | `leaderboard-table.tsx`, `schema.ts` | A board row linked to `/account/{id}` even when our routes refuse that id, so the link led to a 404 | independent AI review; unit and component tests | `4ea36d6` |
| BUG-084 | `pnl-chart.tsx`, `comparison.ts` | The value range came from spreading a whole series into `Math.min` and `Math.max`, which engines refuse past some hundred thousand arguments | independent AI review; a test of the new one-pass helper with 300,000 points. The independent review noted that this test only failed on the old code because the helper did not exist yet, so a test of the head-to-head axis with 300,000 points was added: it throws `RangeError` on the old code | `dd69c9c` |
| BUG-085 | `api/boards/[period]`, `api/kalshi/[period]` | An unknown period answered with the HTML 404 page, not JSON, because the routes refused unknown parameters before our handler ran | independent AI review; route tests and an end-to-end check. The fix lets each unknown period be cached like any other path, which the independent review pointed out (accepted, D-064) | `97dd715` |
| BUG-086 | `copy-button.tsx` | Each click started a new reset timer without clearing the last, and none was cleared when the button went away | independent AI review; a fake-timer test | `7bee3a2` |

## Found while fixing the review (2026-11-16)

| ID | File | Defect | How caught | Fix commit |
|---|---|---|---|---|
| BUG-087 | `tsconfig.json` | Removing `allowJs` (commit `c9646c6`) did not last: `next build` writes its suggested value for any key that is absent, so the next build put `"allowJs": true` back. That rewrite then went into commit `6675b5a` by accident | the diff of the next commit showed `tsconfig.json` changed by the build | `83bbf92` |
