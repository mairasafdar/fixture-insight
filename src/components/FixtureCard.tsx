import type { Enriched } from "@/lib/content-score";

const kindStyles: Record<string, string> = {
  rivalry: "bg-destructive/15 text-destructive border-destructive/30",
  table: "bg-grass/15 text-grass border-grass/30",
  star: "bg-accent/15 text-accent border-accent/30",
  form: "bg-warning/15 text-warning border-warning/30",
  tentpole: "bg-secondary text-secondary-foreground border-border",
};

function ukTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamBadge({ name, crest, tla }: { name: string; crest: string | null; tla: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {crest ? (
        <img src={crest} alt="" className="size-8 shrink-0 rounded-md bg-secondary p-0.5" loading="lazy" />
      ) : (
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">
          {tla ?? "?"}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate font-medium leading-tight">{name}</div>
        {tla && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tla}</div>}
      </div>
    </div>
  );
}

function ScoreMeter({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const scaled = Math.round(value / 10);
  const hue = pct >= 70 ? "text-grass" : pct >= 40 ? "text-warning" : "text-muted-foreground";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`font-display text-3xl font-bold leading-none ${hue}`}>
        {scaled}
        <span className="text-lg text-muted-foreground">/10</span>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Content Score</div>
      <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-grass transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FixtureCard({ e, rank }: { e: Enriched; rank?: number }) {
  const { fixture, home, away, score } = e;
  return (
    <article className="card-glass group relative overflow-hidden p-5 transition hover:border-grass/40 hover:shadow-glow">
      {rank !== undefined && (
        <div className="absolute right-4 top-4 font-mono text-xs text-muted-foreground">#{rank}</div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            {ukTime(fixture.utc_date)} · UK
            {fixture.matchday ? <span className="ml-2">MD{fixture.matchday}</span> : null}
          </div>
          <div className="mt-2 space-y-2">
            {home && <TeamBadge name={home.name} crest={home.crest} tla={home.tla} />}
            <div className="pl-10 text-xs text-muted-foreground">vs</div>
            {away && <TeamBadge name={away.name} crest={away.crest} tla={away.tla} />}
          </div>
        </div>
        <ScoreMeter value={score.total} />
      </div>

      {score.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {score.chips.map((c, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${kindStyles[c.kind]}`}
            >
              {c.label} <span className="opacity-60">+{c.points}</span>
            </span>
          ))}
        </div>
      )}

      {score.angles.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-grass">
            Content angles
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {score.angles.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-grass" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
