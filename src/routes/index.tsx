import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData, fetchSponsorProfiles } from "@/lib/queries";
import { enrichFixtures } from "@/lib/content-score";
import { scoreHospitality, sponsorHostFixtures } from "@/lib/hospitality-score";
import { WaitlistForm } from "@/components/WaitlistForm";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Fixture Radar — Premier League Sponsorship Intelligence" },
      {
        name: "description",
        content:
          "Score every Premier League fixture for content, hospitality and estimated media value. Private brand views, weekly briefings, and CSV exports for sponsor teams and agencies.",
      },
      { property: "og:title", content: "Fixture Radar — Premier League Sponsorship Intelligence" },
      {
        property: "og:description",
        content:
          "Every PL fixture, scored for content value, hospitality value and media value — built for sponsor brands and agencies.",
      },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/" }],
  }),
});

const tiers: Array<{
  id: "pro" | "studio" | "agency" | "enterprise";
  name: string;
  price: string;
  cadence: string;
  audience: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "pro",
    name: "Radar Pro",
    price: "£29",
    cadence: "per month",
    audience: "Solo marketers, small clubs, students",
    features: [
      "One saved sponsor profile",
      "Private CSV exports on every view",
      "Weekly Monday-morning email brief",
      "Alert rules for a single club",
    ],
  },
  {
    id: "studio",
    name: "Sponsor Studio",
    price: "£249",
    cadence: "per month",
    audience: "One brand's sponsorship team",
    highlight: true,
    features: [
      "Everything in Pro",
      "Estimated media value + audience-fit scores",
      "Guest-list & hospitality planner",
      "Competitor-collision & brand-safety flags",
      "Historical seasons + custom marquee players",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "£899",
    cadence: "per month",
    audience: "Up to 10 client workspaces, then £75/client",
    features: [
      "Everything in Studio × N clients",
      "White-label PDF briefings (your logo, your colours)",
      "Slack / Teams / email delivery",
      "Comparison mode across 2–3 brands",
      "Seat-based team access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "From £25k",
    cadence: "per year",
    audience: "Clubs, leagues, broadcasters",
    features: [
      "API access & data licensing",
      "Historical & multi-competition data",
      "SSO, priority support, custom SLAs",
      "Bespoke scoring & branding",
    ],
  },
];

function Landing() {
  const { data: base } = useQuery({ queryKey: ["fixture-data"], queryFn: fetchAllData });
  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors"],
    queryFn: fetchSponsorProfiles,
  });
  const example = sponsors.find((s) => s.is_example && s.category === "beer") ?? sponsors.find((s) => s.is_example);

  // Live teaser: top 3 hospitality fixtures for the example sponsor.
  const teaser = (() => {
    if (!base || !example) return [];
    const enriched = enrichFixtures(base.fixtures, base.teams, base.standings, base.marquee);
    const upcoming = enriched.filter(
      (e) => new Date(e.fixture.utc_date).getTime() >= Date.now() && e.fixture.status !== "FINISHED",
    );
    const sponsorTeamIds = new Set(example.team_ids ?? []);
    const hosts = sponsorHostFixtures(upcoming, sponsorTeamIds);
    return hosts
      .map((h) => ({ ...h, hosp: scoreHospitality(h, sponsorTeamIds, example, sponsors) }))
      .sort((a, b) => b.hosp.total - a.hosp.total)
      .slice(0, 3);
  })();


  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
              For sponsor brands, agencies & clubs
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              See every Premier League fixture the way your sponsorship team should.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Fixture Radar scores all 380 matches for <strong className="text-foreground">content value</strong>,{" "}
              <strong className="text-foreground">hospitality value</strong> and{" "}
              <strong className="text-foreground">estimated media value</strong> — so your brand shows up in
              the right moments, not just the loud ones.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {example ? (
                <Link
                  to="/sponsors"
                  search={{ sponsor: example.id }}
                  className="rounded-md bg-accent px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90"
                >
                  See the {example.brand_name} example →
                </Link>
              ) : (
                <Link
                  to="/sponsors"
                  className="rounded-md bg-accent px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90"
                >
                  See Sponsor Lens →
                </Link>
              )}
              <a
                href="#pricing"
                className="rounded-md border border-border bg-surface px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-surface-2"
              >
                See pricing
              </a>
              <Link
                to="/app"
                className="rounded-md px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Browse the free fan app →
              </Link>
            </div>
            <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
              Built for &nbsp;·&nbsp; Sponsor brands &nbsp;·&nbsp; Sponsorship agencies &nbsp;·&nbsp; Club commercial teams &nbsp;·&nbsp; Rights-holders
            </p>
          </div>

          {/* Live teaser card */}
          <div className="card-glass overflow-hidden rounded-xl border border-border p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Live example
                </div>
                <div className="font-display text-lg font-bold">
                  {example?.name ?? "Sample sponsor"} — top hospitality fixtures
                </div>
              </div>
              {example && (
                <Link
                  to="/sponsors"
                  search={{ sponsor: example.id }}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Open full view →
                </Link>
              )}
            </div>
            {teaser.length === 0 ? (
              <div className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
                Loading a real fixture ranking for you…
              </div>
            ) : (
              <ol className="divide-y divide-border/60">
                {teaser.map((t, i) => (
                  <li key={t.fixture.id} className="flex items-center gap-3 py-3">
                    <span className="w-6 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {t.home?.name} vs {t.away?.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.fixture.utc_date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · Matchday {t.fixture.matchday ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-accent">
                        {(t.hosp.total / 10).toFixed(1)}
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Hospitality
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
              Every fixture is scored on kickoff, rivalry, table stakes, star power and sponsor-fit.
              Studio adds estimated £ media value.
            </div>
          </div>
        </div>
      </section>

      {/* Value tiles */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Why sponsorship teams switch to Fixture Radar
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Tile
              title="Every fixture, scored"
              body="Content Score, Hospitality Score and Estimated Media Value in one row. No spreadsheets, no gut feel."
              foot="Rivalry · Table stakes · Star power · Tentpoles · Form"
            />
            <Tile
              title="Your brand, your view"
              body="Private sponsor profiles with your own guest lists, audience-fit weighting and one-click CSV exports."
              foot="Save profiles · Export freely · Comparison mode"
            />
            <Tile
              title="Weekly briefing, zero admin"
              body="Monday 8am UK, a ranked sponsor briefing lands in your inbox and Slack. Ready to forward internally."
              foot="Email · Slack · Teams (roadmap)"
            />
          </div>
        </div>
      </section>

      {/* How it helps by role */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Who it's for</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <RoleCard
              tag="Sponsor brands"
              lines={[
                "Rank fixtures by media value for your brand",
                "Flag competitor collisions in the same slot",
                "Prove ROI at board reviews with one CSV",
              ]}
            />
            <RoleCard
              tag="Sponsorship agencies"
              lines={[
                "One dashboard, N client workspaces",
                "White-label PDF briefings on autopilot",
                "Comparison mode across brand portfolios",
              ]}
            />
            <RoleCard
              tag="Club commercial teams"
              lines={[
                "Price hospitality boxes dynamically",
                "Pitch sponsors the exact fixtures to buy",
                "Track guest attendance & repeat invites",
              ]}
            />
            <RoleCard
              tag="Rights-holders & comms"
              lines={[
                "See which fixtures to promote each week",
                "Auto-generated storyline angles",
                "API access for internal newsroom tools",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Simple, tiered pricing</h2>
              <p className="mt-2 text-muted-foreground">
                Radar Free stays free for fans. Paid tiers are launching — join a waitlist to lock in
                early-access pricing.
              </p>
            </div>
            <Link
              to="/app"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Try Radar Free →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.id}
                className={`card-glass flex flex-col rounded-xl border p-6 ${
                  t.highlight
                    ? "border-accent shadow-lg ring-2 ring-accent/30"
                    : "border-border"
                }`}
              >
                {t.highlight && (
                  <div className="mb-3 inline-block w-fit rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    Most popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {t.audience}
                </p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-black">{t.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{t.cadence}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-accent">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <WaitlistForm tier={t.id} tierLabel={t.name} compact />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Prices in GBP. Enterprise pricing is custom — get in touch via the Enterprise waitlist and
            we'll reach out within 48 hours.
          </p>
        </div>
      </section>

      {/* Closer / summary */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">The one-line version</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Fixture Radar turns the Premier League calendar into a sponsorship intelligence dashboard:
            every fixture scored for <strong className="text-foreground">content</strong>,{" "}
            <strong className="text-foreground">hospitality</strong> and{" "}
            <strong className="text-foreground">media value</strong>, private views per brand, and
            weekly briefings your team actually reads.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {example && (
              <Link
                to="/sponsors"
                search={{ sponsor: example.id }}
                className="rounded-md bg-accent px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90"
              >
                Open the {example.brand_name} example
              </Link>
            )}
            <a
              href="#pricing"
              className="rounded-md border border-border bg-surface px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-surface-2"
            >
              Join a waitlist
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ title, body, foot }: { title: string; body: string; foot: string }) {
  return (
    <div className="card-glass rounded-xl border border-border p-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <p className="mt-4 text-[11px] uppercase tracking-wider text-accent">{foot}</p>
    </div>
  );
}

function RoleCard({ tag, lines }: { tag: string; lines: string[] }) {
  return (
    <div className="card-glass rounded-xl border border-border p-5">
      <div className="mb-3 inline-block rounded-full border border-border bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
        {tag}
      </div>
      <ul className="space-y-2 text-sm">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <span className="text-accent">→</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
