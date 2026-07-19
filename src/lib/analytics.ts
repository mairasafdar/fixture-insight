import { supabase } from "@/integrations/supabase/client";

export type LinkKey =
  | "linkedin"
  | "contact"
  | "football-data"
  | "fixture-card"
  | "fixture-angle"
  | "fixture-card-dwell"
  | "fixture-angle-dwell"
  | "sponsor-page"
  | "sponsor-fixture-card"
  | "sponsor-fixture-card-dwell"
  | "sponsor-csv-export";


function contextString(): string {
  if (typeof window === "undefined") return "";
  const ref = document.referrer || "";
  const search = window.location.search || "";
  const path = window.location.pathname || "";
  // Combine referrer + current URL search (for UTMs) into a parseable single field.
  return `ref=${ref} | page=${path}${search}`;
}

export function logLinkClick(linkKey: LinkKey, href?: string) {
  if (typeof window === "undefined") return;
  const payload = {
    link_key: linkKey,
    href: href ?? null,
    referrer: contextString(),
    user_agent: navigator.userAgent || null,
  };
  // Fire and forget — never block the navigation.
  void (supabase as any).from("link_clicks").insert(payload);
}

/**
 * Log dwell time in ms for engagement quality measurement.
 * href encodes: "<original-ref>::dwell_ms:<n>"
 */
export function logDwell(
  kind: "fixture-card-dwell" | "fixture-angle-dwell",
  ref: string,
  ms: number,
) {
  if (typeof window === "undefined") return;
  if (ms < 400) return; // ignore accidental hovers
  const capped = Math.min(ms, 5 * 60 * 1000);
  logLinkClick(kind, `${ref}::dwell_ms:${Math.round(capped)}`);
}
