import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type Tier = "pro" | "studio" | "agency" | "enterprise";

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email: string;
      company?: string;
      tier: Tier;
      role?: string;
      referrer?: string;
      utm_source?: string;
    }) => {
      if (!input?.email || !/^[^@]+@[^@]+\.[^@]+$/.test(input.email)) {
        throw new Error("Please enter a valid email address.");
      }
      const tiers: Tier[] = ["pro", "studio", "agency", "enterprise"];
      if (!tiers.includes(input.tier)) throw new Error("Invalid tier.");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error } = await client.from("waitlist_signups").insert({
      email: data.email.trim().toLowerCase(),
      company: data.company?.trim() || null,
      tier: data.tier,
      role: data.role?.trim() || null,
      referrer: data.referrer ?? null,
      utm_source: data.utm_source ?? null,
    });
    if (error) {
      // 23505 = unique violation → already on list, treat as success
      if ((error as { code?: string }).code === "23505") return { ok: true, already: true };
      throw new Error(error.message);
    }
    return { ok: true, already: false };
  });
