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

## Open items

- `next.config.ts` still sets `output: "standalone"`, which existed for the
  removed Docker setup. Decide when the deployment is configured.
- The CI workflow triggers on `master`; this repository uses `main`. Fix when
  CI is extended.
