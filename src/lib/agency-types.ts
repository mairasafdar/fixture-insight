export type Agency = {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_email: string | null;
  footer_note: string | null;
};

export async function fetchAgencies() {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await (supabase as any)
    .from("agencies")
    .select("id, owner_id, name, logo_url, primary_color, contact_email, footer_note")
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as Agency[];
}
