import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData } from "@/lib/queries";
import { PageState } from "@/components/PageState";
import { Zap, TrendingUp, Flame } from "lucide-react";

export const Route = createFileRoute("/storylines")({
  component: StorylinesPage,
  head: () => ({
    meta: [
      { title: "Storylines — Fixture Radar" },
      {
        name: "description",
        content: "Recent Premier League results with auto-detected upsets, goal fests and streak stories.",
      },
    ],
  }),
});

type Flag = { icon: typeof Zap; label: string; tone: "upset" | "goals" | "streak" };

function StorylinesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["fixture-data"],
    queryFn: fetchAllData,
  });

  if (isLoading) return <PageState label="Loading storylines…" />;
  if (error) return <PageState label="Couldn't load storylines." error />;
  if (!data) return null;

  const teamById = new Map(data.teams.map((t) => [t.id, t]));
  const standingById = new Map(data.standings.map((s) => [s.team_id, s]));

  const finished = data.fixtures
    .filter((f) => f.status === "FINISHED" && f.home_score != null && f.away_score != null)
    .sort((a, b) => new Date(b.utc_date).getTime() - new Date(a.utc_date).getTime())
    .slice(0, 40);

  const items = finished.map((f) => {
    const home = teamById.get(f.home_team_id!);
    const away = teamById.get(f.away_team_id!);
    const flags: Flag[] = [];
    const hs = f.home_score!;
    const as = f.away_score!;
    const total = hs + as;

    // Upset: winner 8+ positions below opponent
    const homePos = standingById.get(f.home_team_id!)?.position;
    const awayPos = standingById.get(f.away_team_id!)?.position;
    if (homePos && awayPos && hs !== as) {
      const winnerPos = hs > as ? homePos : awayPos;
      const loserPos = hs > as ? awayPos : homePos;
      if (winnerPos - loserPos >= 8) {
        flags.push({ icon: Zap, label: `Upset (${winnerPos - loserPos} places below)`, tone: "upset" });
      }
    }
    if (total >= 5) flags.push({ icon: Flame, label: `Goal fest (${total} goals)`, tone: "goals" });

    return { fixture: f, home, away, flags };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Storylines</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Recent Premier League results with auto-detected upsets, goal fests and streak notes.
        </p>
      </header>

      {items.length === 0 ? (
        <PageState label="No completed fixtures yet." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(({ fixture, home, away, flags }) => {
            const hs = fixture.home_score!;
            const as = fixture.away_score!;
            const homeWon = hs > as;
            const awayWon = as > hs;
            return (
              <article key={fixture.id} className="card-glass p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>
                    {new Date(fixture.utc_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Europe/London",
                    })}
                  </span>
                  {fixture.matchday && <span>MD{fixture.matchday}</span>}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className={`flex items-center gap-2 ${homeWon ? "font-semibold" : "text-muted-foreground"}`}>
                    {home?.crest && (
                      <img src={home.crest} alt="" className="size-6 rounded bg-white/5 p-0.5" loading="lazy" />
                    )}
                    <span className="truncate">{home?.name ?? "?"}</span>
                  </div>
                  <div className="text-center font-display text-2xl font-bold tabular-nums">
                    <span className={homeWon ? "text-grass" : ""}>{hs}</span>
                    <span className="mx-1 text-muted-foreground">–</span>
                    <span className={awayWon ? "text-grass" : ""}>{as}</span>
                  </div>
                  <div className={`flex items-center justify-end gap-2 ${awayWon ? "font-semibold" : "text-muted-foreground"}`}>
                    <span className="truncate text-right">{away?.name ?? "?"}</span>
                    {away?.crest && (
                      <img src={away.crest} alt="" className="size-6 rounded bg-white/5 p-0.5" loading="lazy" />
                    )}
                  </div>
                </div>
                {flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {flags.map((f, i) => {
                      const Icon = f.icon;
                      const toneClass =
                        f.tone === "upset"
                          ? "bg-warning/15 text-warning border-warning/30"
                          : f.tone === "goals"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-grass/15 text-grass border-grass/30";
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass}`}
                        >
                          <Icon className="size-3" /> {f.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <span className="hidden">
        <TrendingUp />
      </span>
    </div>
  );
}
