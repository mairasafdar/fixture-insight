import { Link } from "@tanstack/react-router";

const items = [
  { to: "/", label: "This Week" },
  { to: "/radar", label: "Season Radar" },
  { to: "/table", label: "Table" },
  { to: "/storylines", label: "Storylines" },
] as const;

// Premier League style lightning bolt
function Bolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden="true">
      <path
        d="M14 0 L2 18 H10 L8 32 L22 12 H13 L16 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Stylised PL lion crown
function LionCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {/* crown */}
      <path d="M8 12 L12 6 L15 10 L20 4 L25 10 L28 6 L32 12 L30 15 L10 15 Z" fill="currentColor" />
      {/* mane */}
      <path
        d="M10 15 C8 18 7 22 9 26 C11 30 15 32 20 32 C25 32 29 30 31 26 C33 22 32 18 30 15 Z"
        fill="currentColor"
      />
      {/* face cut */}
      <circle cx="17" cy="22" r="1.4" fill="var(--color-background)" />
      <path d="M22 20 Q25 22 22 25" stroke="var(--color-background)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Nav({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-white/10 bg-background">
      {/* diagonal bolt band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[55%] opacity-90"
        style={{
          background:
            "linear-gradient(115deg, transparent 22%, oklch(0.28 0.11 320) 22.4%, oklch(0.28 0.11 320) 26%, transparent 26.4%, transparent 32%, oklch(0.34 0.14 335 / 0.85) 32.2%, oklch(0.34 0.14 335 / 0.85) 34.5%, transparent 34.9%)",
        }}
      />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-foreground">
          <span className="relative grid size-10 place-items-center rounded-md bg-foreground text-background">
            <LionCrest className="size-6" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/70">
              Fixture
            </span>
            <span className="font-display text-2xl font-black uppercase tracking-wide">
              Radar
            </span>
          </span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-center">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="whitespace-nowrap rounded-sm px-3.5 py-1.5 font-display text-sm font-semibold uppercase tracking-wider text-foreground/70 transition-colors hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              activeProps={{ "data-status": "active" } as never}
              activeOptions={{ exact: it.to === "/" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[11px] uppercase tracking-wider text-foreground/70">
          <Bolt className="size-3 text-accent" />
          <span className="hidden sm:inline">Updated</span>
          <span className="font-mono normal-case">
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
