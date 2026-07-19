# Phase 4 — Data depth + Alerts

Goal: give Fixture Radar the historical and cross-competition depth companies expect, and add a working alerts system so sponsors/agencies get pinged when something matters. Since Stripe isn't live yet, tier gating is enforced by admin role (any signed-in user with `admin` role gets the "Studio" surface) — trivial to swap for a real `tier` check later.

## 1. Historical seasons backfill (3 seasons)

- Extend `fixtures` and `standings` with a `season` filter usage (column already exists).
- Update `src/routes/api/public/hooks/refresh-football-data.ts`:
  - Accept an optional `?season=2023` query param.
  - When absent, refresh current season (unchanged behaviour, keeps 6-hour cron intact).
  - When present, fetch that season's fixtures + final standings from football-data.org and upsert.
- Add a one-off admin button on `/admin` → "Backfill season" (2023, 2024, 2025) that POSTs to the hook with the secret. Results appear in `refresh_log`.
- Historical results feed a new **season-over-season comparison** widget on the Sponsor Lens fixture one-pager: "last season this fixture drew X goals, Y-place-vs-Y-place, upset yes/no". Pure read from existing rows.

## 2. Extra competitions (Championship + WSL)

- Add a `competitions` table: `code` (PL/ELC/WSL), `name`, `tier` (`free`/`studio`).
- Extend `fixtures` and `teams` with `competition_code` (default `PL` for existing rows via migration).
- Refresh hook loops over enabled competitions instead of hardcoded `PL`.
- Nav filter chip: "PL / Championship / WSL" on This Week, Season Radar, Table.
- Non-PL competitions gated: unauthenticated → see teaser row with lock icon + "Available on Sponsor Studio" CTA (`mailto:` link).

## 3. Alert rules

New tables (all RLS-scoped to `auth.uid()`):

- `alert_rules`: `id`, `user_id`, `sponsor_id` (nullable), `rule_type` (`content_score_threshold` | `marquee_out` | `streak` | `upset`), `threshold` (numeric), `channel` (`email` | `slack` | `teams`), `webhook_url` (nullable, for slack/teams), `active`.
- `alert_deliveries`: `id`, `rule_id`, `fixture_id` (nullable), `payload` (jsonb), `delivered_at`, `status`.

UI:

- New `/alerts` route (authenticated) — list rules, create/edit/delete, test-fire button.
- Simple form: rule type → threshold → channel → destination.

Evaluation:

- New scheduled route `src/routes/api/public/hooks/evaluate-alerts.ts`, cron every 30 min via `pg_cron` with `apikey` header.
- Iterates active rules, evaluates against current fixture/score/standings/marquee data, inserts to `alert_deliveries`, and:
  - `email` → uses Lovable managed email (`@lovable.dev/email-js`, verified domain send from `alerts@`).
  - `slack` / `teams` → simple `fetch` POST to the webhook URL with a formatted card.
- Dedup: `unique(rule_id, fixture_id, rule_type)` so the same match isn't re-sent every 30 min.

## 4. Admin surface additions

- On `/admin`: new "Alerts" card showing recent `alert_deliveries` (last 20) + a "Backfill season" panel + a "Competitions" toggle list.

## 5. Landing page copy tweak

- Add a fourth "Why teams switch" tile: **"Alerts when it matters"** — Slack/Teams/email when your fixture crosses a threshold or your marquee player is ruled out.
- Update `/about` scoring page with a short "Historical context" section explaining prior-season lookups.

## Technical notes

- Migrations create `competitions`, `alert_rules`, `alert_deliveries` with `GRANT`s + RLS in the same file.
- Cron for alerts uses the documented `apikey: <anon-key>` pattern; no new shared secret.
- Backfill respects football-data.org free-tier rate limits: sequential per season, 6s sleep between requests inside the hook when `?season=` is set.
- Slack/Teams webhook URLs are stored per-rule (not a project secret) — each user owns their integration, no admin coupling.
- Email sending uses managed Lovable email; no SMTP secret needed. If the user's project doesn't have a verified sender yet, the alert route falls back to logging the payload and marking `status='pending_email_setup'`.
- No Stripe entitlement checks yet: "Studio" features gate on `has_role(auth.uid(), 'admin')`. When Stripe lands, swap the check for a `subscriptions.tier` lookup — single-file change.

## Out of scope (park)

- Real per-tier billing enforcement (waits for Stripe phase).
- Historical data for Championship/WSL beyond the current season (PL only for 3-season backfill to stay inside free-tier API limits).
- SMS / push notifications.

---

Reply "go" to build, or tell me which chunk to drop/reorder (e.g. skip WSL, or do alerts first without the backfill).
