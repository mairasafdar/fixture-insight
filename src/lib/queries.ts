import { supabase } from "@/integrations/supabase/client";
import type { FixtureRow, MarqueePlayer, StandingRow, TeamLite } from "./content-score";
import type { SponsorProfile } from "./sponsor-types";

export async function fetchSponsorProfiles(): Promise<SponsorProfile[]> {
  const { data, error } = await (supabase as any)
    .from("sponsor_profiles")
    .select("id, brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes")
    .order("brand_name", { ascending: true });
  if (error) return [];
  return (data ?? []) as SponsorProfile[];
}


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

export async function fetchMarqueePlayers(): Promise<MarqueePlayer[]> {
  const { data, error } = await (supabase as any)
    .from("marquee_players")
    .select("id, player_name, team_id, tier")
    .order("tier", { ascending: true })
    .order("player_name", { ascending: true });
  if (error) return [];
  return (data ?? []) as MarqueePlayer[];
}

export async function fetchLastUpdated(): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("get_last_refresh");
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function fetchAllData() {
  const [teams, fixtures, standings, marquee, lastUpdated] = await Promise.all([
    fetchTeams(),
    fetchFixtures(),
    fetchStandings(),
    fetchMarqueePlayers(),
    fetchLastUpdated(),
  ]);
  return { teams, fixtures, standings, marquee, lastUpdated };
}
