import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

// Bump this version when the changelog updates — reopens the modal for returning users.
export const INTRO_VERSION = "2026-07-19";
const STORAGE_KEY = "fr-intro-seen-version";

export const CHANGELOG: Array<{ date: string; items: string[] }> = [
  {
    date: "2026-07-19",
    items: [
      "Dwell-time analytics on fixture cards and content angles.",
      "Referrer & UTM breakdown in the admin dashboard.",
      "CSV export for the drill-down tables (top fixtures, top angle templates).",
      "First-visit tour + rolling changelog (this popup).",
    ],
  },
  {
    date: "2026-07-18",
    items: [
      "Sponsor Lens: rank the season by Hospitality Score for a chosen brand.",
      "Fixture one-pager with copy-summary for hospitality decks.",
    ],
  },
  {
    date: "2026-07-17",
    items: [
      "Star Power scoring added (marquee players list).",
      "Public CSV exports on This Week and Sponsor Lens.",
    ],
  },
];

const TOUR: Array<{ title: string; body: string; href?: string; label?: string }> = [
  {
    title: "1 · This Week",
    body: "The next 8 days of Premier League fixtures, ranked by Content Score across rivalry, table stakes, star power, tentpole moments and form.",
    href: "/",
    label: "See This Week",
  },
  {
    title: "2 · Season Radar",
    body: "The top 40 highest-scoring fixtures of the season, grouped by month — spot tentpole storylines early.",
    href: "/radar",
    label: "Open Season Radar",
  },
  {
    title: "3 · Sponsor Lens",
    body: "Re-view the season through a sponsor's eyes. A demo beer brand is pre-loaded so you can see the Hospitality Score in action.",
    href: "/sponsors",
    label: "Try Sponsor Lens",
  },
  {
    title: "4 · How scoring works",
    body: "Every chip on a card is a breakdown of the score. The About page explains the full formula.",
    href: "/about",
    label: "Read the scoring guide",
  },
];

export function IntroModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen !== INTRO_VERSION) setOpen(true);
  }, []);

  function close() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, INTRO_VERSION);
    }
    setOpen(false);
    setStep(0);
  }

  if (!open) return null;

  const s = TOUR[step];
  const isLast = step === TOUR.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Fixture Radar"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-glass relative w-full max-w-lg overflow-hidden p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-2"
        >
          Skip ✕
        </button>

        <div className="text-[11px] uppercase tracking-wider text-accent">Welcome to Fixture Radar</div>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{s.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>

        {s.href && (
          <Link
            to={s.href}
            onClick={close}
            className="mt-4 inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
          >
            {s.label} →
          </Link>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {TOUR.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i === step ? "bg-accent" : "bg-border"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((v) => v - 1)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((v) => v + 1)}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
              >
                Get started
              </button>
            )}
          </div>
        </div>

        <details className="mt-6 border-t border-border pt-4">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            What's new
          </summary>
          <ul className="mt-3 space-y-3 text-xs">
            {CHANGELOG.map((entry) => (
              <li key={entry.date}>
                <div className="font-mono text-[10px] text-muted-foreground">{entry.date}</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                  {entry.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

/** Force-open the modal from a nav button — resets the storage flag. */
export function openIntroModal() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  // Trigger by dispatching a storage-like event; simpler: reload the tour by hard-refresh signal.
  window.dispatchEvent(new Event("fr-open-intro"));
}
