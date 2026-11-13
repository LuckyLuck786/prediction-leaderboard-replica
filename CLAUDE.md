@AGENTS.md

# Project rules: prediction leaderboard replica

These rules are specific to this repository. Where they conflict with the
template instructions imported above (for example "use actual text and assets
from the target site" or "pixel-perfect emulation"), these rules win.

## What this is

An independent demo that rebuilds the structure and behavior of a public
prediction-market trader leaderboard (source: https://predicting.top/) for a
hiring assignment. Branding and copy are original on purpose. The graded
output is the working site plus `docs/EVALS.md`, `docs/BUGLOG.md` and
`docs/WORKFLOW.md`, so docs and tests are first-class work, not cleanup.

## Hard rules

1. **Mirror what can be measured.** Routes, information architecture, layout
   grid, component structure, spacing, density, responsive behavior,
   interactions and functionality follow the source.
2. **Original branding only.** Product name, logo, wordmark, all copy text,
   accent color, favicon and social preview image are ours. Brand assets live
   in `public/brand/`.
3. **Never commit or deploy source-site files.** No extracted images, logos,
   icons, SVGs, font files, videos or text from the source site. Use Lucide
   icons and openly licensed fonts loaded through `next/font`.
4. **Raw captures stay local.** `docs/research/`, `docs/design-references/`
   and `public/sites/` are gitignored and never pushed. Do not create
   `src/components/sites/`; the skill suggests it for extracted SVGs, which
   rule 3 forbids.
5. **The source site's name appears only in** `README.md`, `CLAUDE.md`,
   `docs/`, the footer disclaimer and the asset check itself. A CI check
   enforces rules 3 to 5.
6. **Disclaimer on every page** and in the README: "Independent demo built for
   a hiring assignment. Not affiliated with predicting.top, Polymarket or
   Kalshi."
7. **No data collection.** No login, wallet connect, payment or working
   submission form. If the source has such a flow, build the screen with the
   action disabled and say so on the screen.
8. **No identity linking.** Show only what the upstream public API already
   publishes. Add nothing that ties wallets to real-world people.
9. **Disclose the deviation.** README and write-up state plainly that the
   branding is original on purpose, and why.
10. **No secrets in source.** Environment values go in `.env.local`, which is
    gitignored. No API keys in the client bundle.

## Visiting the source site

- Read `robots.txt` and the terms before any automated visit.
- Visit each route once, slowly. No aggressive crawling, no proxies, no
  attempt to get around bot protection.
- If the site blocks automation, stop and ask the owner for manual
  screenshots.

## Data rules

- Fetch upstream data on the server (route handlers or server components)
  with caching and revalidation. Visitors' browsers never call upstream.
- Validate every upstream response with a Zod schema at the boundary. A failed
  parse produces a handled error state, never a crash.
- Keep a small snapshot fixture so the demo renders when upstream is down or
  rate-limited, and label the page clearly when it shows the snapshot.

## Workflow

- Work in the phases agreed with the owner. Stop at each phase gate and wait
  for a go.
- Every task traces back to a line in `docs/SPEC.md`.
- Plan each feature, get it approved, then build it as a small vertical slice
  with its tests written alongside.
- A review pass by a separate agent or fresh context that did not write the
  code comes before a slice is called done.
- The moment a real bug is found, add it to `docs/BUGLOG.md`. Real bugs only:
  never invent or pad entries.
- Run the parity checks in `docs/EVALS.md` before moving to the next slice.
- Record choices and trade-offs in `docs/DECISIONS.md` with the date.
- Keep `docs/WORKFLOW.md` true to what actually happened.

## Commands

- `npm ci --ignore-scripts` installs dependencies without running package
  install scripts.
- `npm run dev` starts the dev server on http://localhost:3000.
- `npm run check` runs lint, typecheck and a production build. It must pass
  before every commit that touches code.
- `npm audit --omit=dev` must report 0 vulnerabilities.

Test and eval commands are added here when the tools are added.

## Conventions

- Structure follows the domain: feature code lives together in
  `src/features/<feature>/` (components, data access, schemas, tests).
  `src/components/ui/` holds shadcn primitives only.
- One source of truth per fact. Formatters, constants and schemas are defined
  once and imported.
- No magic numbers or strings. Name them.
- Fail loudly. No empty catch blocks and no swallowed promise rejections.
- Before adding a dependency, check whether a few lines of local code do the
  job. Pin exact versions.
- Design: structure, spacing and interactions follow the source. Our own
  branding choices (palette, fonts, copy) avoid Inter, Geist and Space
  Grotesk, emojis, invented testimonials and placeholder text.

## Git

- Every commit is authored by the repository owner. Never set an AI as author.
- Conventional commit messages, one logical change per commit.
- Commits written with AI help keep the `Co-Authored-By` trailer. This is a
  deliberate choice for this repository: it is honest evidence of the AI
  workflow.
- Never rewrite history. Never push, create the remote or deploy without an
  explicit go from the owner.

## Never

- Submit, send or post anything on the owner's behalf: no forms, messages,
  emails or applications. Drafts go in `docs/SUBMISSION.md`.
- Install anything globally or spend money without asking.

## Definition of done

- Live deployment works on mobile and desktop.
- Public repository has `LICENSE`, `THIRD_PARTY_NOTICES.md`, `README.md`,
  `CLAUDE.md` and all docs.
- Every commit is authored by the owner, with the AI co-author trailer intact.
- Disclaimer visible on every page; no extracted assets or source-site text
  shipped; asset check green.
- CI green: lint, typecheck, unit, e2e.
- `docs/EVALS.md` has a filled parity matrix and rerun commands.
- `docs/BUGLOG.md` contains only real entries with fix commits.
- `docs/WORKFLOW.md` matches what happened.
- `docs/SUBMISSION.md` has the answer drafts and the Loom script.
