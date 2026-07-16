import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";

const items = [
  { to: "/", label: "This Week" },
  { to: "/radar", label: "Season Radar" },
  { to: "/table", label: "Table" },
  { to: "/storylines", label: "Storylines" },
] as const;

const AUBERGINE = "oklch(0.20 0.09 320)";
const AUBERGINE_2 = "oklch(0.28 0.11 320)";
const MAGENTA = "oklch(0.62 0.26 340)";

function Bolt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 32" className={className} style={style} aria-hidden="true">
      <path d="M14 0 L2 18 H10 L8 32 L22 12 H13 L16 0 Z" fill="currentColor" />
    </svg>
  );
}

function LionCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M6 14 L11 6 L14 12 L20 4 L26 12 L29 6 L34 14 L31 17 L9 17 Z" fill="currentColor" />
      <path
        d="M9 17 C6.5 21 6 26 9 30 C12 33.5 16 35 20 35 C24 35 28 33.5 31 30 C34 26 33.5 21 31 17 Z"
        fill="currentColor"
      />
      <circle cx="16.5" cy="24" r="1.6" fill={AUBERGINE} />
      <path d="M22 22 Q26 24 22 28" stroke={AUBERGINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Nav({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <header
      className="relative isolate overflow-hidden text-white"
      style={{ backgroundColor: AUBERGINE }}
    >
      {/* diagonal lightning band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-0 w-[60%]"
        style={{
          background: `linear-gradient(115deg, transparent 18%, ${AUBERGINE_2} 18.4%, ${AUBERGINE_2} 24%, transparent 24.4%, transparent 30%, ${MAGENTA} 30.2%, ${MAGENTA} 32.5%, transparent 32.9%, transparent 40%, ${AUBERGINE_2} 40.2%, ${AUBERGINE_2} 41.5%, transparent 41.9%)`,
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-sm"
            style={{ backgroundColor: "white", color: AUBERGINE }}
          >
            <LionCrest className="size-7" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Fixture
            </span>
            <span className="font-display text-2xl font-black uppercase tracking-wide text-white">
              Radar
            </span>
          </span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-center">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="whitespace-nowrap rounded-sm px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-white data-[status=active]:bg-white data-[status=active]:text-[oklch(0.20_0.09_320)]"
              activeProps={{ "data-status": "active" } as never}
              activeOptions={{ exact: it.to === "/" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70">
          <Bolt className="size-3" style={{ color: MAGENTA }} />
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
