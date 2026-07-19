import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchMarqueePlayers, fetchTeams } from "@/lib/queries";
import type { MarqueePlayer, TeamLite } from "@/lib/content-score";
import { toCsv, downloadCsv } from "@/lib/csv";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Marquee players" },
      { name: "description", content: "Manage the marquee player list that drives the Star Power score." },
    ],
  }),
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setIsAdmin(false);
        return;
      }
      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(Boolean(roleData));
    })();
  }, []);

  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: fetchTeams });
  const { data: players = [] } = useQuery({ queryKey: ["marquee"], queryFn: fetchMarqueePlayers });

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [tier, setTier] = useState<"tier1" | "tier2">("tier2");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !teamId) return;
    setBusy(true);
    setErr(null);
    const { error } = await (supabase as any)
      .from("marquee_players")
      .insert({ player_name: name.trim(), team_id: teamId, tier });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setName("");
    qc.invalidateQueries({ queryKey: ["marquee"] });
    qc.invalidateQueries({ queryKey: ["fixture-data"] });
  }

  async function updateTier(id: string, next: "tier1" | "tier2") {
    const { error } = await (supabase as any).from("marquee_players").update({ tier: next }).eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["marquee"] });
    qc.invalidateQueries({ queryKey: ["fixture-data"] });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("marquee_players").delete().eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["marquee"] });
    qc.invalidateQueries({ queryKey: ["fixture-data"] });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground">Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Not an admin yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in but don't have the admin role. Grant yourself admin access by
          running this SQL against the database (one time only):
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-surface-2 p-3 text-[11px]">
{`insert into public.user_roles (user_id, role)
values ('${userId ?? "<your-user-id>"}', 'admin');`}
        </pre>
        <div className="mt-6 flex gap-2 text-xs">
          <button onClick={signOut} className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">
            Sign out
          </button>
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const teamById = new Map<number, TeamLite>(teams.map((t) => [t.id, t]));
  const grouped = new Map<number, MarqueePlayer[]>();
  for (const p of players) {
    if (!grouped.has(p.team_id)) grouped.set(p.team_id, []);
    grouped.get(p.team_id)!.push(p);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Marquee players</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tier 1 (global superstar) = 10 pts each · Tier 2 (rising star) = 5 pts each · capped
            at 20 per fixture. Star Power updates automatically as you edit.
          </p>
        </div>
        <button onClick={signOut} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2">
          Sign out
        </button>
      </header>

      <form onSubmit={addPlayer} className="card-glass mb-8 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Player</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Erling Haaland"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Club</label>
          <select
            value={teamId ?? ""}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Select club…</option>
            {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as "tier1" | "tier2")}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="tier1">Tier 1 · 10 pts</option>
            <option value="tier2">Tier 2 · 5 pts</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim() || !teamId}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Add player
        </button>
        {err && <div className="w-full text-xs text-destructive">{err}</div>}
      </form>

      <div className="space-y-6">
        {[...grouped.entries()]
          .sort(([a], [b]) => (teamById.get(a)?.name ?? "").localeCompare(teamById.get(b)?.name ?? ""))
          .map(([tid, list]) => (
            <section key={tid}>
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider">
                {teamById.get(tid)?.crest && (
                  <img src={teamById.get(tid)!.crest!} alt="" className="size-5" />
                )}
                {teamById.get(tid)?.name ?? `Team ${tid}`}
              </h2>
              <ul className="divide-y divide-border/60 rounded-md border border-border">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                    <span className="flex-1 text-sm">{p.player_name}</span>
                    <select
                      value={p.tier}
                      onChange={(e) => updateTier(p.id, e.target.value as "tier1" | "tier2")}
                      className="rounded border border-border bg-surface px-2 py-1 text-xs"
                    >
                      <option value="tier1">Tier 1</option>
                      <option value="tier2">Tier 2</option>
                    </select>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>

      <LinkAnalyticsSection />
    </div>
  );
}

const ALL_KEYS = [
  "linkedin",
  "contact",
  "football-data",
  "fixture-card",
  "fixture-angle",
  "fixture-card-dwell",
  "fixture-angle-dwell",
] as const;
type LK = (typeof ALL_KEYS)[number];


function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type ClickRow = {
  id: string;
  link_key: string;
  href: string | null;
  referrer: string | null;
  user_agent?: string | null;
  created_at: string;
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Monday=0
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function parseFixtureRef(href: string | null): { fixtureId: string; matchup: string; angle?: string } | null {
  if (!href) return null;
  // formats: "fixture:<id>:<matchup>"  or  "fixture:<id>:<matchup>::<angle>"
  const m = href.match(/^fixture:(\d+):(.+?)(?:::(.+))?$/);
  if (!m) return null;
  return { fixtureId: m[1], matchup: m[2], angle: m[3] };
}

function parseDwellMs(href: string | null): number | null {
  if (!href) return null;
  const m = href.match(/::dwell_ms:(\d+)$/);
  return m ? Number(m[1]) : null;
}

function stripDwell(href: string | null): string | null {
  if (!href) return null;
  return href.replace(/::dwell_ms:\d+$/, "");
}

function angleTemplate(angle: string): string {
  // Collapse specific team/player names into a template shape (strip numbers, TitleCase clusters).
  return angle
    .replace(/\b\d+\b/g, "N")
    .replace(/\s+/g, " ")
    .trim();
}

function parseContext(ctx: string | null): { referrer: string; page: string; utm: Record<string, string> } {
  if (!ctx) return { referrer: "", page: "", utm: {} };

  const refMatch = ctx.match(/ref=([^|]*)/);
  const pageMatch = ctx.match(/page=(.+)$/);
  const referrer = (refMatch?.[1] ?? "").trim();
  const page = (pageMatch?.[1] ?? "").trim();
  const utm: Record<string, string> = {};
  const qIdx = page.indexOf("?");
  if (qIdx >= 0) {
    const sp = new URLSearchParams(page.slice(qIdx));
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = sp.get(k);
      if (v) utm[k] = v;
    }
  }
  return { referrer, page, utm };
}

function referrerHost(referrer: string): string {
  if (!referrer) return "(direct)";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.slice(0, 40);
  }
}


function LinkAnalyticsSection() {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 29);

  const [start, setStart] = useState<string>(toYMD(defaultStart));
  const [end, setEnd] = useState<string>(toYMD(today));
  const [selected, setSelected] = useState<Set<LK>>(new Set(ALL_KEYS));
  const [granularity, setGranularity] = useState<"day" | "week">("day");

  const { data: clicks = [], refetch } = useQuery({
    queryKey: ["link-clicks", start, end],
    queryFn: async () => {
      const startIso = new Date(start + "T00:00:00Z").toISOString();
      const endIso = new Date(end + "T23:59:59Z").toISOString();
      const { data, error } = await (supabase as any)
        .from("link_clicks")
        .select("id, link_key, href, referrer, user_agent, created_at")
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as ClickRow[];
    },
  });

  const filtered = clicks.filter((c) => selected.has(c.link_key as LK));

  const totals = new Map<string, number>();
  const last7 = new Map<string, number>();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const c of filtered) {
    totals.set(c.link_key, (totals.get(c.link_key) ?? 0) + 1);
    if (new Date(c.created_at).getTime() >= cutoff) {
      last7.set(c.link_key, (last7.get(c.link_key) ?? 0) + 1);
    }
  }
  const visibleKeys = ALL_KEYS.filter((k) => selected.has(k));

  // Build time series at chosen granularity
  const bucketMap = new Map<string, Record<string, number>>();
  const startD = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");
  const step = granularity === "day" ? 1 : 7;
  const iter = granularity === "day" ? new Date(startD) : startOfWeek(startD);
  while (iter <= endD) {
    const key = toYMD(iter);
    const row: Record<string, number> = {} as any;
    (row as any).date = key;
    for (const k of visibleKeys) row[k] = 0;
    bucketMap.set(key, row);
    iter.setUTCDate(iter.getUTCDate() + step);
  }
  for (const c of filtered) {
    const d = new Date(c.created_at);
    const bucket = granularity === "day" ? toYMD(d) : toYMD(startOfWeek(d));
    const row = bucketMap.get(bucket);
    if (row) row[c.link_key] = ((row[c.link_key] as number) ?? 0) + 1;
  }
  const series = Array.from(bucketMap.values()).sort((a: any, b: any) =>
    (a.date as string).localeCompare(b.date as string),
  );

  // Drill-downs: top fixtures & top angle templates (with dwell aggregation)
  type FixEntry = {
    matchup: string;
    cardClicks: number;
    angleClicks: number;
    cardDwellMsTotal: number;
    cardDwellSamples: number;
    angleDwellMsTotal: number;
    angleDwellSamples: number;
  };
  const emptyFix = (matchup: string): FixEntry => ({
    matchup,
    cardClicks: 0,
    angleClicks: 0,
    cardDwellMsTotal: 0,
    cardDwellSamples: 0,
    angleDwellMsTotal: 0,
    angleDwellSamples: 0,
  });
  const fixtureCounts = new Map<string, FixEntry>();
  type AngleEntry = { clicks: number; dwellMsTotal: number; dwellSamples: number };
  const angleCounts = new Map<string, AngleEntry>();
  // Referrer + UTM breakdowns
  const referrerCounts = new Map<string, number>();
  const utmSourceCounts = new Map<string, number>();

  for (const c of filtered) {
    const ctx = parseContext(c.referrer);
    referrerCounts.set(referrerHost(ctx.referrer), (referrerCounts.get(referrerHost(ctx.referrer)) ?? 0) + 1);
    const src = ctx.utm.utm_source ?? "(none)";
    utmSourceCounts.set(src, (utmSourceCounts.get(src) ?? 0) + 1);

    const isFixtureEvent =
      c.link_key === "fixture-card" ||
      c.link_key === "fixture-angle" ||
      c.link_key === "fixture-card-dwell" ||
      c.link_key === "fixture-angle-dwell";
    if (!isFixtureEvent) continue;

    const parsed = parseFixtureRef(stripDwell(c.href));
    if (!parsed) continue;
    const entry = fixtureCounts.get(parsed.fixtureId) ?? emptyFix(parsed.matchup);
    const dwell = parseDwellMs(c.href);

    if (c.link_key === "fixture-card") entry.cardClicks += 1;
    else if (c.link_key === "fixture-angle") entry.angleClicks += 1;
    else if (c.link_key === "fixture-card-dwell" && dwell != null) {
      entry.cardDwellMsTotal += dwell;
      entry.cardDwellSamples += 1;
    } else if (c.link_key === "fixture-angle-dwell" && dwell != null) {
      entry.angleDwellMsTotal += dwell;
      entry.angleDwellSamples += 1;
    }
    fixtureCounts.set(parsed.fixtureId, entry);

    if ((c.link_key === "fixture-angle" || c.link_key === "fixture-angle-dwell") && parsed.angle) {
      const tpl = angleTemplate(parsed.angle);
      const ae = angleCounts.get(tpl) ?? { clicks: 0, dwellMsTotal: 0, dwellSamples: 0 };
      if (c.link_key === "fixture-angle") ae.clicks += 1;
      else if (dwell != null) {
        ae.dwellMsTotal += dwell;
        ae.dwellSamples += 1;
      }
      angleCounts.set(tpl, ae);
    }
  }

  const topFixtures = Array.from(fixtureCounts.entries())
    .map(([id, v]) => ({
      id,
      ...v,
      total: v.cardClicks + v.angleClicks,
      avgCardDwellMs: v.cardDwellSamples ? Math.round(v.cardDwellMsTotal / v.cardDwellSamples) : 0,
      avgAngleDwellMs: v.angleDwellSamples ? Math.round(v.angleDwellMsTotal / v.angleDwellSamples) : 0,
    }))
    .sort((a, b) => b.total - a.total || b.avgCardDwellMs - a.avgCardDwellMs)
    .slice(0, 10);
  const topAngles = Array.from(angleCounts.entries())
    .map(([tpl, v]) => ({
      tpl,
      clicks: v.clicks,
      avgDwellMs: v.dwellSamples ? Math.round(v.dwellMsTotal / v.dwellSamples) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.avgDwellMs - a.avgDwellMs)
    .slice(0, 10);

  const topReferrers = Array.from(referrerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topUtmSources = Array.from(utmSourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Aggregate dwell for the summary strip.
  const dwellSummary = { card: { total: 0, n: 0 }, angle: { total: 0, n: 0 } };
  for (const c of filtered) {
    const ms = parseDwellMs(c.href);
    if (ms == null) continue;
    if (c.link_key === "fixture-card-dwell") { dwellSummary.card.total += ms; dwellSummary.card.n += 1; }
    else if (c.link_key === "fixture-angle-dwell") { dwellSummary.angle.total += ms; dwellSummary.angle.n += 1; }
  }
  const avgCardDwellS = dwellSummary.card.n ? (dwellSummary.card.total / dwellSummary.card.n / 1000).toFixed(1) : "—";
  const avgAngleDwellS = dwellSummary.angle.n ? (dwellSummary.angle.total / dwellSummary.angle.n / 1000).toFixed(1) : "—";


  const colors: Record<LK, string> = {
    linkedin: "#0A66C2",
    contact: "#22c55e",
    "football-data": "#f59e0b",
    "fixture-card": "#a855f7",
    "fixture-angle": "#ec4899",
    "fixture-card-dwell": "#6366f1",
    "fixture-angle-dwell": "#14b8a6",
  };


  function toggle(k: LK) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function exportCsv() {
    const rows = filtered.map((c) => ({
      timestamp_iso: c.created_at,
      link_key: c.link_key,
      detail: c.href ?? "",
      referrer: c.referrer ?? "",
      user_agent: c.user_agent ?? "",
    }));
    downloadCsv(
      `link-engagement_${start}_to_${end}.csv`,
      toCsv(rows, ["timestamp_iso", "link_key", "detail", "referrer", "user_agent"]),
    );
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold tracking-tight">Link engagement</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Clicks across the site including LinkedIn, Contact, fixture cards, and content angles.
      </p>

      <div className="mt-4 card-glass flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">From</label>
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">To</label>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Granularity</label>
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            {(["day", "week"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`px-3 py-2 text-xs font-medium transition ${
                  granularity === g ? "bg-accent text-accent-foreground" : "hover:bg-surface-2"
                }`}
              >
                {g === "day" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_KEYS.map((k) => {
            const on = selected.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggle(k)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  on
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:bg-surface-2"
                }`}
              >
                {k}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"
          >
            Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visibleKeys.map((k) => (
          <div key={k} className="card-glass p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="mt-1 font-display text-3xl font-bold">{totals.get(k) ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {last7.get(k) ?? 0} in the last 7 days
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card-glass p-4">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {granularity === "day" ? "Daily" : "Weekly"} clicks
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {visibleKeys.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={colors[k]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card-glass p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Top clicked fixtures
            </div>
            <div className="text-[10px] text-muted-foreground">card + angle clicks</div>
          </div>
          {topFixtures.length === 0 ? (
            <div className="py-4 text-xs text-muted-foreground">No fixture clicks yet.</div>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {topFixtures.map((f, i) => (
                <li key={f.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="flex-1 truncate">{f.matchup}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {f.cardClicks}c · {f.angleClicks}a
                  </span>
                  <span className="w-8 text-right font-display font-semibold">{f.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-glass p-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Top angle templates
          </div>
          {topAngles.length === 0 ? (
            <div className="py-4 text-xs text-muted-foreground">No angle clicks yet.</div>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {topAngles.map(([tpl, count], i) => (
                <li key={i} className="flex items-start gap-3 py-2">
                  <span className="w-6 pt-0.5 font-mono text-xs text-muted-foreground">
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-xs leading-snug text-muted-foreground">{tpl}</span>
                  <span className="w-8 text-right font-display font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Link</th>
              <th className="px-3 py-2">Detail</th>
              <th className="px-3 py-2">Referrer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.slice(0, 100).map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(c.created_at).toLocaleString("en-GB")}
                </td>
                <td className="px-3 py-2 font-medium">{c.link_key}</td>
                <td className="px-3 py-2 truncate text-muted-foreground max-w-xs">{c.href ?? "—"}</td>
                <td className="px-3 py-2 truncate text-muted-foreground">{c.referrer ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No clicks in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DebugEventsPanel />
    </section>
  );
}

function DebugEventsPanel() {
  const [open, setOpen] = useState(false);
  const { data: latest = [], refetch, isFetching } = useQuery({
    queryKey: ["link-clicks-debug"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("link_clicks")
        .select("id, link_key, href, referrer, user_agent, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as ClickRow[];
    },
    refetchInterval: open ? 5000 : false,
  });

  return (
    <section className="mt-8 rounded-md border border-dashed border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground hover:bg-surface-2"
      >
        <span>Debug · latest 25 analytics events {open ? "▾" : "▸"}</span>
        <span className="flex items-center gap-2">
          {open && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              className="rounded border border-border px-2 py-0.5 text-[10px] hover:bg-surface"
            >
              {isFetching ? "…" : "Refresh"}
            </button>
          )}
        </span>
      </button>
      {open && (
        <div className="max-h-96 overflow-auto border-t border-border bg-surface-2/40 p-3">
          {latest.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No events received yet.</div>
          ) : (
            <ul className="space-y-2 font-mono text-[11px]">
              {latest.map((c) => (
                <li key={c.id} className="rounded border border-border bg-surface p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-accent">{c.link_key}</span>
                    <span className="text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-muted-foreground">
{JSON.stringify(
  { href: c.href, referrer: c.referrer, user_agent: c.user_agent },
  null,
  2,
)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-[10px] text-muted-foreground">
            Auto-refreshes every 5s while open.
          </div>
        </div>
      )}
    </section>
  );
}


