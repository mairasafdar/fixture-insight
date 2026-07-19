import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { joinWaitlist } from "@/lib/waitlist.functions";

type Tier = "pro" | "studio" | "agency" | "enterprise";

export function WaitlistForm({
  tier,
  tierLabel,
  compact = false,
}: {
  tier: Tier;
  tierLabel: string;
  compact?: boolean;
}) {
  const join = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: { email: string; company?: string; role?: string }) =>
      join({
        data: {
          ...payload,
          tier,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          utm_source:
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("utm_source") || undefined
              : undefined,
        },
      }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="rounded-md border border-grass/40 bg-grass/10 px-4 py-3 text-sm text-grass">
        {mutation.data?.already
          ? `You're already on the ${tierLabel} waitlist — we'll be in touch.`
          : `You're on the ${tierLabel} waitlist. Expect an email within 48 hours.`}
      </div>
    );
  }

  return (
    <form
      className={compact ? "flex flex-col gap-2 sm:flex-row" : "grid gap-2"}
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ email, company: company || undefined, role: role || undefined });
      }}
    >
      <input
        type="email"
        required
        placeholder="Work email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      {!compact && (
        <>
          <input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            placeholder="Your role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? "Joining…" : `Join ${tierLabel} waitlist`}
      </button>
      {mutation.isError && (
        <div className="text-xs text-destructive sm:col-span-2">
          {(mutation.error as Error).message}
        </div>
      )}
    </form>
  );
}
