
# Fixture Radar → "Sponsorship Intelligence" B2B upgrade

Goal: keep the personal PL fan tool intact, but layer on features and packaging that make sponsor brands, agencies, and hospitality teams open their wallets. This is a strategy + build plan — the exact features to add, what companies want to *see*, how to price it, and how to frame it so a decision-maker "gets it" in 10 seconds on the landing page.

---

## 1. Who actually pays for this, and why

Three buyer profiles drive every feature and price choice below:

- **Sponsor brands** (beer, betting, airlines, telco, banks, watches) — sponsor a club or the league. Want ROI on their money: which fixtures give them the most eyeballs, best hospitality moments, safest brand context.
- **Sponsorship agencies** (M&C Saatchi Sport, CSM, Two Circles-style) — manage 5–20 brand clients. Want one dashboard with per-client views + white-labelled PDFs to send to clients.
- **Club commercial / hospitality teams** — sell hospitality boxes and matchday packages. Want to price boxes dynamically and pitch sponsors on which specific fixtures to activate.

Rights-holders (Sky, TNT, PL comms) are a bonus buyer for the *content* engine (which matches to promote), but the money is in the three above.

## 2. Features to add — what companies expect to see

Grouped by which buyer they unlock. Everything reads from the existing `fixtures`, `standings`, `marquee_players`, `sponsor_profiles`, `link_clicks` tables plus a few new ones.

### 2a. Sponsor ROI dashboard (brands + agencies)

The current Sponsor Lens shows hospitality score. Buyers want a *money-shaped* number next to it.

- **Estimated impressions per fixture**: broadcast reach × on-screen brand seconds (LED, kit, perimeter). Seed with public averages per broadcaster slot (Sunday 4pm > Saturday 3pm blackout).
- **Estimated media value (EMV)**: impressions × CPM benchmark, editable per brand. Show as £ per fixture, £ per season.
- **Cost-per-hospitality-guest**: box price ÷ hospitality score. Ranks the "best value" fixtures for a sponsor to invite guests to.
- **Audience fit score**: sponsor category × club fanbase demographics (age skew, region, income bucket) — seed from public YouGov/statista-style buckets, editable.
- **Competitor collision alerts**: if a rival brand in the same category (e.g. two beer sponsors) both have visibility in the same fixture, flag it.

### 2b. Guest-list & hospitality planner (brands + clubs)

- **Guest list per fixture** table: name, company, dietary, ticket count, box location, notes. CSV import/export.
- **Auto-suggest** which of your guests to invite to which fixture based on their favourite club, industry, and past attendance.
- **Post-event survey link** auto-generated per fixture, results feed back into a "Best events of the season" report.

### 2c. Content & PR planner (brands + comms)

- **Content calendar view** — the existing Content Score turned into a Gantt-style month grid, exportable to iCal/Google Calendar.
- **Angle templates per sponsor** — e.g. a beer brand gets "matchday pub push" angles; an airline gets "travelling-fans route" angles. Editable in admin.
- **Social copy generator** using Lovable AI (already available via `LOVABLE_API_KEY`) — one click per fixture produces 3 tweet-length + 1 LinkedIn post variations, brand-safe tone, no scraping.
- **Brand-safety flags** — automatic warnings for fixtures with a betting sponsor when clubs have alcohol/gambling restrictions, minors' matches, etc.

### 2d. Agency multi-brand workspace

- **Client switcher** in the top nav — one login, N sponsor profiles, each with its own dashboard, saved reports, exports.
- **White-label PDF export** — one-click "Weekly briefing" per client, agency logo + colours, delivered by email every Monday 8am UK.
- **Comparison mode** — pick 2–3 sponsors and compare their fixture calendars, EMV, and audience overlap.

### 2e. Live-updated storylines & alerts (all buyers)

- **Alert rules**: "email me when a fixture I'm sponsoring crosses Content Score 8.0", "when my club goes on a 4-win streak", "when a marquee player is ruled out".
- **Slack / Teams / email delivery** via a `notifications` table + a scheduled server route.
- **Storyline auto-drafts** — after each matchday, generate a 200-word recap per sponsored club, ready to paste into internal comms.

### 2f. Data depth companies expect before they pay

The free tier already has PL. To be credible for £-figure contracts, add:

- **Historical 3–5 seasons** of fixtures/results (football-data.org supports this) so EMV benchmarks are trend-lines, not single points.
- **Championship + Women's Super League** as upsell tiers (many sponsors care about both).
- **UEFA competitions** for the top-6 clubs (already in football-data.org).
- **Weather + kickoff-time overlay** — cold Sunday 8pm affects hospitality attendance; sponsors ask.

## 3. Monetisation model

Recommendation: **keep Fixture Radar free for fans, put the sponsor/agency features behind a subscription**, sold self-serve. Don't sell the whole product to one company yet — recurring SaaS gives more optionality and the current tooling is already multi-tenant-friendly.

### 3a. Tiers

| Tier | Price | For | Includes |
| --- | --- | --- | --- |
| **Radar Free** | £0 | Fans, journalists | Current site: Content Score, This Week, Season Radar, Table, Storylines |
| **Radar Pro** | £29 / month | Solo marketers, small clubs, students | 1 saved sponsor profile, private CSV export, weekly email brief, alert rules |
| **Sponsor Studio** | £249 / month | One brand | Everything in Pro + EMV & audience-fit scores, guest-list planner, brand-safety flags, unlimited exports, custom marquee-player list, historical seasons |
| **Agency** | £899 / month (up to 10 client workspaces, then £75/client) | Sponsorship agencies | Everything in Studio × N clients + white-label PDF, Slack/Teams delivery, comparison mode, seat-based team access |
| **Enterprise / rights-holder** | Custom (£25k+/yr) | Clubs, leagues, broadcasters | API access, on-premise export, SSO, historical data licensing, priority support |

### 3b. Why this shape

- Fans stay free → SEO, LinkedIn shares, sponsor decision-makers discover it organically.
- Pro is a low-friction "credit card in the drawer" tier — captures individual fans who work at brands and want the private views.
- Studio is the real product for one brand. Named brand as the anchor: "Amber Lager pays £249/mo" is a repeatable story.
- Agency tier is the scale play — one sale unlocks 10× the ARPU.
- Enterprise is the ceiling and gives a credible "starting from" story on the pricing page.

### 3c. Billing implementation

Use Lovable's built-in Stripe payments (`enable_stripe_payments`), not the BYOK integration. Digital-only SaaS in the UK → full compliance handling by default (Stripe as merchant of record, +3.5%). Products created via `batch_create_product`: `radar_pro_monthly`, `sponsor_studio_monthly`, `agency_monthly`, plus annual variants at 2 months free.

Entitlements table: `subscriptions(user_id, tier, seats, current_period_end, status)`. Feature gates in the UI check the tier and either show or CTA-upsell.

## 4. Marketing / landing page — the "10-second pitch"

Replace the current IntroModal for logged-out visitors with a homepage that reads *as if it were written for a Head of Sponsorship at a beer brand*. Fans still get everything free below the fold; buyers convert above it.

### 4a. Hero (above the fold)

- **Headline**: "See every Premier League fixture the way your sponsorship team should."
- **Sub**: "Fixture Radar scores all 380 matches for content value, hospitality value, and estimated media value — so your brand shows up in the right moments, not just the loud ones."
- **Two CTAs**: "See the Amber Lager example →" (opens the seeded example, no signup) and "Start free trial" (Stripe).
- **Proof strip**: static logos of buyer categories (agency, brand, club, broadcaster) with the label "Built for" — until real logos exist, use neutral category chips.

### 4b. "Why teams switch to Fixture Radar" — 3 tiles

1. **Every fixture, scored** — Content Score + Hospitality Score + EMV in one row. Sample screenshot.
2. **Your brand, your view** — private sponsor profiles with your own guest lists, audience fit, and PDF exports.
3. **Weekly briefing, zero admin** — Monday 8am UK, straight to your inbox and Slack.

### 4c. Interactive teaser

Live-embedded Sponsor Lens for the beer example on the landing page itself (not behind a modal) — the visitor scrolls and immediately sees a ranked fixture list with £ signs. This is the single biggest conversion lever: nobody buys sponsorship tools they haven't seen work.

### 4d. Pricing section

Four-column pricing table using the tiers above. "Most popular" badge on Sponsor Studio. Annual toggle. FAQ underneath covering: cancel any time, all data from football-data.org, no scraping, GDPR, invoice billing for Agency+.

### 4e. Update the IntroModal

Keep the tour for fans, but add a first slide that switches copy based on referrer:
- If `?utm_source=linkedin` or `?ref=agency` → "You look like an agency — here's the 60-second version" with a link to the Agency tier.
- Otherwise → the current fan tour.

### 4f. One-line summary you can paste anywhere

> Fixture Radar turns the Premier League calendar into a sponsorship intelligence dashboard: every fixture scored for content, hospitality, and media value, private views per brand, and weekly briefings your team actually reads.

## 5. Build order (phased so nothing is wasted)

**Phase 1 — landing page + Stripe (1 build session)**
- New `/` homepage with the hero, tiles, embedded Sponsor Lens teaser, pricing table.
- Move current fan home to `/app`.
- Enable Stripe payments, create the 3 self-serve products, add `subscriptions` table + entitlement checks. Gate Sponsor Studio features behind `tier >= studio`.

**Phase 2 — Sponsor Studio depth (1–2 sessions)**
- EMV score, audience-fit score, competitor-collision flag added to `hospitality-score.ts`.
- Guest-list table + per-fixture planner UI.
- Weekly briefing: scheduled server route that renders a PDF (or HTML email) and sends via a mail connector.

**Phase 3 — Agency tier (1 session)**
- `workspaces` and `workspace_members` tables, client switcher in nav.
- White-label PDF export (agency logo + colour saved on workspace).
- Comparison mode.

**Phase 4 — Data depth + alerts (1 session)**
- Backfill 3 seasons of fixtures/results via the existing refresh route.
- Championship + WSL ingestion behind Studio tier.
- Alert rules + Slack/Teams/email delivery.

## 6. Technical notes (for the build phase)

- New tables: `subscriptions`, `workspaces`, `workspace_members`, `guest_lists`, `guests`, `alert_rules`, `email_deliveries`, plus expanding `sponsor_profiles` with `cpm_gbp`, `logo_url`, `brand_color`.
- All new tables need RLS with `auth.uid()` scoping and explicit `GRANT` in the same migration.
- EMV, audience-fit, competitor-collision logic lives in `src/lib/sponsor-metrics.ts` next to the existing `hospitality-score.ts`.
- Weekly briefing runs on `pg_cron` hitting `/api/public/cron/weekly-briefing` with a `CRON_SECRET` header.
- Social copy generator uses the Lovable AI gateway (no extra key), model `google/gemini-2.5-flash` for cost.
- Stripe webhooks land at `/api/public/stripe/webhook`; write to `subscriptions` after signature verification.
- Landing page metrics tracked with the existing `link_clicks` analytics — add `landing-hero-cta`, `landing-pricing-cta`, `landing-example-open` keys.

## 7. Out of scope for now (park these)

- Selling the whole codebase to one company. Doable but caps upside and forces support obligations. Revisit if an inbound offer comes in.
- White-glove data services (bespoke reports). Offer only after 3 paying customers exist.
- Non-football sports. The scoring engine generalises, but distribution is football-first.

---

Reply with which phase to start with, or ask for changes to the pricing / feature list before we build.
