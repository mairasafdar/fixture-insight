import { createFileRoute } from "@tanstack/react-router";

const API_BASE = "https://api.football-data.org/v4";

type Team = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

type Match = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  season: { id: number } | null;
  homeTeam: Team;
  awayTeam: Team;
  score: { fullTime: { home: number | null; away: number | null } };
};

type StandingRow = {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
};

async function fetchFD(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function runRefresh() {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_API_TOKEN not set");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Fetch matches
  const matchesJson = (await fetchFD("/competitions/PL/matches", token)) as {
    matches: Match[];
  };
  const matches = matchesJson.matches ?? [];

  // Fetch standings (may be empty pre-season)
  let table: StandingRow[] = [];
  try {
    const standingsJson = (await fetchFD("/competitions/PL/standings", token)) as {
      standings: Array<{ type: string; table: StandingRow[] }>;
    };
    const total = standingsJson.standings?.find((s) => s.type === "TOTAL");
    table = total?.table ?? [];
  } catch (e) {
    console.warn("standings fetch failed (pre-season?)", e);
  }

  // Collect all teams from matches + standings
  const teamMap = new Map<number, Team>();
  for (const m of matches) {
    if (m.homeTeam?.id) teamMap.set(m.homeTeam.id, m.homeTeam);
    if (m.awayTeam?.id) teamMap.set(m.awayTeam.id, m.awayTeam);
  }
  for (const r of table) {
    if (r.team?.id) teamMap.set(r.team.id, r.team);
  }

  const teamRows = Array.from(teamMap.values())
    .filter((t) => t.id && t.name)
    .map((t) => ({
      id: t.id,
      name: t.name,
      short_name: t.shortName ?? null,
      tla: t.tla ?? null,
      crest: t.crest ?? null,
      updated_at: new Date().toISOString(),
    }));

  if (teamRows.length) {
    const { error } = await supabaseAdmin.from("teams").upsert(teamRows, { onConflict: "id" });
    if (error) throw new Error(`teams upsert: ${error.message}`);
  }

  const fixtureRows = matches
    .filter((m) => m.homeTeam?.id && m.awayTeam?.id)
    .map((m) => ({
      id: m.id,
      matchday: m.matchday,
      utc_date: m.utcDate,
      status: m.status,
      stage: m.stage,
      season: m.season?.id ?? null,
      home_team_id: m.homeTeam.id,
      away_team_id: m.awayTeam.id,
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      updated_at: new Date().toISOString(),
    }));

  if (fixtureRows.length) {
    const { error } = await supabaseAdmin.from("fixtures").upsert(fixtureRows, { onConflict: "id" });
    if (error) throw new Error(`fixtures upsert: ${error.message}`);
  }

  // Replace standings
  if (table.length) {
    const standingRows = table
      .filter((r) => r.team?.id)
      .map((r) => ({
        team_id: r.team.id,
        position: r.position,
        played_games: r.playedGames,
        won: r.won,
        draw: r.draw,
        lost: r.lost,
        points: r.points,
        goals_for: r.goalsFor,
        goals_against: r.goalsAgainst,
        goal_difference: r.goalDifference,
        form: r.form,
        updated_at: new Date().toISOString(),
      }));
    const { error } = await supabaseAdmin
      .from("standings")
      .upsert(standingRows, { onConflict: "team_id" });
    if (error) throw new Error(`standings upsert: ${error.message}`);
  }

  await supabaseAdmin.from("refresh_log").insert({
    success: true,
    fixtures_count: fixtureRows.length,
    standings_count: table.length,
  });

  return { fixtures: fixtureRows.length, standings: table.length, teams: teamRows.length };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

export const Route = createFileRoute("/api/public/hooks/refresh-football-data")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle() {
  try {
    const result = await runRefresh();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("refresh-football-data failed", message);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("refresh_log").insert({ success: false, error: message });
    } catch {
      /* ignore */
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
