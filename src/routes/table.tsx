import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllData } from "@/lib/queries";
import { PageState } from "@/components/PageState";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export const Route = createFileRoute("/table")({
  component: TablePage,
  head: () => ({
    meta: [
      { title: "Premier League Table — Fixture Radar" },
      { name: "description", content: "Live Premier League standings with recent form." },
      { property: "og:title", content: "Premier League Table — Fixture Radar" },
      { property: "og:description", content: "Live Premier League standings with recent form." },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/table" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/table" }],
  }),
});

function FormPill({ result }: { result: string }) {
  const map: Record<string, string> = {
    W: "bg-grass/20 text-grass",
    D: "bg-muted text-muted-foreground",
    L: "bg-destructive/20 text-destructive",
  };
  return (
    <span
      className={`inline-grid size-5 place-items-center rounded text-[10px] font-bold ${map[result] ?? "bg-muted text-muted-foreground"}`}
    >
      {result}
    </span>
  );
}

function TablePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["fixture-data"],
    queryFn: fetchAllData,
  });

  if (isLoading) return <PageState label="Loading table…" />;
  if (error) return <PageState label="Couldn't load table." error />;
  if (!data) return null;

  const teamById = new Map(data.teams.map((t) => [t.id, t]));

  let rows: Array<{
    key: string;
    position: number | null;
    name: string;
    tla: string | null;
    crest: string | null;
    played: number;
    won: number;
    draw: number;
    lost: number;
    gd: number;
    points: number;
    form: string | null;
    isAlpha: boolean;
  }>;

  if (data.standings.length === 0) {
    // Pre-season fallback
    rows = [...data.teams]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({
        key: `t-${t.id}`,
        position: null,
        name: t.name,
        tla: t.tla,
        crest: t.crest,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        gd: 0,
        points: 0,
        form: null,
        isAlpha: true,
      }));
  } else {
    rows = data.standings.map((s) => {
      const t = teamById.get(s.team_id);
      return {
        key: `s-${s.team_id}`,
        position: s.position,
        name: t?.name ?? "Unknown",
        tla: t?.tla ?? null,
        crest: t?.crest ?? null,
        played: s.played_games,
        won: s.won,
        draw: s.draw,
        lost: s.lost,
        gd: s.goal_difference,
        points: s.points,
        form: s.form,
        isAlpha: false,
      };
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Premier League Table</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {rows[0]?.isAlpha
            ? "Standings will populate once matchday 1 concludes. Teams listed alphabetically for now."
            : "Live standings with recent form (most recent match on the left)."}
        </p>
      </header>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Club</th>
                <th className="px-2 py-3 text-center">P</th>
                <th className="px-2 py-3 text-center">W</th>
                <th className="px-2 py-3 text-center">D</th>
                <th className="px-2 py-3 text-center">L</th>
                <th className="px-2 py-3 text-center">GD</th>
                <th className="px-2 py-3 text-center font-bold text-foreground">Pts</th>
                <th className="hidden px-3 py-3 text-left sm:table-cell">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((r) => {
                const zoneClass =
                  r.position === null
                    ? ""
                    : r.position <= 4
                      ? "border-l-2 border-grass"
                      : r.position === 5
                        ? "border-l-2 border-grass/40"
                        : r.position >= 18
                          ? "border-l-2 border-destructive/70"
                          : "";
                return (
                  <tr key={r.key} className={`${zoneClass} transition hover:bg-surface-2/40`}>
                    <td className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                      {r.position ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {r.crest ? (
                          <img src={r.crest} alt="" className="size-6 rounded bg-white/5 p-0.5" loading="lazy" />
                        ) : (
                          <div className="grid size-6 place-items-center rounded bg-secondary text-[10px] font-semibold">
                            {r.tla ?? "?"}
                          </div>
                        )}
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-muted-foreground">{r.played}</td>
                    <td className="px-2 py-2.5 text-center">{r.won}</td>
                    <td className="px-2 py-2.5 text-center">{r.draw}</td>
                    <td className="px-2 py-2.5 text-center">{r.lost}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span
                        className={
                          r.gd > 0
                            ? "text-grass"
                            : r.gd < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {r.gd > 0 ? "+" : ""}
                        {r.gd}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold">{r.points}</td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      {r.form ? (
                        <div className="flex gap-1">
                          {r.form
                            .split(/[,\s]/)
                            .filter(Boolean)
                            .slice(0, 5)
                            .map((res, i) => (
                              <FormPill key={i} result={res} />
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows[0] && !rows[0].isAlpha && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-1 bg-grass" /> Champions League
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-1 bg-grass/40" /> Europa League
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-1 bg-destructive/70" /> Relegation
          </span>
        </div>
      )}
      {/* Suppress unused imports for future position-movement work */}
      <span className="hidden">
        <ArrowUp /> <ArrowDown /> <Minus />
      </span>
    </div>
  );
}
