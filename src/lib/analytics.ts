import { supabase } from "@/integrations/supabase/client";

export type LinkKey = "linkedin" | "contact" | "football-data";

export function logLinkClick(linkKey: LinkKey, href?: string) {
  if (typeof window === "undefined") return;
  const payload = {
    link_key: linkKey,
    href: href ?? null,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent || null,
  };
  // Fire and forget — never block the navigation.
  void (supabase as any).from("link_clicks").insert(payload);
}
