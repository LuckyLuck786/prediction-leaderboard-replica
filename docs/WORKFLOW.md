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

## Tools used so far

| Tool | Used for |
|---|---|
| Claude Code (desktop app) | Planning, reading, editing, running commands |
| `CLAUDE.md` rules files | Standing rules, read at the start of every session |
| Task list with phase gates | One visible plan per turn; stop and ask at gates |
| `gh` CLI | Template metadata and license check |
| `jq`, `diff`, `npm audit` | Lockfile audit, copy verification, advisories |
| `ai-website-cloner-template` | Starting scaffold and the `clone-website` skill |

Later phases add to this log and this table as tools are actually used.
