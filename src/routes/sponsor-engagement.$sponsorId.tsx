import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSponsorProfiles } from "@/lib/queries";
import { PageState } from "@/components/PageState";
import { toCsv, downloadCsv } from "@/lib/csv";
import { logLinkClick } from "@/lib/analytics";

type EngagementRow = {
  fixture_id: number;
  matchup: string;
  utc_date: string;
  card_clicks: number;
  angle_clicks: number;
  avg_card_dwell_ms: number;
  avg_angle_dwell_ms: number;
  total_clicks: number;
};

export const Route = createFileRoute("/sponsor-engagement/$sponsorId")({
  component: SponsorEngagement,
  head: ({ params }) => ({
    meta: [
      { title: `Sponsor engagement report — Fixture Radar` },
      {
        name: "description",
        content:
          "Public engagement report for a sponsor: click and dwell stats across fixtures for their sponsored Premier League clubs.",
      },
      { property: "og:title", content: "Sponsor engagement report — Fixture Radar" },
      {
        property: "og:description",
        content:
          "Click and dwell engagement across a sponsor's Premier League fixtures.",
      },
      {
        property: "og:url",
        content: `https://fixture-pulse.lovable.app/sponsor-engagement/${params.sponsorId}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://fixture-pulse.lovable.app/sponsor-engagement/${params.sponsorId}`,
      },
    ],
  }),
});

async function fetchEngagement(sponsorId: string): Promise<EngagementRow[]> {
  const { data, error } = await (supabase as any).rpc("get_sponsor_engagement", {
    _sponsor_id: sponsorId,
  });
  if (error) throw error;
  return (data ?? []) as EngagementRow[];
}

function fmtMs(ms: number): string {
  if (!ms || ms <= 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function ukDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SponsorEngagement() {
  const { sponsorId } = Route.useParams();

  useEffect(() => {
    logLinkClick("sponsor-page", `sponsor:${sponsorId}`);
  }, [sponsorId]);

  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors"],
    queryFn: fetchSponsorProfiles,
  });
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["sponsor-engagement", sponsorId],
    queryFn: () => fetchEngagement(sponsorId),
  });

  const sponsor = sponsors.find((s) => s.id === sponsorId);

  const totals = useMemo(() => {
    let cardClicks = 0,
      angleClicks = 0,
      cardDwellSum = 0,
      cardDwellN = 0,
      angleDwellSum = 0,
      angleDwellN = 0;
    for (const r of rows) {
      cardClicks += Number(r.card_clicks) || 0;
      angleClicks += Number(r.angle_clicks) || 0;
      if (r.avg_card_dwell_ms > 0) {
        cardDwellSum += Number(r.avg_card_dwell_ms);
        cardDwellN += 1;
      }
      if (r.avg_angle_dwell_ms > 0) {
        angleDwellSum += Number(r.avg_angle_dwell_ms);
        angleDwellN += 1;
      }
    }
    return {
      cardClicks,
      angleClicks,
      totalClicks: cardClicks + angleClicks,
      avgCardDwellMs: cardDwellN ? cardDwellSum / cardDwellN : 0,
      avgAngleDwellMs: angleDwellN ? angleDwellSum / angleDwellN : 0,
      fixturesWithClicks: rows.filter((r) => Number(r.total_clicks) > 0).length,
    };
  }, [rows]);

  // Engagement-weighted ranking: clicks + angle emphasis + dwell bonus.
  const ranked = useMemo(() => {
    return rows
      .map((r) => {
        const clicks = Number(r.card_clicks) + 2 * Number(r.angle_clicks);
        const dwellSec =
          (Number(r.avg_card_dwell_ms) + Number(r.avg_angle_dwell_ms)) / 1000;
        const dwellBonus = 1 + Math.min(1, dwellSec / 20); // up to +100% at ≥20s combined avg
        const engagement = clicks * dwellBonus;
        return { ...r, engagement };
      })
      .sort((a, b) => b.engagement - a.engagement);
  }, [rows]);

  function exportCsv() {
    logLinkClick("sponsor-csv-export", `sponsor:${sponsorId}`);
    const csvRows = ranked.map((r, i) => ({
      rank: i + 1,
      fixture_id: r.fixture_id,
      matchup: r.matchup,
      kickoff_utc: r.utc_date,
      card_clicks: r.card_clicks,
      angle_clicks: r.angle_clicks,
      total_clicks: r.total_clicks,
      avg_card_dwell_ms: Math.round(Number(r.avg_card_dwell_ms)),
      avg_angle_dwell_ms: Math.round(Number(r.avg_angle_dwell_ms)),
      engagement_weighted_score: r.engagement.toFixed(2),
    }));
    const safe = (sponsor?.brand_name ?? "sponsor")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    downloadCsv(
      `sponsor-engagement_${safe}_${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(csvRows),
    );
  }

  if (isLoading) return <PageState label="Loading engagement…" />;
  if (error) return <PageState label="Couldn't load engagement." error />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Sponsor engagement report
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {sponsor ? sponsor.brand_name.replace(/^EXAMPLE — /, "") : "Sponsor"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Public engagement across Fixture Radar for this sponsor's clubs — how many
          users clicked into their fixtures and how long they engaged with the content.
        </p>
        <div className="mt-3 flex gap-3 text-xs">
          <Link
            to="/sponsors"
            search={{ sponsor: sponsorId }}
            className="text-accent hover:underline"
          >
            ← Back to Sponsor Lens
          </Link>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clicks" value={totals.totalClicks} sub={`${totals.fixturesWithClicks} fixtures engaged`} />
        <StatCard label="Card clicks" value={totals.cardClicks} sub={`${totals.angleClicks} content-angle clicks`} />
        <StatCard label="Avg card dwell" value={fmtMs(totals.avgCardDwellMs)} sub="per fixture card view" />
        <StatCard label="Avg angle dwell" value={fmtMs(totals.avgAngleDwellMs)} sub="per content angle" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          Engagement-weighted fixture ranking
        </h2>
        <button
          type="button"
          onClick={exportCsv}
          disabled={ranked.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          ⬇ Export CSV
        </button>
      </div>

      {ranked.length === 0 ? (
        <PageState label="No fixtures yet for this sponsor's clubs." />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Fixture</th>
                <th className="px-3 py-2">Kickoff</th>
                <th className="px-3 py-2 text-right">Card</th>
                <th className="px-3 py-2 text-right">Angle</th>
                <th className="px-3 py-2 text-right">Avg dwell</th>
                <th className="px-3 py-2 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ranked.map((r, i) => (
                <tr key={r.fixture_id} className={r.engagement === 0 ? "text-muted-foreground" : ""}>
                  <td className="px-3 py-2 font-mono text-xs">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{r.matchup}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{ukDate(r.utc_date)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{r.card_clicks}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{r.angle_clicks}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {fmtMs((Number(r.avg_card_dwell_ms) + Number(r.avg_angle_dwell_ms)) / 2)}
                  </td>
                  <td className="px-3 py-2 text-right font-display font-semibold">
                    {r.engagement.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Engagement score = (card clicks + 2 × angle clicks) × (1 + min(1, avg dwell seconds / 20)).
      </p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card-glass p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
