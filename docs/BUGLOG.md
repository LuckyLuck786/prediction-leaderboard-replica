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
