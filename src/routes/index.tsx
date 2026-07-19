import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData, fetchSponsorProfiles } from "@/lib/queries";
import { enrichFixtures } from "@/lib/content-score";
import { scoreHospitality, sponsorHostFixtures } from "@/lib/hospitality-score";

const INQUIRY_EMAIL = "mairasafdarc@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/maira-s-9a006b227";

function inquiryMailto(tier?: string) {
  const subject = tier
    ? `Fixture Radar — feedback on ${tier}`
    : "Fixture Radar — hello";
  const body = `Hi Maira,\n\nI came across Fixture Radar${
    tier ? ` (${tier})` : ""
  } and wanted to get in touch.\n\nA bit about me:\n- Company / club:\n- Role:\n- What caught my eye:\n\nThanks!`;
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Fixture Radar — Premier League Sponsorship Intelligence" },
      {
        name: "description",
        content:
          "An independent exploration of how sponsorship teams could plan around the Premier League fixture calendar. Every fixture scored for content, hospitality, and estimated media value.",
      },
      { property: "og:title", content: "Fixture Radar — Premier League Sponsorship Intelligence" },
      {
        property: "og:description",
        content:
          "Every PL fixture scored for content, hospitality, and estimated media value — an independent project by Maira Chaudhary.",
      },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/" }],
  }),
});

type TierStatus = "live" | "partial" | "concept";

const tiers: Array<{
  id: "pro" | "studio" | "agency" | "enterprise";
  name: string;
  price: string;
  cadence: string;
  audience: string;
  status: TierStatus;
  features: Array<{ label: string; status: "live" | "roadmap" }>;
  highlight?: boolean;
}> = [
  {
    id: "pro",
    name: "Radar Pro",
    price: "£29",
    cadence: "per month",
    audience: "Solo marketers, small clubs, students",
    status: "partial",
    features: [
      { label: "Browse all fixtures, scored and ranked", status: "live" },
      { label: "Private CSV exports on every view", status: "live" },
      { label: "Save a sponsor profile with custom teams", status: "live" },
      { label: "Weekly Monday-morning email brief", status: "roadmap" },
      { label: "Alert rules for a single club", status: "roadmap" },
    ],
  },
  {
    id: "studio",
    name: "Sponsor Studio",
    price: "£249",
    cadence: "per month",
    audience: "One brand's sponsorship team",
    highlight: true,
    status: "partial",
    features: [
      { label: "Everything in Pro", status: "live" },
      { label: "Estimated media value + audience-fit scores", status: "live" },
      { label: "Guest-list & hospitality planner", status: "live" },
      { label: "Competitor-collision flags", status: "roadmap" },
      { label: "Historical seasons + custom marquee players", status: "roadmap" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "£899",
    cadence: "per month",
    audience: "Up to 10 client workspaces",
    status: "partial",
    features: [
      { label: "Everything in Studio", status: "live" },
      { label: "Branded fixture one-pagers (your logo, your colours)", status: "live" },
      { label: "Print-to-PDF briefings from the browser", status: "live" },
      { label: "Slack / Teams / email delivery", status: "roadmap" },
      { label: "Comparison mode across 2–3 brands", status: "roadmap" },
      { label: "Seat-based team access", status: "roadmap" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "From £25k",
    cadence: "per year",
    audience: "Clubs, leagues, broadcasters",
    status: "concept",
    features: [
      { label: "API access & data licensing", status: "roadmap" },
      { label: "Historical & multi-competition data", status: "roadmap" },
      { label: "SSO, priority support, custom SLAs", status: "roadmap" },
      { label: "Bespoke scoring & branding", status: "roadmap" },
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
              Independent project · Free while in development
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              A different way to look at the Premier League fixture calendar.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Fixture Radar scores every match for <strong className="text-foreground">content value</strong>,{" "}
              <strong className="text-foreground">hospitality value</strong> and an{" "}
              <strong className="text-foreground">estimated media value</strong> — an exploration of how sponsorship teams could plan around the season instead of reacting to it.
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
                href="#concept"
                className="rounded-md border border-border bg-surface px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-surface-2"
              >
                Commercial concept
              </a>
              <Link
                to="/app"
                className="rounded-md px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Browse the free fan app →
              </Link>
            </div>
            <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
              Interesting for &nbsp;·&nbsp; Sponsor brands &nbsp;·&nbsp; Sponsorship agencies &nbsp;·&nbsp; Club commercial teams &nbsp;·&nbsp; Rights-holders
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
                  {example?.brand_name ?? "Sample sponsor"} — top hospitality fixtures
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
              Studio adds an estimated £ media value (heuristic, not audited).
            </div>
          </div>
        </div>
      </section>

      {/* Built by */}
      <section className="border-b border-border bg-accent/5">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="inline-block w-fit rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Built by
            </div>
            <div className="flex-1">
              <p className="text-base sm:text-lg text-foreground/90">
                Fixture Radar is an independent project designed and built by{" "}
                <strong className="text-foreground">Maira Chaudhary</strong>, a Computer Science
                student at the University of Southampton, as a working exploration of how
                sponsorship teams could plan around the fixture calendar.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  LinkedIn →
                </a>
                <a href={`mailto:${INQUIRY_EMAIL}`} className="font-semibold text-accent hover:underline">
                  {INQUIRY_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What works today */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">What works today</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything below is live in this app right now — no mockups.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Tile
              title="Every fixture, scored"
              body="Content Score and Hospitality Score in every row, with a transparent breakdown. Estimated media value is a heuristic model, shown as an estimate."
              foot="Rivalry · Table stakes · Star power · Tentpoles · Form"
            />
            <Tile
              title="Sponsor Lens"
              body="Pick a sponsor profile, weight fixtures by their sponsored teams and audience fit, and open a branded fixture one-pager with guest-list planner."
              foot="Save profiles · Copy summary · Print to PDF"
            />
            <Tile
              title="Free CSV exports"
              body="Download this week's fixtures or a sponsor's hospitality ranking as CSV, on any view, without an account."
              foot="This Week · Sponsor Lens · Season Radar"
            />
          </div>

          <h3 className="mt-12 font-display text-lg font-bold uppercase tracking-wider text-muted-foreground">
            On the roadmap
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <RoadmapChip label="Weekly email briefings" />
            <RoadmapChip label="Slack / Teams delivery" />
            <RoadmapChip label="Competitor-collision flags" />
            <RoadmapChip label="Comparison mode across brands" />
            <RoadmapChip label="Historical seasons + WSL / Championship" />
            <RoadmapChip label="Public API & data licensing" />
            <RoadmapChip label="SSO and team seats" />
            <RoadmapChip label="Audited media-value model" />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Who it's aimed at</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <RoleCard
              tag="Sponsor brands"
              lines={[
                "Rank fixtures by fit for your brand",
                "See a heuristic media-value estimate per slot",
                "Export a ranking to share internally",
              ]}
            />
            <RoleCard
              tag="Sponsorship agencies"
              lines={[
                "Set up a client profile with logo and colours",
                "Print branded fixture one-pagers as PDF",
                "Copy a fixture summary in one click",
              ]}
            />
            <RoleCard
              tag="Club commercial teams"
              lines={[
                "Spot the highest-value hospitality fixtures",
                "See rivalry, form, and star-power context",
                "Plan guest invites from the one-pager",
              ]}
            />
            <RoleCard
              tag="Rights-holders & comms"
              lines={[
                "See which fixtures look biggest each week",
                "Read auto-generated storyline angles",
                "Use scored data as a planning starting point",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Commercial concept */}
      <section id="concept" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Commercial concept</h2>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                These tiers are a concept for how Fixture Radar could work as a product. It is
                currently free while in development, and I would love feedback from people who work
                in sponsorship.
              </p>
            </div>
            <Link to="/app" className="text-sm font-semibold text-accent hover:underline">
              Try Radar Free →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.id}
                className={`card-glass flex flex-col rounded-xl border p-6 ${
                  t.highlight ? "border-accent shadow-lg ring-2 ring-accent/30" : "border-border"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {t.highlight && (
                    <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                      Most complete
                    </span>
                  )}
                  <TierStatusBadge status={t.status} />
                </div>
                <h3 className="font-display text-xl font-bold">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {t.audience}
                </p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-black">{t.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{t.cadence}</span>
                  <div className="text-[11px] uppercase tracking-wider text-accent">
                    Free while in development
                  </div>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2">
                      {f.status === "live" ? (
                        <span className="mt-0.5 text-accent">✓</span>
                      ) : (
                        <span className="mt-0.5 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Roadmap
                        </span>
                      )}
                      <span className={f.status === "roadmap" ? "text-muted-foreground" : ""}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a
                    href={inquiryMailto(t.name)}
                    className="block w-full break-words rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-foreground hover:opacity-90"
                  >
                    Share feedback
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Prices are indicative only — Fixture Radar is not currently taking payments. Nothing on
            this page is a commercial offer.
          </p>

          <div className="mt-10 rounded-xl border border-accent/40 bg-accent/5 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-display text-xl font-bold">
                  Work in sponsorship? I'd love your feedback.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  If any of this looks useful — or is missing the mark — tell me. I'm building this
                  solo and every note actually shapes what gets built next.
                </p>
              </div>
              <a
                href={inquiryMailto()}
                className="rounded-md bg-accent px-5 py-3 text-center font-display text-sm font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Closer */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">The one-line version</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            An independent take on turning the Premier League calendar into a planning tool: every
            fixture scored for <strong className="text-foreground">content</strong>,{" "}
            <strong className="text-foreground">hospitality</strong> and an{" "}
            <strong className="text-foreground">estimated media value</strong>, with a Sponsor Lens
            for brand-specific views.
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
              href={inquiryMailto()}
              className="rounded-md border border-border bg-surface px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-surface-2"
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function TierStatusBadge({ status }: { status: TierStatus }) {
  if (status === "live") {
    return (
      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
        Available today
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
        Partly built
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      Concept
    </span>
  );
}

function RoadmapChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-surface/60 px-3 py-2">
      <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Soon
      </span>
      <span className="text-sm">{label}</span>
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
