import { getRivalry } from "./rivalries";

export type TeamLite = {
  id: number;
  name: string;
  short_name: string | null;
  tla: string | null;
  crest: string | null;
};

export type FixtureRow = {
  id: number;
  matchday: number | null;
  utc_date: string;
  status: string;
  stage: string | null;
  season: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
};

export type StandingRow = {
  team_id: number;
  position: number;
  played_games: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form: string | null;
};

export type MarqueePlayer = {
  id: string;
  player_name: string;
  team_id: number;
  tier: "tier1" | "tier2";
};

export type ChipKind = "rivalry" | "table" | "star" | "form" | "tentpole";

export type ScoreBreakdown = {
  total: number;
  rivalry: number;
  tableStakes: number;
  star: number;
  form: number;
  tentpole: number;
  chips: Array<{ label: string; kind: ChipKind; points: number }>;
  angles: string[];
};

export type Enriched = {
  fixture: FixtureRow;
  home: TeamLite | null;
  away: TeamLite | null;
  homeStanding: StandingRow | null;
  awayStanding: StandingRow | null;
  score: ScoreBreakdown;
};

// Component weight caps (must total 100)
export const WEIGHTS = {
  rivalry: 25,
  tableStakes: 25,
  star: 25,
  tentpole: 15,
  form: 10,
} as const;


const BOXING_MONTH_START = "12-24";
const BOXING_MONTH_END = "01-02";

function isFestivePeriod(d: Date): boolean {
  const mmdd = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return mmdd >= BOXING_MONTH_START || mmdd <= BOXING_MONTH_END;
}

function isBoxingDay(d: Date): boolean {
  return d.getUTCMonth() === 11 && (d.getUTCDate() === 26 || d.getUTCDate() === 27);
}

function formStreak(form: string | null): { kind: "W" | "U" | null; length: number } {
  if (!form) return { kind: null, length: 0 };
  const tokens = form.split(/[,\s]/).filter(Boolean);
  if (!tokens.length) return { kind: null, length: 0 };
  let winStreak = 0;
  for (const t of tokens) {
    if (t === "W") winStreak++;
    else break;
  }
  let unbeaten = 0;
  for (const t of tokens) {
    if (t === "W" || t === "D") unbeaten++;
    else break;
  }
  if (winStreak >= 4) return { kind: "W", length: winStreak };
  if (unbeaten >= 4) return { kind: "U", length: unbeaten };
  return { kind: null, length: 0 };
}

export function scoreFixture(args: {
  fixture: FixtureRow;
  home: TeamLite | null;
  away: TeamLite | null;
  homeStanding: StandingRow | null;
  awayStanding: StandingRow | null;
  allFixtures: FixtureRow[];
  marqueeByTeam?: Map<number, MarqueePlayer[]>;
}): ScoreBreakdown {
  const { fixture, home, away, homeStanding, awayStanding, allFixtures, marqueeByTeam } = args;
  const chips: ScoreBreakdown["chips"] = [];
  const angles: string[] = [];

  // Rivalry (cap 30)
  const rivalry = getRivalry(home?.tla, away?.tla);
  const rivalryPts = rivalry ? Math.min(WEIGHTS.rivalry, Math.round((rivalry.score * WEIGHTS.rivalry) / 35)) : 0;
  if (rivalry) {
    chips.push({ label: rivalry.label, kind: "rivalry", points: rivalryPts });
    angles.push(`${rivalry.label}: ${rivalry.blurb}`);
  }

  // Table stakes (cap 25) — only meaningful once the table has settled
  let tablePts = 0;
  const tableSettled =
    !!homeStanding &&
    !!awayStanding &&
    homeStanding.played_games >= 5 &&
    awayStanding.played_games >= 5;
  if (tableSettled && homeStanding && awayStanding) {
    const gap = Math.abs(homeStanding.points - awayStanding.points);
    const topFour = homeStanding.position <= 4 && awayStanding.position <= 4;
    const bottomFive = homeStanding.position >= 16 && awayStanding.position >= 16;
    const firstVsSecond =
      (homeStanding.position === 1 && awayStanding.position === 2) ||
      (homeStanding.position === 2 && awayStanding.position === 1);

    if (firstVsSecond) {
      tablePts = Math.max(tablePts, 25);
      chips.push({ label: "1st vs 2nd", kind: "table", points: 25 });
      angles.push("Summit clash: the top two go head-to-head with the title on the line.");
    } else if (topFour) {
      tablePts = Math.max(tablePts, 18);
      chips.push({ label: "Top-4 clash", kind: "table", points: 18 });
      angles.push(
        `Champions League race: both sides currently in the top four (${homeStanding.position} vs ${awayStanding.position}).`,
      );
    }
    if (bottomFive) {
      tablePts = Math.max(tablePts, 17);
      chips.push({ label: "Relegation six-pointer", kind: "table", points: 17 });
      angles.push(
        `Relegation six-pointer: both sides in the bottom five (${homeStanding.position}th vs ${awayStanding.position}th).`,
      );
    }
    if (gap <= 3) {
      const bonus = 6;
      tablePts = Math.min(WEIGHTS.tableStakes, tablePts + bonus);
      chips.push({ label: `${gap}-pt gap`, kind: "table", points: bonus });
      angles.push(`Tight on points: just ${gap} between them going into kickoff.`);
    }
  }


  // Star power (cap 20)
  let starPts = 0;
  if (marqueeByTeam && (home || away)) {
    const homeStars = home ? marqueeByTeam.get(home.id) ?? [] : [];
    const awayStars = away ? marqueeByTeam.get(away.id) ?? [] : [];
    const all = [...homeStars, ...awayStars];
    const raw = all.reduce((sum, p) => sum + (p.tier === "tier1" ? 10 : 5), 0);
    starPts = Math.min(WEIGHTS.star, raw);
    if (starPts > 0) {
      const tier1Names = all.filter((p) => p.tier === "tier1").map((p) => p.player_name);
      const tier2Names = all.filter((p) => p.tier === "tier2").map((p) => p.player_name);
      const headliners = tier1Names.length ? tier1Names.slice(0, 3) : tier2Names.slice(0, 3);
      chips.push({
        label:
          tier1Names.length > 0
            ? `Marquee: ${tier1Names.slice(0, 2).join(", ")}${tier1Names.length > 2 ? " +" + (tier1Names.length - 2) : ""}`
            : `Rising stars: ${tier2Names.slice(0, 2).join(", ")}${tier2Names.length > 2 ? " +" + (tier2Names.length - 2) : ""}`,
        kind: "star",
        points: starPts,
      });
      angles.push(
        `Star power on show: ${headliners.join(", ")}${all.length > headliners.length ? " and more" : ""} feature in this one — a shop-window fixture for new fans.`,
      );
    }
  }

  // Form (cap 10)
  let formPts = 0;
  const homeForm = formStreak(homeStanding?.form ?? null);
  const awayForm = formStreak(awayStanding?.form ?? null);
  const best = homeForm.length >= awayForm.length ? { team: home, streak: homeForm } : { team: away, streak: awayForm };
  if (best.streak.kind && best.streak.length >= 4) {
    formPts = Math.min(WEIGHTS.form, 4 + (best.streak.length - 4) * 2);
    const label = best.streak.kind === "W" ? "winning" : "unbeaten";
    chips.push({
      label: `${best.team?.tla ?? "Team"} on ${best.streak.length}-game ${label} run`,
      kind: "form",
      points: formPts,
    });
    angles.push(
      `${best.team?.name ?? "One side"} arrive on a ${best.streak.length}-game ${label} streak — can they extend it?`,
    );
  }

  // Tentpole (cap 15)
  let tentpolePts = 0;
  const d = new Date(fixture.utc_date);
  const seasonMatches = allFixtures.filter((f) => f.season === fixture.season);
  const firstMd = Math.min(...seasonMatches.map((f) => f.matchday ?? Infinity));
  const lastMd = Math.max(...seasonMatches.map((f) => f.matchday ?? -Infinity));
  if (fixture.matchday && fixture.matchday === firstMd) {
    tentpolePts = Math.max(tentpolePts, 12);
    chips.push({ label: "Opening weekend", kind: "tentpole", points: 12 });
    angles.push("Opening weekend: season storylines start here.");
  }
  if (fixture.matchday && fixture.matchday === lastMd) {
    tentpolePts = Math.max(tentpolePts, 15);
    chips.push({ label: "Final day", kind: "tentpole", points: 15 });
    angles.push("Final day: last chance for glory, survival or heartbreak.");
  }
  if (isBoxingDay(d)) {
    tentpolePts = Math.max(tentpolePts, 13);
    chips.push({ label: "Boxing Day", kind: "tentpole", points: 13 });
    angles.push("Boxing Day football: a British holiday tradition.");
  } else if (isFestivePeriod(d)) {
    tentpolePts = Math.max(tentpolePts, 8);
    chips.push({ label: "Festive fixture", kind: "tentpole", points: 8 });
    angles.push("Festive-period fixture: packed schedule, tired legs, big drama.");
  }

  const total = Math.min(100, rivalryPts + tablePts + starPts + formPts + tentpolePts);

  if (!angles.length && home && away) {
    angles.push(`${home.name} host ${away.name} in a Premier League fixture.`);
  }

  return {
    total,
    rivalry: rivalryPts,
    tableStakes: tablePts,
    star: starPts,
    form: formPts,
    tentpole: tentpolePts,
    chips,
    angles,
  };
}

export function enrichFixtures(
  fixtures: FixtureRow[],
  teams: TeamLite[],
  standings: StandingRow[],
  marquee: MarqueePlayer[] = [],
): Enriched[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const standingById = new Map(standings.map((s) => [s.team_id, s]));
  const marqueeByTeam = new Map<number, MarqueePlayer[]>();
  for (const p of marquee) {
    if (!marqueeByTeam.has(p.team_id)) marqueeByTeam.set(p.team_id, []);
    marqueeByTeam.get(p.team_id)!.push(p);
  }
  return fixtures.map((f) => {
    const home = f.home_team_id ? teamById.get(f.home_team_id) ?? null : null;
    const away = f.away_team_id ? teamById.get(f.away_team_id) ?? null : null;
    const homeStanding = f.home_team_id ? standingById.get(f.home_team_id) ?? null : null;
    const awayStanding = f.away_team_id ? standingById.get(f.away_team_id) ?? null : null;
    const score = scoreFixture({
      fixture: f,
      home,
      away,
      homeStanding,
      awayStanding,
      allFixtures: fixtures,
      marqueeByTeam,
    });
    return { fixture: f, home, away, homeStanding, awayStanding, score };
  });
}
