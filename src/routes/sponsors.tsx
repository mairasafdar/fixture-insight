import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { fetchAllData, fetchSponsorProfiles } from "@/lib/queries";
import { enrichFixtures } from "@/lib/content-score";
import { scoreHospitality, sponsorHostFixtures, HOSPITALITY_WEIGHTS } from "@/lib/hospitality-score";
import { SPONSORSHIP_TYPE_LABEL } from "@/lib/sponsor-types";
import { PageState } from "@/components/PageState";

const search = z.object({ sponsor: z.string().optional() });

export const Route = createFileRoute("/sponsors")({
  validateSearch: search,
  component: SponsorLens,
  head: () => ({
    meta: [
      { title: "Sponsor Lens — Fixture Radar" },
      {
        name: "description",
        content:
          "Re-view the Premier League season through a sponsor's eyes: fixtures for their sponsored clubs, ranked by hospitality value.",
      },
      { property: "og:title", content: "Sponsor Lens — Fixture Radar" },
      {
        property: "og:description",
        content:
          "Rank Premier League fixtures by hospitality value for a chosen sponsor brand.",
      },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/sponsors" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/sponsors" }],
  }),
});

function ukDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const chipStyle: Record<string, string> = {
  kickoff: "bg-accent/15 text-accent border-accent/30",
  rivalry: "bg-destructive/15 text-destructive border-destructive/30",
  table: "bg-grass/15 text-grass border-grass/30",
  star: "bg-accent/15 text-accent border-accent/30",
  form: "bg-warning/15 text-warning border-warning/30",
  tentpole: "bg-secondary text-secondary-foreground border-border",
};

function SponsorLens() {
  const { sponsor: sponsorId } = Route.useSearch();
  const navigate = useNavigate({ from: "/sponsors" });

  const { data: base, isLoading: bLoading, error: bError } = useQuery({
    queryKey: ["fixture-data"],
    queryFn: fetchAllData,
  });
  const { data: sponsors = [], isLoading: sLoading } = useQuery({
    queryKey: ["sponsors"],
    queryFn: fetchSponsorProfiles,
  });

  const selected = sponsors.find((s) => s.id === sponsorId) ?? null;

  const enrichedAll = useMemo(() => {
    if (!base) return [];
    return enrichFixtures(base.fixtures, base.teams, base.standings, base.marquee);
  }, [base]);

  const teamById = useMemo(() => {
    if (!base) return new Map<number, (typeof base extends { teams: (infer T)[] } ? T : never)>();
    return new Map(base.teams.map((t) => [t.id, t]));
  }, [base]);

  if (bLoading || sLoading) return <PageState label="Loading Sponsor Lens…" />;
  if (bError) return <PageState label="Couldn't load sponsor data." error />;
  if (!base) return null;

  const sponsorTeamIds = new Set(selected?.team_ids ?? []);
  const sponsorFixtures = selected ? sponsorHostFixtures(enrichedAll, sponsorTeamIds) : [];

  const hospitalityList = selected
    ? sponsorFixtures
        .map((e) => ({ e, h: scoreHospitality(e, sponsorTeamIds, selected, sponsors) }))
        .sort((a, b) => b.h.total - a.h.total || new Date(a.e.fixture.utc_date).getTime() - new Date(b.e.fixture.utc_date).getTime())
    : [];

  const top10 = hospitalityList.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Sponsor Lens</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Rank fixtures by hospitality value for a chosen sponsor brand. Kickoff timing, opponent
          quality and league stakes drive the Hospitality Score.
        </p>
      </header>

      {/* Sponsor selector */}
      <div className="card-glass mb-8 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-64 flex-1">
          <label
            htmlFor="sponsor-select"
            className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Sponsor
          </label>
          <select
            id="sponsor-select"
            value={sponsorId ?? ""}
            onChange={(e) =>
              navigate({ search: { sponsor: e.target.value || undefined } })
            }
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Select a sponsor…</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.brand_name} · {s.category}
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <div className="text-xs text-muted-foreground">
            <div>
              <span className="uppercase tracking-wider">Type:</span>{" "}
              {SPONSORSHIP_TYPE_LABEL[selected.sponsorship_type] ?? selected.sponsorship_type}
            </div>
            <div>
              <span className="uppercase tracking-wider">Clubs:</span>{" "}
              {selected.team_ids
                .map((id) => teamById.get(id)?.name ?? `#${id}`)
                .join(", ") || "—"}
            </div>
          </div>
        )}
      </div>

      {!selected ? (
        <PageState label="Choose a sponsor to see their season." />
      ) : selected.team_ids.length === 0 ? (
        <PageState label="This sponsor isn't linked to any club yet." />
      ) : sponsorFixtures.length === 0 ? (
        <PageState label="No upcoming fixtures for this sponsor's club(s)." />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="mb-3 font-display text-xl font-semibold">Top 10 hospitality fixtures</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {top10.map(({ e, h }, i) => {
                const opp = h.isHome ? e.away : e.home;
                return (
                  <Link
                    key={e.fixture.id}
                    to="/sponsor-fixture/$id"
                    params={{ id: String(e.fixture.id) }}
                    search={{ sponsor: selected.id }}
                    className={`card-glass block p-4 transition hover:border-grass/40 hover:shadow-glow ${
                      h.isHome ? "border-l-4 border-l-grass" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          #{i + 1} · {ukDate(e.fixture.utc_date)} · {h.isHome ? "HOME" : "AWAY"}
                        </div>
                        <div className="mt-1 truncate font-semibold">
                          vs {opp?.name ?? "?"}
                        </div>
                        {h.sponsorDerby && (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            Category clash: {selected.brand_name.replace(/^EXAMPLE — /, "")} vs{" "}
                            {h.sponsorDerby.rivalBrand ?? h.sponsorDerby.rivalCategory}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-display text-2xl font-bold text-grass">
                          {(h.total / 10).toFixed(1)}
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Hospitality
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {h.chips.map((c, ci) => (
                        <span
                          key={ci}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${chipStyle[c.kind]}`}
                        >
                          {c.label} <span className="opacity-60">+{c.points}</span>
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">
              Full season — {sponsorFixtures.length} fixtures
            </h2>
            <ul className="divide-y divide-border/50 rounded-lg border border-border">
              {hospitalityList.map(({ e, h }) => {
                const opp = h.isHome ? e.away : e.home;
                return (
                  <li key={e.fixture.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div
                      className={`h-8 w-1 shrink-0 rounded ${h.isHome ? "bg-grass" : "bg-border"}`}
                      title={h.isHome ? "Home" : "Away"}
                    />
                    <div className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                      {ukDate(e.fixture.utc_date)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {h.isHome ? "vs" : "@"} {opp?.name ?? "?"}
                      </div>
                      {h.sponsorDerby && (
                        <div className="text-[10px] text-destructive">
                          Category clash vs {h.sponsorDerby.rivalBrand ?? h.sponsorDerby.rivalCategory}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-semibold text-grass">
                        {(h.total / 10).toFixed(1)}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        H · {(e.score.total / 10).toFixed(1)} C
                      </div>
                    </div>
                    <Link
                      to="/sponsor-fixture/$id"
                      params={{ id: String(e.fixture.id) }}
                      search={{ sponsor: selected.id }}
                      className="shrink-0 rounded border border-border px-2 py-1 text-[10px] uppercase tracking-wider hover:bg-surface-2"
                    >
                      Open
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-6 text-[11px] text-muted-foreground">
            Weights: kickoff appeal {HOSPITALITY_WEIGHTS.kickoff}, opponent quality{" "}
            {HOSPITALITY_WEIGHTS.opponent}, stakes {HOSPITALITY_WEIGHTS.stakes}, tentpole{" "}
            {HOSPITALITY_WEIGHTS.tentpole}.
          </div>
        </>
      )}
    </div>
  );
}
