# Workflow

How this project is actually being built. This file is a record, updated as
work happens. It describes what was done, not what was planned.

## Roles

- **Owner (Shaik Luqman):** sets the rules, approves each phase at a gate,
  makes the product decisions, reviews the output.
- **AI agent (Claude Code, desktop app):** proposes, builds, tests and
  documents inside the rules, and stops at each gate.

## Rules files in use

- `CLAUDE.md` in this repository: project rules, hard rules for the replica,
  commands, conventions and the definition of done. It imports the template's
  `AGENTS.md` and states that the project rules win where the two conflict.
- The owner's global `CLAUDE.md`: engineering standards that apply to every
  project (fail loudly, validate at the boundary, no secrets in source, pinned
  dependencies, measured performance work).

## Log

### Phase 0: setup (2026-11-14)

1. **Environment check.** Recorded OS, shell, Node, npm, git and GitHub CLI
   versions. Node 24.21.0 meets the template's `>=24` requirement.
2. **Template review before install.** Cloned the template into a temporary
   folder outside the project and read it in full before running anything:
   `package.json` scripts, agent instructions, the `clone-website` skill, both
   workflows, and a lockfile audit with `jq` (install scripts, non-registry
   sources, missing integrity hashes). Findings are in `docs/DECISIONS.md`,
   D-002.
3. **Gate.** The agent reported the findings and six open questions. The owner
   answered before anything was installed.
4. **Fresh history.** Copied the 49 template files in, verified the copy
   byte-for-byte against the clone with `diff -r`, and ran `git init`.
5. **Install with scripts disabled**, then `npm run check` to confirm the
   untouched template lints, typechecks and builds.
6. **Identity check before the first commit.** The agent showed the
   repository's `user.name` and `user.email`; the owner asked what the noreply
   address was, got an explanation and approved.
7. **Small commits, one change each:** template as-is, housekeeping removal,
   ignore rules, dependency security bump, license and notices, rules and
   docs.
8. **Security finding acted on.** `npm audit` flagged the pinned Next.js
   version. The agent read the advisory list, bumped to the patched release,
   re-ran the check and the audit, and recorded it as D-005.

### Phase 1: map and observe (2026-11-14)

1. **Permissions first.** Read `robots.txt`, the site's agent reference and
   the terms before loading any page. Pages may be visited; the API is
   documented as free to call with stated rate limits; the terms forbid
   scraping that overburdens the site and protect its design, code and copy.
2. **One visit per route**, in a real browser, slowly: home, Polymarket board,
   Kalshi board, a Kalshi profile, a Polymarket profile, battle, API
   reference, submit. The submit form was looked at, not touched.
3. **What was recorded per page:** rendered structure, computed styles
   (sizes, colors, spacing, breakpoints), every control and what it changes,
   sort and paging behavior, money and date formats including negatives, the
   mobile layout at 390 px, the network calls and the shape of each response.
4. **Raw notes stay local.** Notes and captures live in a gitignored folder.
   `docs/SPEC.md` was then written from them in our own words, with an ID per
   requirement and an acceptance list per page.
5. **Findings that changed the plan:** the leaderboard is richer than the
   brief assumed (search, seven filters, optional columns, sorting, paging);
   the Kalshi board is a separate simpler page; the battle page is a fixed
   promotion, not a comparison tool; profiles show no positions or trades.
   Open questions for the owner are listed at the end of the spec.

### Phase 2: home page shell (2026-11-14)

1. **Gate decisions applied first.** The owner answered the seven open
   questions; they were written into `docs/DECISIONS.md` and the spec before
   any code, the leftover template files were removed, and the setup branch
   was fast-forwarded into `main`. Phase 2 got its own branch.
2. **Framework docs before code.** The template warns that this Next.js
   version differs from older ones, so the bundled upgrade guide and the
   guides for metadata, icons and client components were read first. Current
   Vitest configuration was looked up through the Context7 documentation
   server rather than recalled.
3. **Data before UI.** A script fetched a small snapshot from the documented
   API. A Zod schema became the only door upstream data can come through.
4. **Logic as pure functions with tests alongside:** formatters, filtering,
   search, sorting and the view state. Formatter tests use the exact strings
   seen on the source next to the raw API numbers they came from.
5. **UI built from the spec IDs** (HOME-01 to HOME-21), with our own branding,
   colors, copy and letter badges.
6. **Measured comparison, then repair.** The layout probe that recorded the
   source was run on the local page at 1024 and 390 px. It found three real
   differences (BUG-001, BUG-002, BUG-004), which were fixed and measured
   again until the numbers matched. The table is in `docs/EVALS.md`.
7. **Checks that can fail.** A planted violation proved the asset check
   fails; two hand-made mutations proved the tests catch regressions.
8. **Small commits**, each preceded by a look at exactly what was staged.
9. **Independent review.** A reviewer subagent with read-only instructions,
   which had not written the code, reviewed the phase diff against the spec
   and the rules. 19 findings: 1 high, 6 medium, 12 low, none on security.
   Each was checked against the code before acting: 10 were real defects and
   were fixed with tests (BUG-006 to BUG-015); 2 were kept on purpose with a
   recorded reason; the rest were wording or single-source clean-ups.
10. **Re-verified** after the fixes: full check, a fresh page load with no
    console errors, and the mobile layout with optional columns switched on.

### Between phases: publishing (2026-11-14)

1. **Knowledge graph first.** `/graphify` indexed the repository: code by
   AST, the docs and the brand mark by three extraction subagents. 600
   nodes, 1,153 edges, 40 communities; later questions about the codebase
   go to the graph before reading files.
2. **Privacy audit before going public.** Every tracked file and the whole
   history were searched for personal details, local paths and secrets.
   None found.
3. **Repository and hosting.** A public GitHub repository was created and
   linked to Vercel through Vercel's GitHub app: `main` deploys to
   production, other branches to previews. The first CI runs on GitHub
   passed.

### Phase 3: live data, platform boards and the missing pages (2026-11-14)

1. **Framework docs first**, again from the bundled Next.js docs: fetch
   caching, `revalidate`, route handlers, `generateStaticParams`,
   `notFound`.
2. **One upstream client**, server only, with a timeout and a five-minute
   cache, then schemas and fallbacks per board.
3. **Pages built from the spec IDs**: Polymarket and Kalshi boards,
   profiles, terms, privacy, get-listed (switched off) and API.
4. **Checked in the browser against live data**, including a trader-by-
   trader comparison of our route with upstream (584 of 584 equal).
5. **Bugs found on the way** were logged as they appeared (BUG-017 to
   BUG-022). Two came from looking past the obvious: the production HTML
   for the theme script, and a fresh 404 page with a saved theme.
6. **Independent review** of the phase diff by a reviewer subagent: 16
   findings and a question. Ten were real defects, fixed with tests
   (BUG-023 to BUG-032); two were reproduced by hand first. The others were
   answered with a reason in the bug log, including the question, which was
   settled by checking the source's own numbers.
7. **Re-verified** after the fixes: 242 tests, the browser checks of the
   changed pages, then merged to `main`, which deploys to production.

### Phase 4: the full trader profile and end-to-end tests (2026-11-14 to 15)

1. **One more look at the source**, one profile page, slowly: the month
   strip and its day bars, the expanded calendar in both views, the chart's
   labels and hover readout, the category rows. Every day shade, label and
   total was written down with its raw value.
2. **A documented source for Polymarket history.** A web search found
   Polymarket's own data API; its OpenAPI contract was read for the exact
   parameters before one test request (D-035).
3. **History maths as pure functions, tested against the recorded source
   values** before any component existed: daily results, shading, monthly
   totals, chart axis. Three of the first guesses failed those tests or the
   comparison and were replaced by rules derived from the numbers (BUG-033,
   BUG-036, BUG-037).
4. **Components** for the month strip, calendar, chart and category card,
   then the profile page wired to them. The interim P&L card from phase 3
   was removed (DEV-17).
5. **Checked in the browser against the source's recorded numbers**: chart
   labels, calendar shades, month totals, category rows, and a layout probe
   at the same viewport as the source.
6. **End-to-end tests** with Playwright, run offline against a fixture
   server that replays recorded answers (D-040), at desktop and phone sizes,
   and added to CI as a second job.
7. **Layout probe** at the source's viewport: two cards were taller than
   the source's and were corrected (BUG-040, BUG-041).
8. **Independent review** of the phase diff by a reviewer subagent: 11
   findings. Eight were real defects, fixed with tests (BUG-042 to
   BUG-049), including two that only show for traders unlike the one the
   source was compared on: a trader on both platforms, and the Polymarket
   calendar. One was a trade-off, recorded as a decision (D-041); the rest
   were clean-ups.
9. **Re-verified** after the fixes: 355 unit tests, 48 end-to-end tests,
   the Polymarket profile in the browser (its last day now matches the
   trader's own 1-day figure), then merged to `main`.

### Phase 5: the head-to-head page (2026-11-15)

1. **Recorded observations reread** instead of visiting the source again:
   the battle page's layout tree, its links and the shape of its data were
   already captured in phase 1. The pair's full wallet came from the saved
   sitemap, because the captured link was cut short.
2. **Checked the documented endpoints against the source's own numbers**
   before building: the Kalshi history starts at the source's comparison
   start and baseline to the cent, and Polymarket's first daily point after
   it is the source's other baseline. So the page could be rebuilt without
   the undocumented route (D-043).
3. **Data, page and tests** as one slice: comparison maths, a loader that
   never fails the page, the view, the chart, unit, component and
   end-to-end tests.
4. **The upstream went down** at about 00:45 IST and stayed down for over
   half an hour. That was used as a test: the page degraded as designed, but
   a production build failed (BUG-050), which was then diagnosed in the
   Next.js source, fixed and re-run under the same outage. Work resumed
   with live data at 10:16 IST.
5. **Measured against the recorded source**: the axis test was rewritten to
   use the real histories cut at the moment of capture, which exposed a
   wrong padding (BUG-051); every recorded size now matches at 800 px.
6. **Independent review** of the phase diff: 6 findings, 4 real defects
   (BUG-054 to BUG-057). The worst was mine to own: the BUG-050 fix did not
   work, and the check behind it was invalid. It was reproduced properly,
   fixed, and the reproduction became a repeatable eval,
   `npm run check:outage`.
7. **Re-verified**: 382 unit tests, 55 end-to-end tests, the outage eval,
   and the pages on the dev server with live data.
8. **Merged and deployed.** The live site served every route, cached as
   before. CI's end-to-end job failed on the merge: a phase 4 test read the
   profile chart before it was drawn (BUG-058), which the CI page snapshot
   showed. Fixed with waiting assertions; CI then passed both jobs.

### Phase 6: accessibility, performance and the evals (2026-11-15)

1. **Tools first, pinned**: axe through `@axe-core/playwright` 4.14.0 as a
   dev dependency (checked that none of the 21 existing dev-tool advisories
   came from it), Lighthouse 13.6.0 through `npx` (D-053).
2. **axe on every route, both themes, three sizes.** First run: 11 of 44
   failed on contrast, touch-target size and a code block the keyboard could
   not reach (BUG-059 to BUG-061). Colours were fixed by computing, for each
   token, the smallest change that clears 4.5:1 on every surface.
3. **Keyboard test**, checked that it can fail by removing one focus ring.
4. **The layout probe became a test**, as the evals plan promised; it found
   a row height that depends on the Chromium version (BUG-062). A tablet
   size joined the end-to-end projects.
5. **Lighthouse on production** for a baseline, then on a local production
   build of the branch. The network list showed profile prefetching
   (BUG-063); the third-party cookie led to an anonymous-picture change that
   was later dropped (BUG-066, BUG-067).
6. **Independent review**: 10 findings, 9 real defects (BUG-064, BUG-065,
   BUG-067 to BUG-073). Two mattered most: the axe runs had never seen the
   calendar, whose day amounts were unreadable, and the focus rings were
   faint and cut off while the keyboard test passed. Both checks were made
   stricter, then the code was fixed until they passed.
7. **Re-verified**: unit tests including a token contrast test, the full
   end-to-end suite at three sizes, Lighthouse median of three runs.

### Phase 7: final review (2026-11-15)

1. **The definition of done, checked by script**: required files present;
   every commit authored by the owner with the co-author trailer; every
   fix commit in the bug log present in history; no "not run" left in the
   parity matrix; no secrets, local paths or e-mail addresses in history;
   the disclaimer on every page, error, 404 and loading file. One gap:
   no error page of last resort (BUG-074).
2. **The README from a fresh clone of the public repository**: install,
   `npm run check`, the browser install, the end-to-end suite, the audit,
   the outage eval and the dev server, all as written.
3. **A whole-repository review** by a reviewer subagent, not a diff
   review: 14 findings. Five real defects (BUG-075 to BUG-079), the rest
   clean-ups and hardening: the unused template UI stack and the `shadcn`
   CLI removed, versions pinned, security headers, notices listing the
   shipped packages (D-054 to D-057).
4. **Re-verified**: unit tests, the end-to-end suite at three sizes (which
   includes the layout, accessibility and keyboard checks, so removing the
   template's styles changed nothing they measure), the asset check.
5. **Merged and deployed**: every route answers on the live site with the
   new security headers, and CI passed both jobs.

### Slips, recorded as they happened

- A staged file deletion (`docs/assets/star-history.png`) was swept into the
  `CLAUDE.md` commit instead of the README commit that describes it, because
  `git rm` stages immediately and the next commit took everything staged.
  Caught by reading the `git status` output between the two commits. History
  is not rewritten in this repository, so it stays as is. Since then each
  commit is preceded by a look at exactly what is staged.
- **A stale dev server looked like a code bug** (phase 4, about 23:55 IST).
  A profile that had worked returned 404. A throwaway test calling the real
  functions showed the code was fine; the development server had been
  running since before phase 3, through branch switches and production
  builds. Restarting it fixed the page. About two minutes lost.
- **A process from another project was stopped** (phase 4, about 23:57 IST).
  To restart the dev server, every process matching `npm run dev` was
  listed, and an orphaned one was stopped on the assumption that it was a
  leftover of this repository. It belonged to another project on the same
  machine; its watcher stopped with it. That project's dev server was
  running again a few seconds later (a new process started at 23:57) and the
  owner was told. Since then only processes whose command line contains this
  repository's path are stopped.
- **The same stale dev server, again** (phase 5, about 00:50 IST). After
  four branch switches for the phase 4 push, the dev server served a module
  from a half-finished hot reload ("is not a function" for an export that
  existed). Restarted, as `CLAUDE.md` says, through the session's own task
  control rather than by process name.
- **A verification that could not fail** (phase 5, about 01:00 IST). To show
  the BUG-050 fix worked, the old fetch cache was copied back with `cp -R`,
  which gives the copies new timestamps; the entries then looked fresh, so
  the build never took the path that hung. The review caught it (BUG-054).
  Since then a fix for a failure is checked by reproducing the failure first
  with the old code, then running the same reproduction on the new code.
- **One commit that does not pass on its own** (phase 5, about 10:50 IST).
  The head-to-head commit `cf44af6` has a test that reads recorded fixtures,
  and the fixtures went into the next commit, `292820f`. Checked out alone,
  that one test file fails to load; every other commit of phases 4 and 5
  passes typecheck and all its tests on its own (checked commit by commit).
  History is not rewritten here, so it stays. The per-commit check had also
  read only the test count, which hides a file that fails to load; it now
  reads the file count too.
- **A privacy fix that broke privacy** (phase 6, about 11:55 IST). To get rid
  of a third-party cookie flagged by Lighthouse, pictures were requested
  anonymously, decided per host after checking one URL per host. That broke
  one picture route on the same host (BUG-066) and made the privacy page
  untrue, because anonymous requests carry an `Origin` header (BUG-067). The
  first was caught by Lighthouse, the second by the review. The change was
  dropped and the trade-off written down (D-050). Lesson: check every path
  a rule applies to, and read the privacy page before changing what requests
  send.
- **Evals that passed for the wrong reason, again** (phase 6). The first
  axe runs never opened the calendar and the first keyboard test only
  checked that a ring style existed. Both were written in this phase and
  both looked green. The review caught them; each check now has a
  demonstration that it fails on the defect it is for.
- **The zsh `path` variable, again** (phase 7). A loop variable named `path`
  replaced the shell's `PATH` a second time; the command failed loudly and
  was rerun with `route`. A leftover test server from that run was found by
  its port and stopped only after checking it ran from this repository.

## Tools used so far

| Tool | Used for |
|---|---|
| Claude Code (desktop app) | Planning, reading, editing, running commands |
| `CLAUDE.md` rules files | Standing rules, read at the start of every session |
| Task list with phase gates | One visible plan per turn; stop and ask at gates |
| `gh` CLI | Template metadata and license check |
| `jq`, `diff`, `npm audit` | Lockfile audit, copy verification, advisories |
| `ai-website-cloner-template` | Starting scaffold and the `clone-website` skill |
| Claude Code built-in browser | Observing the source: structure, styles, interactions, network calls |
| `curl` | `robots.txt`, agent reference and sitemap, one request each |
| Context7 documentation server (MCP) | Current Vitest configuration docs |
| Bundled Next.js docs in `node_modules` | Version 16 changes, metadata and icon conventions |
| Vitest, Testing Library, jsdom | Unit and component tests |
| Zod | Validating upstream data at the boundary |
| Layout probe in the browser console | Measuring our page against the numbers recorded from the source |
| Reviewer subagent | An independent review of the phase diff by an agent that did not write it |
| graphify (skill) | Knowledge graph of code and docs, so later work reads the graph instead of whole files |
| GitHub CLI | Repository creation, CI run status |
| Vercel (MCP server) | Project creation linked to GitHub, deployment status |
| Firecrawl search (MCP server) | Finding Polymarket's documented P&L history endpoint |
| Polymarket's OpenAPI contract | Exact parameters and fields of that endpoint, read before calling it |
| Playwright 1.64 | End-to-end tests at desktop and phone sizes, offline, locally and in CI |
| Context7 documentation server (MCP) | Current Playwright configuration docs |
| axe-core (`@axe-core/playwright`) | WCAG 2.2 A and AA checks inside the end-to-end tests |
| Lighthouse 13.6 (through `npx`) | Performance, accessibility and best-practice scores of the deployed site |

Later phases add to this log and this table as tools are actually used.
