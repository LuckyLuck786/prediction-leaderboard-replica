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
