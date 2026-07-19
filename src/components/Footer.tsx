import { Link } from "@tanstack/react-router";
import { logLinkClick } from "@/lib/analytics";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-foreground/70 sm:px-6">
        <div>
          Data:{" "}
          <a
            href="https://www.football-data.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            football-data.org
          </a>
          , auto-refreshed every 6 hours.
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <Link to="/about" className="hover:underline">How scoring works</Link>
          <Link to="/contact" onClick={() => logLinkClick("contact", "/contact")} className="hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
