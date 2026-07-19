import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "How scoring works — Fixture Radar" },
      {
        name: "description",
        content:
          "How the Fixture Radar Content Score works: rivalry, table stakes, star power, tentpole moments and form.",
      },
      { property: "og:title", content: "How scoring works — Fixture Radar" },
      {
        property: "og:description",
        content:
          "Breakdown of the five components that power the Fixture Radar Content Score.",
      },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is the Fixture Radar Content Score?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "An automated 0–100 score for every Premier League fixture, built from five components: Rivalry, Table stakes, Star power, Tentpole moments and Form.",
              },
            },
            {
              "@type": "Question",
              name: "How is Rivalry scored?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Up to 25 points from a hardcoded matrix of derbies and classic rivalries.",
              },
            },
            {
              "@type": "Question",
              name: "How is Table stakes scored?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Up to 25 points for top-4 clashes, 1st vs 2nd, relegation six-pointers and tight points gaps. Activates once teams have played 5+ games.",
              },
            },
            {
              "@type": "Question",
              name: "How is Star power scored?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Up to 25 points from marquee players on show. Tier 1 = 10 pts each, Tier 2 = 5 pts, capped at 25.",
              },
            },
            {
              "@type": "Question",
              name: "How are Tentpole and Form scored?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tentpole adds up to 15 points for opening weekend, Boxing Day, festive fixtures and final day. Form adds up to 10 points when a team is on a 4+ game winning or unbeaten streak.",
              },
            },
          ],
        }),
      },
    ],
  }),
});

const rows = [
  { label: "Rivalry", cap: 25, blurb: "Derbies and classic rivalries with a hardcoded matrix." },
  { label: "Table stakes", cap: 25, blurb: "Top-4 clashes, 1st vs 2nd, relegation six-pointers, tight points gaps. Activates once teams have played 5+ games." },
  { label: "Star power", cap: 25, blurb: "Marquee players on show. Tier 1 = 10 pts each, Tier 2 = 5 pts, capped at 25." },
  { label: "Tentpole", cap: 15, blurb: "Opening weekend, Boxing Day, festive fixtures, final day." },
  { label: "Form", cap: 10, blurb: "Either team on a 4+ game winning or unbeaten streak." },
];

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How scoring works</h1>
      <p className="mt-3 text-muted-foreground">
        Every Premier League fixture gets an automated 0–100 Content Score, built from five components.
        Rivalry and table stakes drive engagement with existing fans; star power drives reach with new
        fans discovering the league; tentpole moments and form handle timing.
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Component</th>
              <th className="px-4 py-2">Cap</th>
              <th className="px-4 py-2">What it rewards</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.cap}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.blurb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Star Power is the only component with a manually curated list. The rest computes from
        football-data.org, auto-refreshed every 6 hours.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold tracking-tight">Sponsor Lens</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Sponsor Lens re-views the season for a chosen sponsor brand. Every fixture involving their
        sponsored club(s) gets a Hospitality Score (0–100), driven by kickoff timing (weekend
        afternoons win), opponent quality (marquee opponents and rivalries), league stakes, and
        tentpole weekends. Any fixture against a club sponsored by a rival brand or category is
        flagged as a "category clash" — the sharpest hospitality moments of the season.
      </p>

      <div className="mt-8 text-sm">
        <Link to="/app" className="text-accent hover:underline">← Back to This Week</Link>
      </div>
    </div>
  );
}


