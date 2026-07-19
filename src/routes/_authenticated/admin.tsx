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

const ALL_KEYS = ["linkedin", "contact", "football-data", "fixture-card", "fixture-angle"] as const;
type LK = (typeof ALL_KEYS)[number];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function LinkAnalyticsSection() {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 29);

  const [start, setStart] = useState<string>(toYMD(defaultStart));
  const [end, setEnd] = useState<string>(toYMD(today));
  const [selected, setSelected] = useState<Set<LK>>(new Set(ALL_KEYS));

  const { data: clicks = [] } = useQuery({
    queryKey: ["link-clicks", start, end],
    queryFn: async () => {
      const startIso = new Date(start + "T00:00:00Z").toISOString();
      const endIso = new Date(end + "T23:59:59Z").toISOString();
      const { data, error } = await (supabase as any)
        .from("link_clicks")
        .select("id, link_key, href, referrer, created_at")
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        link_key: string;
        href: string | null;
        referrer: string | null;
        created_at: string;
      }>;
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

  // Build daily series
  const dayMap = new Map<string, Record<string, number>>();
  const startD = new Date(start);
  const endD = new Date(end);
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const key = toYMD(d);
    const row: Record<string, number> = { date: 0 } as any;
    (row as any).date = key;
    for (const k of visibleKeys) row[k] = 0;
    dayMap.set(key, row);
  }
  for (const c of filtered) {
    const day = c.created_at.slice(0, 10);
    const row = dayMap.get(day);
    if (row) row[c.link_key] = ((row[c.link_key] as number) ?? 0) + 1;
  }
  const series = Array.from(dayMap.values());

  const colors: Record<LK, string> = {
    linkedin: "#0A66C2",
    contact: "#22c55e",
    "football-data": "#f59e0b",
    "fixture-card": "#a855f7",
    "fixture-angle": "#ec4899",
  };

  function toggle(k: LK) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
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
          Daily clicks
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
    </section>
  );
}

