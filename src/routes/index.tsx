import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData } from "@/lib/queries";
import { enrichFixtures, maxAttainable } from "@/lib/content-score";
import { FixtureCard } from "@/components/FixtureCard";
import { PageState } from "@/components/PageState";

export const Route = createFileRoute("/")({
  component: ThisWeek,
});

function ThisWeek() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["fixture-data"],
    queryFn: fetchAllData,
  });

  if (isLoading) return <PageState label="Loading fixtures…" />;
  if (error) return <PageState label="Couldn't load fixtures." error />;
  if (!data) return null;

  const now = Date.now();
  const in8Days = now + 8 * 24 * 60 * 60 * 1000;

  const upcoming = data.fixtures.filter((f) => {
    const t = new Date(f.utc_date).getTime();
    return t >= now && t <= in8Days && f.status !== "FINISHED";
  });

  const enriched = enrichFixtures(upcoming, data.teams, data.standings, data.marquee).sort(
    (a, b) => b.score.total - a.score.total || new Date(a.fixture.utc_date).getTime() - new Date(b.fixture.utc_date).getTime(),
  );

  const hasStandings = data.standings.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          This Week
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The next 8 days of Premier League football, ranked by an automated Content Score
          across rivalry, table stakes, form and tentpole moments.
        </p>
        {!hasStandings && (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Pre-season mode: standings aren't published yet. Table-stakes and form scoring
            will activate once the league begins.
          </div>
        )}
      </header>

      {enriched.length === 0 ? (
        <PageState label="No fixtures in the next 8 days." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enriched.map((e, i) => (
            <FixtureCard key={e.fixture.id} e={e} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

