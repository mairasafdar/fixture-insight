import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { fetchAllData, fetchSponsorProfiles } from "@/lib/queries";
import { enrichFixtures } from "@/lib/content-score";
import { scoreHospitality } from "@/lib/hospitality-score";
import { estimateMediaValue, estimateAudienceFit, planGuestList, formatGbp } from "@/lib/sponsor-value";
import { downloadCsv } from "@/lib/csv";
import { PageState } from "@/components/PageState";

const search = z.object({ sponsor: z.string().optional() });


export const Route = createFileRoute("/sponsor-fixture/$id")({
  validateSearch: search,
  component: OnePager,
  head: ({ params }) => ({
    meta: [
      { title: "Fixture one-pager — Fixture Radar" },
      { name: "description", content: "Single-page fixture summary for a sponsor, ready to screenshot." },
      { property: "og:title", content: "Fixture one-pager — Fixture Radar" },
      { property: "og:description", content: "Sponsor hospitality summary for a Premier League fixture." },
      { property: "og:url", content: `https://fixture-pulse.lovable.app/sponsor-fixture/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `https://fixture-pulse.lovable.app/sponsor-fixture/${params.id}` }],
  }),
});

const chipStyle: Record<string, string> = {
  kickoff: "bg-accent/15 text-accent border-accent/30",
  rivalry: "bg-destructive/15 text-destructive border-destructive/30",
  table: "bg-grass/15 text-grass border-grass/30",
  star: "bg-accent/15 text-accent border-accent/30",
  form: "bg-warning/15 text-warning border-warning/30",
  tentpole: "bg-secondary text-secondary-foreground border-border",
};

function ukDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OnePager() {
  const { id } = Route.useParams();
  const { sponsor: sponsorId } = Route.useSearch();
  const fixtureId = Number(id);
  const [copied, setCopied] = useState(false);
  const [seats, setSeats] = useState(30);


  const { data: base, isLoading } = useQuery({ queryKey: ["fixture-data"], queryFn: fetchAllData });
  const { data: sponsors = [] } = useQuery({ queryKey: ["sponsors"], queryFn: fetchSponsorProfiles });

  const enrichedAll = useMemo(() => {
    if (!base) return [];
    return enrichFixtures(base.fixtures, base.teams, base.standings, base.marquee);
  }, [base]);

  if (isLoading) return <PageState label="Loading fixture…" />;
  if (!base) return null;

  const e = enrichedAll.find((x) => x.fixture.id === fixtureId);
  if (!e) throw notFound();

  const sponsor = sponsors.find((s) => s.id === sponsorId) ?? null;
  const sponsorTeamIds = new Set(sponsor?.team_ids ?? []);
  const hospitality = sponsor ? scoreHospitality(e, sponsorTeamIds, sponsor, sponsors) : null;
  const emv = estimateMediaValue(e, hospitality);
  const fit = sponsor ? estimateAudienceFit(e, sponsor) : null;
  const guests = planGuestList(seats, hospitality);

  const summary = buildSummary(e, hospitality, sponsor?.brand_name ?? null, emv, fit);

  function exportGuestList() {
    const rows = guests.map((g) => ({
      fixture: `${e!.home?.name ?? "?"} vs ${e!.away?.name ?? "?"}`,
      kickoff_uk: ukDate(e!.fixture.utc_date),
      bucket: g.name,
      seats: g.seats,
      guidance: g.note,
    }));
    downloadCsv(
      `guest-list-${e!.home?.short_name ?? "home"}-vs-${e!.away?.short_name ?? "away"}.csv`,
      toCsvRows(rows),
    );
  }


  async function copy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-4 flex items-center justify-between gap-2 text-sm">
        <Link
          to="/sponsors"
          search={sponsor ? { sponsor: sponsor.id } : {}}
          className="text-accent hover:underline"
        >
          ← Back to Sponsor Lens
        </Link>
        <button
          onClick={copy}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-surface-2"
        >
          {copied ? "Copied ✓" : "Copy summary"}
        </button>
      </div>

      <article className="card-glass p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {sponsor ? `Sponsor Lens · ${sponsor.brand_name}` : "Fixture one-pager"}
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {e.home?.name ?? "?"} <span className="text-muted-foreground">vs</span>{" "}
          {e.away?.name ?? "?"}
        </h1>
        <div className="mt-1 text-sm text-muted-foreground">
          {ukDate(e.fixture.utc_date)} · UK
          {e.fixture.matchday ? ` · Matchday ${e.fixture.matchday}` : ""}
        </div>

        {hospitality?.sponsorDerby && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            Category clash:{" "}
            {sponsor?.brand_name.replace(/^EXAMPLE — /, "")} vs{" "}
            {hospitality.sponsorDerby.rivalBrand ?? hospitality.sponsorDerby.rivalCategory}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Content Score
              </div>
              <div className="font-display text-2xl font-bold text-grass">
                {(e.score.total / 10).toFixed(1)}
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.score.chips.map((c, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${chipStyle[c.kind]}`}
                >
                  {c.label} <span className="opacity-60">+{c.points}</span>
                </span>
              ))}
            </div>
          </div>

          {hospitality && (
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Hospitality Score · {hospitality.isHome ? "Home" : "Away"}
                </div>
                <div className="font-display text-2xl font-bold text-grass">
                  {(hospitality.total / 10).toFixed(1)}
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {hospitality.chips.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${chipStyle[c.kind]}`}
                  >
                    {c.label} <span className="opacity-60">+{c.points}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {e.score.angles.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-grass">
              Content angles
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {e.score.angles.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-grass" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

function buildSummary(
  e: ReturnType<typeof enrichFixtures>[number],
  hospitality: ReturnType<typeof scoreHospitality> | null,
  sponsorName: string | null,
): string {
  const lines: string[] = [];
  if (sponsorName) lines.push(`SPONSOR LENS · ${sponsorName}`);
  lines.push(`${e.home?.name ?? "?"} vs ${e.away?.name ?? "?"}`);
  lines.push(ukDate(e.fixture.utc_date) + " (UK)");
  lines.push("");
  lines.push(`Content Score: ${(e.score.total / 10).toFixed(1)}/10`);
  for (const c of e.score.chips) lines.push(`  • ${c.label} (+${c.points})`);
  if (hospitality) {
    lines.push("");
    lines.push(
      `Hospitality Score: ${(hospitality.total / 10).toFixed(1)}/10 · ${hospitality.isHome ? "HOME" : "AWAY"}`,
    );
    for (const c of hospitality.chips) lines.push(`  • ${c.label} (+${c.points})`);
    if (hospitality.sponsorDerby) {
      lines.push(
        `  ! Category clash vs ${hospitality.sponsorDerby.rivalBrand ?? hospitality.sponsorDerby.rivalCategory}`,
      );
    }
  }
  if (e.score.angles.length) {
    lines.push("");
    lines.push("Content angles:");
    for (const a of e.score.angles) lines.push(`  - ${a}`);
  }
  return lines.join("\n");
}
