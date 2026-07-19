import { createFileRoute } from "@tanstack/react-router";

// Scheduled every 30 minutes via pg_cron. Iterates active alert_rules,
// evaluates them against the current fixture + score data, and delivers
// notifications through Slack/Teams webhooks (email is stubbed for now).

type AlertRule = {
  id: string;
  user_id: string;
  sponsor_id: string | null;
  label: string;
  rule_type:
    | "content_score_threshold"
    | "marquee_out"
    | "streak"
    | "upset"
    | "fixture_this_week";
  threshold: number | null;
  channel: "email" | "slack" | "teams";
  destination: string;
  active: boolean;
};

async function deliver(
  rule: AlertRule,
  dedupKey: string,
  fixtureId: number | null,
  title: string,
  detail: string,
  supabaseAdmin: any,
) {
  // Skip if already delivered for this dedup key
  const { data: existing } = await supabaseAdmin
    .from("alert_deliveries")
    .select("id")
    .eq("rule_id", rule.id)
    .eq("dedup_key", dedupKey)
    .maybeSingle();
  if (existing) return;

  let status = "sent";
  let error: string | null = null;

  try {
    if (rule.channel === "slack" || rule.channel === "teams") {
      const body =
        rule.channel === "slack"
          ? { text: `*Fixture Radar alert* — ${title}\n${detail}` }
          : { text: `**Fixture Radar alert — ${title}**\n${detail}` };
      const res = await fetch(rule.destination, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        status = "failed";
        error = `${res.status} ${await res.text().catch(() => "")}`.slice(0, 500);
      }
    } else if (rule.channel === "email") {
      // Email delivery requires a verified sender domain — logged for now.
      status = "pending_email_setup";
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
  }

  await supabaseAdmin.from("alert_deliveries").insert({
    rule_id: rule.id,
    fixture_id: fixtureId,
    dedup_key: dedupKey,
    payload: { title, detail, channel: rule.channel },
    status,
    error,
  });
}

async function evaluate() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [rulesRes, fixturesRes, teamsRes, sponsorsRes, standingsRes] = await Promise.all([
    supabaseAdmin.from("alert_rules").select("*").eq("active", true),
    supabaseAdmin
      .from("fixtures")
      .select("id, matchday, utc_date, status, home_team_id, away_team_id, home_score, away_score"),
    supabaseAdmin.from("teams").select("id, name, short_name"),
    supabaseAdmin.from("sponsor_profiles").select("id, team_ids, brand_name"),
    supabaseAdmin.from("standings").select("team_id, position, form, points"),
  ]);

  const rules: AlertRule[] = (rulesRes.data ?? []) as AlertRule[];
  const fixtures = fixturesRes.data ?? [];
  const teams = new Map<number, any>((teamsRes.data ?? []).map((t: any) => [t.id, t]));
  const sponsors = new Map<string, any>(
    (sponsorsRes.data ?? []).map((s: any) => [s.id, s]),
  );
  const standings = new Map<number, any>(
    (standingsRes.data ?? []).map((s: any) => [s.team_id, s]),
  );

  const now = Date.now();
  const weekAhead = now + 8 * 24 * 3600 * 1000;
  const upcoming = fixtures.filter(
    (f: any) =>
      f.status !== "FINISHED" &&
      new Date(f.utc_date).getTime() >= now &&
      new Date(f.utc_date).getTime() <= weekAhead,
  );

  let evaluated = 0;
  let delivered = 0;

  for (const rule of rules) {
    const sponsor = rule.sponsor_id ? sponsors.get(rule.sponsor_id) : null;
    const teamIds: number[] = sponsor?.team_ids ?? [];
    const relevant = teamIds.length
      ? upcoming.filter((f: any) => teamIds.includes(f.home_team_id) || teamIds.includes(f.away_team_id))
      : upcoming;

    for (const f of relevant) {
      evaluated++;
      const home = teams.get(f.home_team_id)?.name ?? "?";
      const away = teams.get(f.away_team_id)?.name ?? "?";
      const matchup = `${home} vs ${away}`;
      const when = new Date(f.utc_date).toUTCString();
      const fixtureLabel = `${matchup} — ${when}`;

      if (rule.rule_type === "fixture_this_week") {
        const dedup = `week:${f.id}`;
        await deliver(
          rule,
          dedup,
          f.id,
          `${sponsor?.brand_name ?? "Watchlist"} fixture this week`,
          fixtureLabel,
          supabaseAdmin,
        );
        delivered++;
      } else if (rule.rule_type === "streak") {
        const forms = [
          standings.get(f.home_team_id)?.form as string | null,
          standings.get(f.away_team_id)?.form as string | null,
        ];
        const streaky = forms.some((form) => {
          if (!form) return false;
          const recent = form.split(",").slice(-4);
          return recent.length >= 4 && recent.every((r) => r.trim().toUpperCase() === "W");
        });
        if (streaky) {
          await deliver(
            rule,
            `streak:${f.id}`,
            f.id,
            "Team on a hot streak",
            fixtureLabel,
            supabaseAdmin,
          );
          delivered++;
        }
      }
      // content_score_threshold, marquee_out, upset: evaluated by admin dashboard for now
      // (full engine port needs enrichFixtures on the server; noted for follow-up).
    }
  }

  return { rules: rules.length, evaluated, delivered };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

async function handle() {
  try {
    const result = await evaluate();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("evaluate-alerts failed", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

export const Route = createFileRoute("/api/public/hooks/evaluate-alerts")({
  // @ts-expect-error - `server` is provided at build time by the TanStack Start plugin
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async () => handle(),
      POST: async () => handle(),
    },
  },
});
