export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        Built by{" "}
        <span className="font-medium text-foreground">Maira Chaudhary</span>. Data:{" "}
        <a
          href="https://www.football-data.org"
          target="_blank"
          rel="noreferrer"
          className="text-grass hover:underline"
        >
          football-data.org
        </a>
        , auto-refreshed every 6 hours.
      </div>
    </footer>
  );
}
