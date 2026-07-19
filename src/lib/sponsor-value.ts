import type { Enriched } from "./content-score";
import type { SponsorProfile } from "./sponsor-types";
import type { HospitalityBreakdown } from "./hospitality-score";

// -----------------------------------------------------------------------------
// Estimated Media Value (EMV)
// -----------------------------------------------------------------------------
// Rough model: UK live broadcast reach by kickoff slot × brand visibility
// seconds × CPM, boosted by the fixture's Content Score. Intended as a
// directional planning number, not a media-agency invoice.

const CPM_GBP = 18; // £ per 1,000 impressions, blended UK sports CPM

// UK domestic linear + streaming reach estimates per slot, in millions.
// Sat 15:00 is blackout in the UK so domestic reach collapses.
function slotReachMillions(iso: string): { reach: number; slot: string } {
  const d = new Date(iso);
  const day = d.toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short" });
  const hourStr = d.toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false });
  const hour = parseInt(hourStr, 10);
  if (day === "Sat" && hour < 13) return { reach: 1.8, slot: "Sat 12:30" };
  if (day === "Sat" && hour < 17) return { reach: 0.3, slot: "Sat 15:00 (blackout)" };
  if (day === "Sat") return { reach: 2.2, slot: "Sat 17:30" };
  if (day === "Sun" && hour < 15) return { reach: 2.5, slot: "Sun 14:00" };
  if (day === "Sun" && hour < 19) return { reach: 3.2, slot: "Sun 16:30" };
  if (day === "Sun") return { reach: 2.0, slot: "Sun evening" };
  if (day === "Mon" && hour >= 19) return { reach: 1.9, slot: "Mon Night Football" };
  if (day === "Fri" && hour >= 19) return { reach: 1.8, slot: "Fri Night Football" };
  return { reach: 1.5, slot: "Midweek" };
}

export type EmvBreakdown = {
  gbp: number;
  reachMillions: number;
  slotLabel: string;
  brandSecondsPerBroadcast: number;
  contentMultiplier: number;
  internationalMultiplier: number;
};

export function estimateMediaValue(
  e: Enriched,
  hospitality: HospitalityBreakdown | null,
): EmvBreakdown {
  const { reach, slot } = slotReachMillions(e.fixture.utc_date);
  // Assumed brand-visible seconds per broadcast for a stadium partner
  // (LED perimeter rotations + logo bug + hospitality mentions).
  const brandSeconds = hospitality?.isHome ? 90 : 25;
  // Higher content score = more replays, clips, and social spillover.
  const contentMultiplier = 1 + e.score.total / 250; // ~1.0 – 1.4
  // Marquee opponents drive international audiences.
  const opponentPts = hospitality?.opponent ?? 0;
  const internationalMultiplier = 1 + Math.min(0.9, opponentPts / 40);
  const impressions = reach * 1_000_000 * (brandSeconds / 30) * contentMultiplier * internationalMultiplier;
  const gbp = Math.round((impressions / 1000) * CPM_GBP);
  return {
    gbp,
    reachMillions: Math.round(reach * 10) / 10,
    slotLabel: slot,
    brandSecondsPerBroadcast: brandSeconds,
    contentMultiplier: Math.round(contentMultiplier * 100) / 100,
    internationalMultiplier: Math.round(internationalMultiplier * 100) / 100,
  };
}

export function formatGbp(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

// -----------------------------------------------------------------------------
// Audience Fit
// -----------------------------------------------------------------------------
// Matches sponsor category to slot demographic profile. 0–100.

type AudienceProfile = "family" | "premium" | "young_adult" | "casual" | "core_fan";

function slotAudience(iso: string): AudienceProfile {
  const d = new Date(iso);
  const day = d.toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short" });
  const hourStr = d.toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false });
  const hour = parseInt(hourStr, 10);
  if (day === "Sat" && hour < 13) return "family";
  if (day === "Sun" && hour < 15) return "family";
  if (day === "Sun" && hour >= 15 && hour < 19) return "premium";
  if ((day === "Mon" || day === "Fri") && hour >= 19) return "young_adult";
  if (day === "Sat" && hour >= 17) return "young_adult";
  if (day === "Sat") return "core_fan";
  return "casual";
}

const CATEGORY_FIT: Record<AudienceProfile, Record<string, number>> = {
  family:      { food: 95, retail: 90, family: 100, insurance: 80, automotive: 60, alcohol: 30, gambling: 10, tech: 70, finance: 65, telco: 75, energy: 65 },
  premium:     { alcohol: 95, automotive: 95, finance: 90, luxury: 100, tech: 85, telco: 80, insurance: 70, food: 60, energy: 70, gambling: 60, retail: 60 },
  young_adult: { alcohol: 100, gambling: 95, tech: 95, entertainment: 90, food: 75, automotive: 70, telco: 80, finance: 55, retail: 70, energy: 55 },
  core_fan:    { alcohol: 85, gambling: 90, automotive: 85, tech: 80, telco: 80, food: 75, retail: 70, finance: 70, energy: 65, insurance: 60 },
  casual:      { food: 75, retail: 70, telco: 75, tech: 70, finance: 65, insurance: 70, automotive: 70, alcohol: 65, energy: 60, gambling: 55 },
};

export type AudienceFit = {
  score: number;
  profile: AudienceProfile;
  profileLabel: string;
  reason: string;
};

const PROFILE_LABEL: Record<AudienceProfile, string> = {
  family: "Family / afternoon TV",
  premium: "Premium prime-time",
  young_adult: "Young adult / late night",
  core_fan: "Core fan / Saturday matchday",
  casual: "Casual midweek viewer",
};

export function estimateAudienceFit(e: Enriched, sponsor: SponsorProfile): AudienceFit {
  const profile = slotAudience(e.fixture.utc_date);
  const cat = sponsor.category.toLowerCase();
  const table = CATEGORY_FIT[profile];
  // Fallback: partial-match keys (e.g. "premium alcohol" → alcohol)
  const direct = table[cat];
  const fuzzy = direct ?? Object.entries(table).find(([k]) => cat.includes(k))?.[1] ?? 65;
  return {
    score: fuzzy,
    profile,
    profileLabel: PROFILE_LABEL[profile],
    reason:
      direct != null
        ? `${sponsor.category} maps directly to ${PROFILE_LABEL[profile].toLowerCase()}`
        : `${sponsor.category} inferred against ${PROFILE_LABEL[profile].toLowerCase()}`,
  };
}

// -----------------------------------------------------------------------------
// Guest-List Planner
// -----------------------------------------------------------------------------

export type GuestBucket = {
  name: string;
  seats: number;
  note: string;
};

export function planGuestList(
  seats: number,
  hospitality: HospitalityBreakdown | null,
): GuestBucket[] {
  const s = Math.max(0, Math.floor(seats));
  const tier = hospitality ? hospitality.total : 50;
  // Higher-tier fixture → more weight on VIP / key clients; lower → prospects.
  const vipPct = tier >= 70 ? 0.35 : tier >= 50 ? 0.25 : 0.15;
  const keyPct = tier >= 70 ? 0.35 : tier >= 50 ? 0.4 : 0.35;
  const prospectsPct = tier >= 70 ? 0.2 : tier >= 50 ? 0.25 : 0.4;
  const internalPct = Math.max(0, 1 - vipPct - keyPct - prospectsPct);
  const vip = Math.round(s * vipPct);
  const key = Math.round(s * keyPct);
  const prospects = Math.round(s * prospectsPct);
  const internal = Math.max(0, s - vip - key - prospects);
  return [
    { name: "VIP / C-suite", seats: vip, note: tier >= 70 ? "Reserve for board-level guests; prime hospitality box" : "Senior guests only" },
    { name: "Key clients", seats: key, note: "Renewal-critical accounts; assign a host per 2 guests" },
    { name: "Prospects", seats: prospects, note: tier >= 50 ? "Late-stage pipeline; brief hosts on deal context" : "Mid-funnel warm leads; matchday as conversion moment" },
    { name: "Internal / partners", seats: internal, note: "Team, agency, and asset-owner reps" },
  ];
}
