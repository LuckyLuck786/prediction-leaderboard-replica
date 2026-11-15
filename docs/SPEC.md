# Spec

What the source site does, as observed, and what each page of this replica
must do. Every build task traces back to an ID in this file.

- **Source:** https://predicting.top/
- **Observed:** 2026-11-14, 01:05 to 02:00 IST, in a real browser at 1024 px
  and 390 px wide, one visit per route.
- **Method:** read `robots.txt`, the terms and the site's own agent reference
  first; then loaded each route once, read the rendered structure and computed
  styles, exercised every control, and recorded the network calls each page
  makes. Raw captures stay on the build machine and are not in this repository.
- **Not copied:** no markup, styles, scripts, images, icons, fonts or copy
  text from the source. This file describes structure, measurements and
  behavior in our own words. Short functional labels (for example `1D`,
  `Score`, `Show More`) are listed where a test needs them.

## 1. Permissions checked before visiting

| Item | Finding |
|---|---|
| `robots.txt` | Pages and `/account/` allowed. `/api/` disallowed for crawlers. |
| Agent reference | States the API is "free to call", no key, CORS enabled. |
| API terms | Asks for credit and a link back when the data is displayed. |
| Rate limits | 100 requests/min per IP overall; leaderboards 120/min; trader profiles 60/min per trader. Rate-limit headers on every response. |
| Site terms | Informational only. Forbids scraping that overburdens the site and misrepresenting affiliation. States that the site's design, code and original content are protected. |

Consequences for this project: one slow visit per route, no crawling; data
access only through the documented API, cached on our server; credit and link
in the footer; original branding and copy; a disclaimer on every page.

## 2. Route map

| ID | Source route | Local route | Shell | Phase |
|---|---|---|---|---|
| R-01 | `/` | `/` | Leaderboard | 2, 3 |
| R-02 | `/polymarket` | `/polymarket` | Leaderboard | 3 |
| R-03 | `/kalshi` | `/kalshi` | Leaderboard | 3 |
| R-04 | `/account/{id}` | `/account/[id]` | Top bar | 4 |
| R-05 | `/battle` | `/battle` | Bare | 5 |
| R-06 | `/api-docs` | `/api-docs` | Top bar | 5 |
| R-07 | `/submit` | `/submit` | Top bar | 5 |
| R-08 | `/terms` | `/terms` | Top bar (assumed) | 5 |

`{id}` is a Polymarket wallet (`0x` + 40 hex) or a Kalshi username. The source
sitemap lists 811 profile URLs. Unknown traders and pages return HTTP 404.

The source is a client-rendered single-page app. Filter state is held in
memory: it is not in the URL and is lost on reload.

## 3. Shared rules

### 3.1 Design tokens (measured)

| Token | Dark (default) | Light |
|---|---|---|
| background | rgb(18,18,18) | #f0f0f0 |
| foreground | rgb(237,237,237) | #1a1a1a |
| card | rgb(26,26,26) | #fcfcfc |
| border | rgb(46,46,46) | #e8e8e8 |
| muted foreground | rgb(140,140,140) | #212121 |
| secondary | rgb(51,51,51) | #c4c4c4 |
| primary / on primary | white / black | black / white |
| positive | rgb(34,197,94) | same |
| negative | rgb(239,68,68) | same |

- **TOK-01** Font is the system UI stack. No web font is loaded.
- **TOK-02** Breakpoints: 640 px and 768 px only.
- **TOK-03** Leaderboard pages use square corners on buttons and inputs.
  Profile, docs, battle and submit pages use rounded cards and controls
  (12.8 px). Avatars are circles. No shadows.
- **TOK-04** Theme toggle switches dark and light and remembers the choice.
  Dark is the default.
- **TOK-05** Score color bands: below 35 red; 35 to below 50 orange; 50 to
  below 65 lime; 65 to below 80 green; 80 and above bright green.
- **TOK-06** Platform accents: Polymarket sky blue rgb(56,189,248); Kalshi
  green.

Our branding (name, logo, accent color, favicon) replaces the
source's. See section 7.

### 3.2 Shells

- **SHELL-01 Leaderboard shell** (`/`, `/polymarket`, `/kalshi`): no top
  navigation. Page padding 12 px below 640 px, 20 px above. Content column
  896 px max, centered. Footer: 64 px above, top border, centered row of muted
  14 px links that wraps on mobile.
- **SHELL-02 Top-bar shell** (profile, docs, submit, terms): 65 px bar with a
  bottom border; inside it a back link on the left (chevron icon + label,
  rounded, secondary background) and the theme toggle on the right. Content
  column: 896 px (profile), 768 px (docs), 576 px (submit), padding 32 px
  top and bottom, 16 px sides.
- **SHELL-03 Bare shell** (`/battle`): no header or footer, content centered,
  768 px column.

### 3.3 Formatting

- **FMT-01** Full money: sign, dollar, thousands separators, two decimals:
  `+$57,643.38`. Negative values put the dollar sign first: `$-21,622.00`
  (source behavior, mirrored).
- **FMT-02** Compact money on mobile leaderboard rows, large values only:
  `+$7.3M`, `+$719k` (lowercase k). Values near 57K stayed full and values
  near 350K were compact; the exact switch point was not observed.
- **FMT-03** Day-mover amount: `+$52K`, `-$12K`, `+$699` (uppercase K, no
  decimals).
- **FMT-04** Profile amounts: `+$323.2K`, `-$629`, `+$1.2M`; page title uses
  `+$1.10M` and `+$922.2K`.
- **FMT-05** Kalshi board: whole dollars, `+$7,943,912`, tabular figures.
- **FMT-06** Joined: days since join date, `755d`; a dash when unknown. Profile
  header: `Joined Nov 2024`.
- **FMT-07** Wallet without a display name: first six and last four
  characters, `0xcf19…6402`.
- **FMT-08** Updated stamp: day, short month, local 24-hour time,
  `14 Nov, 1:07`.
- **FMT-09** Score: up to one decimal. Win rate: whole percent. Sharpe: two
  decimals. Missing values: a dash.

### 3.4 States

- **STATE-01 Loading (source):** no skeletons. Tables are simply empty until
  data arrives, and the Kalshi count reads "0 traders" while a period loads.
  Share images show a grey block until loaded.
- **STATE-02 Empty search (source):** table header only, no message.
- **STATE-03 Ours:** skeleton rows while loading, a short empty message, and a
  handled error state with a labeled snapshot fallback. These are deliberate
  improvements (section 7).

## 4. Pages

### 4.1 Home `/` (R-01)

Structure, top to bottom:

- **HOME-01** Heading (20 px mobile, 24 px desktop, regular weight).
- **HOME-02** Sub-row: left, a one-line description and the updated stamp
  (FMT-08, from `lastUpdated`); right, "Today:" with the combined daily profit
  in green. Stacks on mobile.
- **HOME-03** Search input (192 px wide on desktop, full width on mobile),
  result count "`{shown} of {total} traders`", theme toggle at the far right.
- **HOME-04** Period buttons `ALL`, `YTD`, `1M`, `1D`. Single select. Default
  `1D`. Active button uses the primary color.
- **HOME-05** `$5+` toggle, visible only in `1D`, on by default: hides traders
  whose daily P&L is within 5 dollars of zero.
- **HOME-06** Platform group: Polymarket, Kalshi, Hyperliquid icons and `All`.
  Single select. Default `All`.
- **HOME-07** `linked` toggle: only traders with an X account.
- **HOME-08** `No sports` toggle, on by default: hides traders with
  `sports_share` of 0.5 or more.
- **HOME-09** `No esports` toggle, on by default.
- **HOME-10** Column toggles `Sharpe`, `Win%`, `ROI` (desktop only, multi
  select): each adds a column before P&L. The Sharpe column follows the
  selected period.
- **HOME-11** One-line legend explaining the score weights.
- **HOME-12** Table columns: `#`, avatar, Trader, Joined (768 px and up),
  Score, optional columns, P&L (right aligned).
- **HOME-13** Row: 61 px high on desktop, 49 px on mobile; bottom border;
  whole row is clickable and highlights on hover; goes to the profile.
- **HOME-14** `#` is the position after filters and sorting, starting at 1.
- **HOME-15** Trader cell: name linking to `/account/{id}`, then small icon
  buttons: X when present, then one badge per platform. Names truncate on
  mobile.
- **HOME-16** Score cell colored by TOK-05, dash when missing.
- **HOME-17** P&L cell: FMT-01 on desktop, FMT-02 on mobile. In `1D` a second
  muted line shows the day's biggest mover (label or market icon) and its
  amount (FMT-03, green or red).
- **HOME-18** Sorting: Joined, Score, Sharpe, Win%, ROI and P&L headers are
  clickable. First click sorts ascending and shows a down arrow; second click
  sorts descending and shows an up arrow; further clicks keep toggling.
  Default is P&L descending with no arrow. Missing scores sort lowest.
- **HOME-19** Paging: a full-width `Show More ({shown} of {total})` button
  adds 30 rows per click and disappears when all rows are shown. The very
  first render of the home page showed 15 rows; after any filter change, and
  on `/polymarket`, the first page was 30. We use 30.
- **HOME-20** Search matches name and wallet, case-insensitive, as you type.
- **HOME-21** Footer links: X account, get listed, Polymarket board, Kalshi
  board, terms.

Observed counts with default toggles: `1D` 421 of 584, `1M` 569 of 650, `YTD`
675 of 770, `ALL` 693 of 788.

Data: one request per period returns every trader (about 570 KB); filtering,
sorting, search and paging all happen in the browser. On load the page
requests `1d` and the daily profit, then prefetches `30d`, `ytd` and `all`.

Acceptance:

- [ ] All of HOME-01 to HOME-21 present and working at 390, 768 and 1440 px.
- [ ] No horizontal scroll at 390 px. Joined hidden below 768 px. Column
      toggles hidden below 640 px.
- [ ] Row count, order and values for the first 30 rows equal the API
      response after applying the default filters.
- [ ] Each filter changes the count to the value computed from the API data.
- [ ] Sort cycle and arrows match HOME-18 for every sortable column.
- [ ] Money, joined, wallet and score formats match section 3.3, including a
      negative value and a value under 1,000.
- [ ] Clicking a row opens that trader's profile.

### 4.2 Polymarket board `/polymarket` (R-02)

- **POLY-01** The home leaderboard with its own heading and description and
  the platform filter preset to Polymarket (287 of 584 observed).
- **POLY-02** An "about" section after the table: a 16 px heading, an intro
  paragraph, five question-and-answer blocks and a closing line with links to
  home, the Kalshi board, the submit page and the API page. Text is 14 px and
  muted; question headings use the foreground color.

Acceptance:

- [ ] Loads with Polymarket selected; every HOME control still works.
- [ ] About section present with five Q&A blocks and four working links.

### 4.3 Kalshi board `/kalshi` (R-03)

A separate, simpler page.

- **KAL-01** Header: heading on the left; on the right a bordered link back to
  the all-platforms board and the theme toggle. Description and updated stamp
  below.
- **KAL-02** One control row: period buttons `ALL` (default), `1M`, `7D`,
  `1D`; a `Non-sports` toggle; on the right a search input and the count
  "`1,000 traders`".
- **KAL-03** Table: `#` (muted), avatar (32 px), Trader, P&L (green, FMT-05).
  Rows are 49 px and are not clickable. No sorting.
- **KAL-04** The name is a link to the trader's Kalshi page in a new tab when
  the trader has no local profile (seen). When the API gives a local profile
  path we link there instead (inferred from the `profile_path` field, not
  seen). An X handle follows the name when known.
- **KAL-05** `#` keeps the true rank while searching.
- **KAL-06** Paging: 100 rows, `Show more ({n} left)` adds 100.
- **KAL-07** Each period is fetched when selected. The `Non-sports` toggle
  uses a request parameter that is not in the public API reference.
- **KAL-08** A small note under the table on how period P&L is measured, and
  an about section like POLY-02.

Acceptance:

- [ ] 100 rows on load; `Show more` adds 100; count reads "1,000 traders".
- [ ] Switching period reorders rows to match the API for that period.
- [ ] Search narrows rows and keeps original rank numbers.
- [ ] Layout holds at 390, 768 and 1440 px without horizontal scroll.

### 4.4 Trader profile `/account/[id]` (R-04)

- **PROF-01** Header: 76 px avatar, name (24 px bold), platform icon link, X
  handle link, platform badge, "Joined {month year} · {views} views". For
  Polymarket traders a short monospace wallet line follows.
- **PROF-02** Month strip (collapsed, 51 px): previous and next month buttons,
  month label, month P&L, wins and losses ("8W / 4L"), a row of small colored
  day bars, and a chevron that expands it.
- **PROF-03** Expanded calendar: Daily and Monthly switch, weekday header,
  seven-column grid of day cells with the day number and compact P&L; cell
  color by sign and size; legend.
- **PROF-04** P&L history card: line chart of cumulative P&L, dashed zero
  line, about five date ticks and four or five money ticks, no grid lines.
- **PROF-05** P&L by category card (Kalshi only): last-24h movers, then one
  row per category with markets traded, a proportional bar and the amount.
- **PROF-06** Three share cards (month plus all-time, P&L chart, month): a
  server-rendered image with a month or range picker and share, copy, download
  and post buttons. **Extra: first to cut.**
- **PROF-07** Smart Score card: score, tier chip, then win rate, Sharpe, max
  drawdown, profit factor and R squared in a grid (two columns on mobile, five
  on desktop).
- **PROF-08** Link back to the leaderboard. Footer with a one-line tagline.
- **PROF-09** Accent follows the platform (TOK-06): badge, month strip top
  border and Smart Score top border.
- **PROF-10** Page title: name, all-time P&L, site name.

Not observed on the page: open positions or trades tables. The API has
endpoints for them, but the profile did not request them.

Acceptance:

- [ ] A Kalshi and a Polymarket profile both render PROF-01 to PROF-05 and
      PROF-07 to PROF-10 with values equal to the API responses.
- [ ] Unknown id returns a 404 page.
- [ ] Month navigation changes the strip; expanding shows the calendar.
- [ ] Chart renders the full history and its first and last points match the
      API.
- [ ] Layout holds at 390, 768 and 1440 px.

### 4.5 Battle `/battle` (R-05)

- **BATTLE-01** Centered heading and subtitle.
- **BATTLE-02** Card with two traders side by side and "VS" between: ringed
  avatar (128 px, 96 px on mobile), handle link, platform label, X link.
- **BATTLE-03** "Relative Performance" card: legend, two-line chart (one color
  per platform) of P&L change since a common start date, dashed zero line,
  caption.
- **BATTLE-04** The pair is fixed by the source (a specific promotion with a
  named host). It is not a selector.

Acceptance:

- [ ] Both traders and the two-line chart render; lines start at zero.
- [ ] Layout holds at 390 and 1440 px.

### 4.6 API reference `/api-docs` (R-06)

- **API-01** Heading, intro, base URL and credit request.
- **API-02** Example block with a language label and a copy button.
- **API-03** One card per endpoint (14): method and path in monospace, copy
  button, description, parameters, a "try" link, field list.
- **API-04** Rate-limit paragraph.

Our version documents the endpoints this demo actually uses and points to the
upstream reference for the rest.

Acceptance:

- [ ] Every endpoint this demo calls is listed with its parameters.
- [ ] Copy buttons copy; try links open.

### 4.7 Submit `/submit` (R-07)

- **SUB-01** Heading, intro and a form: X handle, platform select (Polymarket,
  Kalshi, Both), wallet or username, P&L, submit button. The source also has a
  hidden anti-spam field.
- **SUB-02** Ours: same screen, fields and button disabled, with a visible
  note that this demo collects nothing.

Acceptance:

- [ ] No network request is made from this page. Fields cannot be submitted.

### 4.8 Terms `/terms` (R-08)

- **TERMS-01** A plain text page of numbered sections. Only its text was
  read; its layout was not measured, so the top-bar shell is an assumption.
  Ours carries our own short terms and the disclaimer.

## 5. Data contracts

All calls go to the source's documented public API from our server, are
validated with Zod and are cached. Shapes below were recorded on 2026-11-14.

- **DATA-01** `GET /api/leaderboard?period=1d|7d|30d|90d|ytd|all` returns
  `{ lastUpdated, traders[] }`. Trader: `rank`, `name`, `platform`
  (`polymarket`, `kalshi`, `both`, `hyperliquid`), `wallet` (nullable),
  `additional_wallets[]`, `wallet_count`, `kalshi_username` (nullable),
  profile URLs per platform, `pfp`, `twitter` (empty string when none),
  `join_date`, `affiliated`, `allTimePnl`, `stats { pnl, buys, sells }`,
  `smart_score` (nullable: `score`, `tier`, `winRate`, `sharpeRatio`,
  `sharpe1d`, `sharpe1w`, `sharpe1m`, `maxDrawdownPercent`, `profitFactor`,
  `rSquared`), optional `roi`, `sports_share`, `esports_share`, and
  `day_mover { label, change, icon? }` in `1d` only.
- **DATA-02** `GET /api/daily-profit` returns `{ daily_profit, raw,
  traders_count }`; `daily_profit` is already formatted.
- **DATA-03** `GET /api/kalshi-leaderboard?period=1d|7d|30d|all&limit=1..2000`
  returns `{ lastUpdated, period, total, tracked, traders[] }`. Trader:
  `rank`, `kalshi_username`, `name`, `pfp` (relative path), `pnl`, `pnl_all`,
  `kalshi_url`, `profile_path` (nullable), `last_synced_at`, `sports_share`,
  `tracked`, `x_handle` (nullable).
- **DATA-04** `GET /api/trader/{id}` returns `{ trader }` with `name`,
  `platform`, wallets, `kalshi_username`, profile URLs, `pfp`, `twitter`,
  `join_date` (ISO for Polymarket, "Nov 2024" for Kalshi), `views`,
  `portfolio_value`, `largest_win` (string), `smart_score`, and `stats` keyed
  by `1d`, `7d`, `30d`, `all`.
- **DATA-05** `GET /api/kalshi/{username}/history` returns `{ history[]
  { timestamp, pnl, date }, dataPoints, firstDate, lastDate }`.
- **DATA-06** `GET /api/kalshi/{username}/categories` returns `{ categories[]
  { category, pnl, markets } }`.
- **DATA-07** Freshness stated by the source: Polymarket P&L about every 5
  minutes; Kalshi snapshots hourly to two-hourly. Our cache revalidates no
  faster than that.
- **DATA-08** Nullable and optional fields above are real: schemas must accept
  them, and the UI must show a dash, never crash.

The source pages also call endpoints that are **not** in its public reference:
Polymarket P&L history, Kalshi 24h category change, the battle comparison, an
X avatar proxy, share-image variants and a `nonSports` parameter. See Q-02.

## 6. Checks this spec feeds

`docs/EVALS.md` turns each acceptance list into a parity matrix row per route
and viewport, and each FMT rule into unit tests.

## 7. Deliberate differences from the source

- **DEV-01** Original name, logo, copy, accent color and favicon; no social
  preview image. Disclaimer in the footer of every page.
- **DEV-02** Data is fetched on our server and cached; the source fetches from
  the browser.
- **DEV-03** Skeletons, an empty-search message and error states with a
  labeled snapshot fallback (STATE-03).
- **DEV-04** No analytics scripts.
- **DEV-05** No referral parameters on outbound platform links.
- **DEV-06** Submit form is disabled (SUB-02).
- **DEV-07** Footer credits the data source and links back, as its API terms
  ask.
- **DEV-08** Letter badges in our own colors replace the platform and X logos,
  which are trademarks (D-018).
- **DEV-09** No "our traders" filter (D-014).
- **DEV-10** Pages are marked noindex (D-020).
- **DEV-11** "Joined" is counted to the data timestamp, not the visitor's
  clock (D-022).
- **DEV-12** Sortable headers are real buttons, so sorting works from the
  keyboard. The source's headers respond to the mouse only.
- **DEV-13** No footer link to an X account: the source links its own.
- **DEV-14** Optional columns are hidden below 640 px along with their
  toggles. On the source a column switched on at desktop width stays on a
  narrow screen.
- **DEV-15** While the page shows the saved snapshot, a banner says how many
  of the upstream traders it holds for the selected period.
- **DEV-16** The Kalshi non-sports toggle filters the fetched top 1,000
  locally (433 traders on 2026-11-14) instead of asking the source's server
  (472), whose parameter is undocumented (D-012).
- **DEV-17** From phase 3 until phase 4, profiles showed a P&L-by-period
  card in place of the month strip and history chart (D-031). Phase 4
  replaced it with PROF-02 to PROF-05; the interim card is gone.
- **DEV-18** Skeleton rows while a period loads; a failed load says so and
  offers a retry (STATE-03).
- **DEV-19** The "Today" total is shown only next to live rows; beside the
  snapshot it shows a dash.
- **DEV-20** The category card has no "Last 24h" movers row: its data comes
  from an undocumented endpoint (D-039).
- **DEV-21** No share cards (PROF-06, first to cut; D-039).
- **DEV-22** A trader listed only on Hyperliquid gets a message in place of
  the history chart and calendar: there is no documented history for them
  (D-035).
- **DEV-23** Calendar days are UTC days (D-036). For the trader recorded on
  2026-11-14, 9 of 11 monthly totals equal the source's; August and
  September 2026 differ by about $2.5K and $1.2K, months where the history
  has gaps.
- **DEV-24** Polymarket history comes from Polymarket's documented data API,
  not the source's undocumented history route (D-035). For the trader
  compared, the chart's labels are the same.
- **DEV-25** The head-to-head comparison is computed from the documented
  Kalshi history and Polymarket P&L series, not the source's undocumented
  battle route. Start and both baselines equal the source's (D-043).
- **DEV-26** The head-to-head page ends with a back link, the disclaimer and
  the data credit where the source shows its host promotion (D-014, D-045).
- **DEV-27** The site footer links to the head-to-head page (D-045).
- **DEV-28** The head-to-head chart's six date labels are evenly spaced in
  time. The source's six are unevenly spaced, by a rule we could not
  derive from one chart, so its dates differ (it showed Sep 27, Dec 6,
  Jan 2, Mar 12, Jun 22, Oct 28).
- **DEV-29** On phones the platform and X badges in a board row are 4 px
  apart, not 2 px, so each 20 px link meets WCAG 2.5.8 (D-049).
- **DEV-30** One visible focus ring on every control, drawn inside where a
  container would cut it off (D-049). The source uses the browser default.
- **DEV-31** A loading skeleton while a profile that is not cached yet is
  built (D-048).

## 8. Questions resolved by the owner (2026-11-14)

- **Q-01 Data source.** The source's documented public API, fetched on our
  server and cached, with a snapshot fallback (D-011).
- **Q-02 Undocumented endpoints.** Not used. Polymarket history comes from
  Polymarket's own data API; the Kalshi non-sports toggle filters locally
  (D-012).
- **Q-03 Avatars.** Loaded from the URLs in the API response, with an initials
  fallback (D-013).
- **Q-04 Source-specific features.** The "our traders" filter is dropped. The
  battle page is a neutral head-to-head of the same two public profiles
  (D-014).
- **Q-05 Privacy page.** Added (D-015).
