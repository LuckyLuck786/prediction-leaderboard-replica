# Evals plan

How we verify that the replica matches the source in structure and behavior,
and that it works correctly. Branding differences are expected and excluded:
see `docs/DECISIONS.md`, D-007.

**Status: plan only. No parity check has been run yet.** Results are filled in
as each route is built. A cell stays "not run" until its command has actually
been run.

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
| `/` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/polymarket` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/kalshi` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/account/[id]` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/battle` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/api-docs` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/submit` | not run | not run | not run | not run | not run | not run | not run | not run |
| `/terms` | not run | not run | not run | not run | not run | not run | not run | not run |

## Rerun commands

| Check | Command | Last result |
|---|---|---|
| Lint, typecheck, build | `npm run check` | pass, 2026-11-14, template scaffold only |
| Production dependency audit | `npm audit --omit=dev` | 0 vulnerabilities, 2026-11-14 |

Commands for unit, component, end-to-end, accessibility and asset checks are
added here when those tools are added.
