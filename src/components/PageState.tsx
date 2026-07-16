export function PageState({ label, error = false }: { label: string; error?: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div
        className={`rounded-xl border ${
          error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-surface text-muted-foreground"
        } px-6 py-10 text-center`}
      >
        {label}
      </div>
    </div>
  );
}
