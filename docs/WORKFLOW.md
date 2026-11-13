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

### Slips, recorded as they happened

- A staged file deletion (`docs/assets/star-history.png`) was swept into the
  `CLAUDE.md` commit instead of the README commit that describes it, because
  `git rm` stages immediately and the next commit took everything staged.
  Caught by reading the `git status` output between the two commits. History
  is not rewritten in this repository, so it stays as is. Since then each
  commit is preceded by a look at exactly what is staged.

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

Later phases add to this log and this table as tools are actually used.
