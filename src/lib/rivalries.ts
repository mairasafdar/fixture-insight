// Rivalry / derby matrix. Keys are unordered team-name pairs.
// Scores contribute up to 35 pts to the Content Score.

export type Rivalry = {
  label: string;
  score: number; // 0..35
  blurb: string;
};

// Map by "TLA:TLA" sorted alphabetically for stable lookup.
const RIVALRIES: Record<string, Rivalry> = {
  // Fiercest derbies — 35
  "ARS:TOT": {
    label: "North London Derby",
    score: 35,
    blurb: "One of England's most heated rivalries — pride of North London.",
  },
  "EVE:LIV": {
    label: "Merseyside Derby",
    score: 35,
    blurb: "The oldest top-flight derby still contested, split across Stanley Park.",
  },
  "MCI:MUN": {
    label: "Manchester Derby",
    score: 35,
    blurb: "The two halves of Manchester square off — global spotlight guaranteed.",
  },
  // Historic title-era rivalries — 30
  "LIV:MUN": {
    label: "North West Rivalry",
    score: 32,
    blurb: "England's two most decorated clubs — history-drenched every time.",
  },
  "ARS:MUN": {
    label: "Modern Classic",
    score: 28,
    blurb: "The defining Premier League rivalry of the 1990s–2000s.",
  },
  "CHE:TOT": {
    label: "London Derby",
    score: 26,
    blurb: "West London vs North London — recent history is spiky.",
  },
  "ARS:CHE": {
    label: "London Derby",
    score: 26,
    blurb: "A high-stakes London fixture with a title-race backdrop.",
  },
  "CHE:MUN": {
    label: "Big Six Clash",
    score: 25,
    blurb: "Mourinho-era grudges never quite faded.",
  },
  "ARS:LIV": {
    label: "Big Six Clash",
    score: 25,
    blurb: "Two of the league's most in-form sides in recent seasons.",
  },
  "LIV:MCI": {
    label: "Title Rivalry",
    score: 30,
    blurb: "The defining title race of the modern era.",
  },
  "CHE:LIV": {
    label: "Big Six Clash",
    score: 24,
    blurb: "Semi-final and title-decider history keeps this one hot.",
  },
  "ARS:MCI": {
    label: "Title Rivalry",
    score: 28,
    blurb: "Arteta vs Guardiola — mentor and student, chasing the same trophy.",
  },
  "MCI:TOT": { label: "Big Six Clash", score: 20, blurb: "Recent seasons full of drama and swings." },
  "MUN:TOT": { label: "Big Six Clash", score: 20, blurb: "Big-Six fixture with plenty of history." },
  "CHE:MCI": { label: "Big Six Clash", score: 22, blurb: "Two of the league's most decorated modern squads." },
  // Other London derbies — 18
  "CHE:WHU": { label: "London Derby", score: 20, blurb: "West London vs East London — always feisty." },
  "ARS:WHU": { label: "London Derby", score: 18, blurb: "North vs East London, historic rivalry." },
  "TOT:WHU": { label: "London Derby", score: 18, blurb: "North vs East London." },
  "CRY:BHA": { label: "M23 Derby", score: 22, blurb: "The A23 derby — bad blood between Palace and Brighton." },
  "CHE:FUL": { label: "West London Derby", score: 18, blurb: "Neighbours off the Fulham Road." },
  "ARS:CRY": { label: "London Derby", score: 15, blurb: "London derby with recent bite." },
  "CRY:TOT": { label: "London Derby", score: 15, blurb: "London derby, top-half tension." },
  "CHE:CRY": { label: "London Derby", score: 15, blurb: "West vs South London." },
  "FUL:TOT": { label: "London Derby", score: 12, blurb: "London derby." },
  "ARS:FUL": { label: "London Derby", score: 12, blurb: "London derby." },
  "BRE:CHE": { label: "West London Derby", score: 15, blurb: "Brentford's rise made this one meaningful again." },
  "BRE:FUL": { label: "West London Derby", score: 14, blurb: "West London neighbours." },
  // Classic regional rivalries
  "AVL:BIR": { label: "Second City Derby", score: 30, blurb: "Birmingham vs Villa — heated when both are up." },
  "NEW:SUN": { label: "Tyne-Wear Derby", score: 34, blurb: "One of Europe's most intense derbies." },
  "LEE:MUN": { label: "Roses Rivalry", score: 28, blurb: "Yorkshire vs Lancashire — bad blood since the 60s." },
  "AVL:WOL": { label: "Midlands Rivalry", score: 18, blurb: "Old Midlands foes." },
  "NEW:MUN": { label: "North vs North West", score: 20, blurb: "A rivalry rooted in Sir Bobby Robson and Keegan." },
  "AVL:LEI": { label: "Midlands Rivalry", score: 15, blurb: "Midlands neighbours." },
  "NFO:DER": { label: "Brian Clough Derby", score: 25, blurb: "East Midlands rivalry with Clough at its heart." },
  "BOU:SOU": { label: "South Coast Derby", score: 22, blurb: "South coast rivalry." },
};

function keyFor(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a || !b) return null;
  return [a, b].sort().join(":");
}

export function getRivalry(homeTla?: string | null, awayTla?: string | null): Rivalry | null {
  const key = keyFor(homeTla, awayTla);
  if (!key) return null;
  return RIVALRIES[key] ?? null;
}
