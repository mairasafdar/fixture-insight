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

export type ScoreBreakdown = {
  total: number;
  rivalry: number;
  tableStakes: number;
  form: number;
  tentpole: number;
  chips: Array<{ label: string; kind: "rivalry" | "table" | "form" | "tentpole"; points: number }>;
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
  let unbeaten = 0;
  for (const t of tokens) {
    if (t === "W") {
      winStreak++;
      unbeaten++;
    } else {
      break;
    }
  }
  if (winStreak >= tokens.length) {
    /* fall through */
  }
  // recompute unbeaten independently
  unbeaten = 0;
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
}): ScoreBreakdown {
  const { fixture, home, away, homeStanding, awayStanding, allFixtures } = args;
  const chips: ScoreBreakdown["chips"] = [];
  const angles: string[] = [];

  // Rivalry
  const rivalry = getRivalry(home?.tla, away?.tla);
  const rivalryPts = rivalry ? Math.min(35, rivalry.score) : 0;
  if (rivalry) {
    chips.push({ label: rivalry.label, kind: "rivalry", points: rivalryPts });
    angles.push(`${rivalry.label}: ${rivalry.blurb}`);
  }

  // Table stakes (up to 30)
  let tablePts = 0;
  if (homeStanding && awayStanding) {
    const gap = Math.abs(homeStanding.points - awayStanding.points);
    const topFour = homeStanding.position <= 4 && awayStanding.position <= 4;
    const bottomFive = homeStanding.position >= 16 && awayStanding.position >= 16;
    const firstVsSecond =
      (homeStanding.position === 1 && awayStanding.position === 2) ||
      (homeStanding.position === 2 && awayStanding.position === 1);

    if (firstVsSecond) {
      tablePts = Math.max(tablePts, 30);
      chips.push({ label: "1st vs 2nd", kind: "table", points: 30 });
      angles.push("Summit clash: the top two go head-to-head with the title on the line.");
    } else if (topFour) {
      tablePts = Math.max(tablePts, 22);
      chips.push({ label: "Top-4 clash", kind: "table", points: 22 });
      angles.push(
        `Champions League race: both sides currently in the top four (${homeStanding.position} vs ${awayStanding.position}).`,
      );
    }
    if (bottomFive) {
      tablePts = Math.max(tablePts, 20);
      chips.push({ label: "Relegation six-pointer", kind: "table", points: 20 });
      angles.push(
        `Relegation six-pointer: both sides in the bottom five (${homeStanding.position}th vs ${awayStanding.position}th).`,
      );
    }
    if (gap <= 3 && homeStanding.played_games > 3) {
      const bonus = 8;
      tablePts = Math.min(30, tablePts + bonus);
      chips.push({ label: `${gap}-pt gap`, kind: "table", points: bonus });
      angles.push(`Tight on points: just ${gap} between them going into kickoff.`);
    }
  }

  // Form (up to 15)
  let formPts = 0;
  const homeForm = formStreak(homeStanding?.form ?? null);
  const awayForm = formStreak(awayStanding?.form ?? null);
  const best = homeForm.length >= awayForm.length ? { team: home, streak: homeForm } : { team: away, streak: awayForm };
  if (best.streak.kind && best.streak.length >= 4) {
    formPts = Math.min(15, 6 + (best.streak.length - 4) * 3);
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

  // Tentpole (up to 20)
  let tentpolePts = 0;
  const d = new Date(fixture.utc_date);
  const seasonMatches = allFixtures.filter((f) => f.season === fixture.season);
  const firstMd = Math.min(...seasonMatches.map((f) => f.matchday ?? Infinity));
  const lastMd = Math.max(...seasonMatches.map((f) => f.matchday ?? -Infinity));
  if (fixture.matchday && fixture.matchday === firstMd) {
    tentpolePts = Math.max(tentpolePts, 15);
    chips.push({ label: "Opening weekend", kind: "tentpole", points: 15 });
    angles.push("Opening weekend: season storylines start here.");
  }
  if (fixture.matchday && fixture.matchday === lastMd) {
    tentpolePts = Math.max(tentpolePts, 20);
    chips.push({ label: "Final day", kind: "tentpole", points: 20 });
    angles.push("Final day: last chance for glory, survival or heartbreak.");
  }
  if (isBoxingDay(d)) {
    tentpolePts = Math.max(tentpolePts, 18);
    chips.push({ label: "Boxing Day", kind: "tentpole", points: 18 });
    angles.push("Boxing Day football: a British holiday tradition.");
  } else if (isFestivePeriod(d)) {
    tentpolePts = Math.max(tentpolePts, 10);
    chips.push({ label: "Festive fixture", kind: "tentpole", points: 10 });
    angles.push("Festive-period fixture: packed schedule, tired legs, big drama.");
  }

  const total = Math.min(100, rivalryPts + tablePts + formPts + tentpolePts);

  // Default angle if nothing landed
  if (!angles.length && home && away) {
    angles.push(`${home.name} host ${away.name} in a Premier League fixture.`);
  }

  return {
    total,
    rivalry: rivalryPts,
    tableStakes: tablePts,
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
): Enriched[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const standingById = new Map(standings.map((s) => [s.team_id, s]));
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
    });
    return { fixture: f, home, away, homeStanding, awayStanding, score };
  });
}
