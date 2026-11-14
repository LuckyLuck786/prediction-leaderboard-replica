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

Later phases add to this log and this table as tools are actually used.
