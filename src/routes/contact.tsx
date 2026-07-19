import { createFileRoute } from "@tanstack/react-router";
import { logLinkClick } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — Fixture Radar" },
      {
        name: "description",
        content: "Get in touch with the creator of Fixture Radar.",
      },
      { property: "og:title", content: "Contact — Fixture Radar" },
      {
        property: "og:description",
        content: "Get in touch with the creator of Fixture Radar.",
      },
      { property: "og:url", content: "https://fixture-pulse.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://fixture-pulse.lovable.app/contact" }],
  }),
});

function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-black uppercase tracking-wide">Contact</h1>
      <p className="mt-4 text-foreground/80">
        Fixture Radar is built and maintained by Maira Chaudhary. For questions, feedback or
        collaboration, reach out on LinkedIn.
      </p>
      <div className="mt-6 rounded-md border border-border bg-card p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          LinkedIn
        </div>
        <a
          href="https://www.linkedin.com/in/maira-s-9a006b227"
          target="_blank"
          rel="noreferrer"
          onClick={() => logLinkClick("linkedin", "https://www.linkedin.com/in/maira-s-9a006b227")}
          className="mt-1 inline-block font-display text-xl font-bold text-accent hover:underline"
        >
          linkedin.com/in/maira-s-9a006b227
        </a>
      </div>
    </div>
  );
}
