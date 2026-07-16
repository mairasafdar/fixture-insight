import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

const items = [
  { to: "/", label: "This Week" },
  { to: "/radar", label: "Season Radar" },
  { to: "/table", label: "Table" },
  { to: "/storylines", label: "Storylines" },
] as const;

export function Nav({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-grass text-primary-foreground shadow-glow">
            <Radar className="size-4" strokeWidth={2.5} />
          </span>
          <span>
            Fixture <span className="text-grass">Radar</span>
          </span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-center">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-grass/10 data-[status=active]:text-grass"
              activeProps={{ "data-status": "active" } as never}
              activeOptions={{ exact: it.to === "/" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden size-1.5 rounded-full bg-grass sm:inline-block animate-pulse" />
          <span className="hidden sm:inline">Last updated</span>
          <span className="font-mono">
            {lastUpdated ? formatRelative(lastUpdated) : "—"}
          </span>
        </div>
      </div>
    </header>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
