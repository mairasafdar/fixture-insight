import { supabase } from "@/integrations/supabase/client";
import type { FixtureRow, StandingRow, TeamLite } from "./content-score";

export async function fetchTeams(): Promise<TeamLite[]> {
  const { data, error } = await supabase.from("teams").select("id, name, short_name, tla, crest");
  if (error) throw error;
  return (data ?? []) as TeamLite[];
}

export async function fetchFixtures(): Promise<FixtureRow[]> {
  const { data, error } = await supabase
    .from("fixtures")
    .select(
      "id, matchday, utc_date, status, stage, season, home_team_id, away_team_id, home_score, away_score",
    )
    .order("utc_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FixtureRow[];
}

export async function fetchStandings(): Promise<StandingRow[]> {
  const { data, error } = await supabase
    .from("standings")
    .select(
      "team_id, position, played_games, won, draw, lost, points, goals_for, goals_against, goal_difference, form",
    )
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StandingRow[];
}

export async function fetchLastUpdated(): Promise<string | null> {
  const { data, error } = await supabase
    .from("refresh_log")
    .select("ran_at")
    .eq("success", true)
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.ran_at ?? null;
}

export async function fetchAllData() {
  const [teams, fixtures, standings, lastUpdated] = await Promise.all([
    fetchTeams(),
    fetchFixtures(),
    fetchStandings(),
    fetchLastUpdated(),
  ]);
  return { teams, fixtures, standings, lastUpdated };
}
