import type { Enriched, ScoreBreakdown, ChipKind } from "./content-score";
import type { SponsorProfile } from "./sponsor-types";

export type HospitalityChip = { label: string; kind: ChipKind | "kickoff"; points: number };

export type HospitalityBreakdown = {
  total: number;
  kickoff: number;
  opponent: number;
  stakes: number;
  tentpole: number;
  chips: HospitalityChip[];
  isHome: boolean;
  sponsorDerby: { rivalBrand?: string; rivalCategory?: string } | null;
};

export const HOSPITALITY_WEIGHTS = {
  kickoff: 30,
  opponent: 30,
  stakes: 25,
  tentpole: 15,
} as const;

function kickoffAppeal(iso: string): { points: number; label: string } {
  const d = new Date(iso);
  // UK local hour
  const ukHourStr = d.toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false });
  const hour = parseInt(ukHourStr, 10);
  const dayStr = d.toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short" });
  const isWeekend = dayStr === "Sat" || dayStr === "Sun";
  const isFri = dayStr === "Fri";
  const isMon = dayStr === "Mon";

  if (isWeekend && hour >= 11 && hour < 18) return { points: 30, label: `${dayStr} afternoon kickoff` };
  if (isWeekend && hour >= 18) return { points: 22, label: `${dayStr} evening kickoff` };
  if (isWeekend) return { points: 20, label: `${dayStr} kickoff` };
  if ((isFri || isMon) && hour >= 18) return { points: 15, label: `${dayStr} night kickoff` };
  if (isFri || isMon) return { points: 12, label: `${dayStr} kickoff` };
  return { points: 8, label: `Midweek kickoff` };
}

export function scoreHospitality(e: Enriched, sponsorTeamIds: Set<number>, sponsor: SponsorProfile, allSponsors: SponsorProfile[]): HospitalityBreakdown {
  const { fixture, home, away, score } = e;
  const homeId = fixture.home_team_id;
  const awayId = fixture.away_team_id;
  const isHome = homeId !== null && sponsorTeamIds.has(homeId);
  const opponentId = isHome ? awayId : homeId;

  const chips: HospitalityChip[] = [];

  const ko = kickoffAppeal(fixture.utc_date);
  chips.push({ label: ko.label, kind: "kickoff", points: ko.points });

  // Opponent appeal: opponent star power (only opposing side) + rivalry contribution.
  // We approximate by taking the rivalry component (fixture-wide) and the star
  // component prorated to the opposing side.
  const opponentStar = estimateOpponentStar(e, isHome);
  const rivalryPts = score.rivalry;
  const opponentRaw = opponentStar + rivalryPts;
  const opponentPts = Math.min(HOSPITALITY_WEIGHTS.opponent, opponentRaw);
  if (opponentPts > 0) {
    const oppName = (isHome ? away : home)?.name ?? "opponent";
    if (rivalryPts > 0 && opponentStar > 0) {
      chips.push({ label: `Marquee opponent · ${oppName}`, kind: "star", points: opponentPts });
    } else if (rivalryPts > 0) {
      chips.push({ label: `Rivalry opponent · ${oppName}`, kind: "rivalry", points: opponentPts });
    } else {
      chips.push({ label: `Star opponent · ${oppName}`, kind: "star", points: opponentPts });
    }
  }

  const stakesPts = Math.min(HOSPITALITY_WEIGHTS.stakes, score.tableStakes);
  if (stakesPts > 0) {
    const tableChip = score.chips.find((c) => c.kind === "table");
    chips.push({ label: tableChip?.label ?? "League stakes", kind: "table", points: stakesPts });
  }

  const tentpolePts = Math.min(HOSPITALITY_WEIGHTS.tentpole, score.tentpole);
  if (tentpolePts > 0) {
    const tentChip = score.chips.find((c) => c.kind === "tentpole");
    chips.push({ label: tentChip?.label ?? "Tentpole moment", kind: "tentpole", points: tentpolePts });
  }

  const total = Math.min(100, ko.points + opponentPts + stakesPts + tentpolePts);

  // Sponsor derby: is the opponent's club sponsored by a rival brand or in a rival category?
  let sponsorDerby: HospitalityBreakdown["sponsorDerby"] = null;
  if (opponentId != null) {
    const oppSponsors = allSponsors.filter((s) => s.id !== sponsor.id && s.team_ids.includes(opponentId));
    for (const os of oppSponsors) {
      const brandMatch = sponsor.rival_brands.some((r) => r.trim().toLowerCase() === os.brand_name.trim().toLowerCase());
      const categoryMatch =
        sponsor.rival_categories.map((c) => c.toLowerCase()).includes(os.category.toLowerCase()) ||
        sponsor.category.toLowerCase() === os.category.toLowerCase();
      if (brandMatch) {
        sponsorDerby = { rivalBrand: os.brand_name };
        break;
      }
      if (categoryMatch) {
        sponsorDerby = { rivalCategory: os.category, rivalBrand: os.brand_name };
      }
    }
  }

  return {
    total,
    kickoff: ko.points,
    opponent: opponentPts,
    stakes: stakesPts,
    tentpole: tentpolePts,
    chips,
    isHome,
    sponsorDerby,
  };
}

// The content score's star component is fixture-wide (both teams). For
// hospitality we care about the opponent only, so we prorate: if the
// content-score star chip mentions opponent players it's included, else halved.
function estimateOpponentStar(e: Enriched, isHome: boolean): number {
  const starChip = e.score.chips.find((c) => c.kind === "star");
  if (!starChip) return 0;
  // Approximation: assume roughly half of star points come from each side; if
  // one side has no marquee players tagged we can't tell here, so halve the
  // fixture-wide star points as the opponent's share.
  const total = e.score.star;
  const half = Math.round(total / 2);
  // If total was odd, favor the higher share for opponent when isHome=true (home has hospitality; opponent's stars are the ones drawing crowd).
  return isHome ? Math.max(half, total - half) : Math.min(half, total - half);
}

export function sponsorHostFixtures(enriched: Enriched[], sponsorTeamIds: Set<number>): Enriched[] {
  return enriched.filter((e) => {
    const h = e.fixture.home_team_id;
    const a = e.fixture.away_team_id;
    return (h != null && sponsorTeamIds.has(h)) || (a != null && sponsorTeamIds.has(a));
  });
}

// Re-export the content score type for convenience in views.
export type { ScoreBreakdown };
