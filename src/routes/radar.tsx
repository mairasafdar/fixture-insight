import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData } from "@/lib/queries";
import { enrichFixtures, maxAttainable } from "@/lib/content-score";
import { PageState } from "@/components/PageState";

export const Route = createFileRoute("/radar")({
  component: RadarPage,
  head: () => ({
    meta: [
      { title: "Season Radar — Fixture Radar" },
      {
        name: "description",
        content: "The 40 highest-scoring Premier League fixtures of the season, grouped by month.",
      },
    ],
  }),
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function RadarPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["fixture-data"],
    queryFn: fetchAllData,
  });

  if (isLoading) return <PageState label="Loading season radar…" />;
  if (error) return <PageState label="Couldn't load radar." error />;
  if (!data) return null;

  const now = Date.now();
  const upcoming = data.fixtures.filter(
    (f) => new Date(f.utc_date).getTime() >= now && f.status !== "FINISHED",
  );
  const enriched = enrichFixtures(upcoming, data.teams, data.standings, data.marquee);
  const top20 = [...enriched].sort((a, b) => b.score.total - a.score.total).slice(0, 40);

  // Group by year-month
  const groups = new Map<string, typeof top20>();
  for (const e of top20) {
    const d = new Date(e.fixture.utc_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Season Radar</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Forty tentpole moments in the Premier League season, sorted by month.
        </p>
      </header>

      {top20.length === 0 ? (
        <PageState label="No upcoming fixtures ranked yet." />
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([key, list]) => {
            const [year, monthStr] = key.split("-");
            const monthName = MONTH_NAMES[parseInt(monthStr, 10) - 1];
            return (
              <section key={key}>
                <div className="mb-3 flex items-baseline gap-2 border-b border-border/60 pb-2">
                  <h2 className="font-display text-lg font-semibold text-grass">{monthName}</h2>
                  <span className="text-xs text-muted-foreground">{year}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{list.length} fixtures</span>
                </div>
                <ul className="divide-y divide-border/50">
                  {list
                    .sort((a, b) => new Date(a.fixture.utc_date).getTime() - new Date(b.fixture.utc_date).getTime())
                    .map((e) => (
                      <li key={e.fixture.id} className="flex items-center gap-4 py-3">
                        <div className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                          {new Date(e.fixture.utc_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            timeZone: "Europe/London",
                          })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {e.home?.name ?? "?"} <span className="text-muted-foreground">vs</span>{" "}
                            {e.away?.name ?? "?"}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            {e.score.chips.slice(0, 3).map((c, i) => (
                              <span key={i} className="after:ml-2 after:text-border after:content-['·'] last:after:hidden">
                                {c.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-lg bg-grass/10 px-2.5 py-1 font-display text-lg font-bold text-grass">
                          {(e.score.total / 10).toFixed(1)}<span className="text-xs text-muted-foreground">/10</span>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
