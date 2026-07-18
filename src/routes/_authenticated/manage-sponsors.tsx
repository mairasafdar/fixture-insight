import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchSponsorProfiles, fetchTeams } from "@/lib/queries";
import type { SponsorProfile, SponsorshipType } from "@/lib/sponsor-types";
import { SPONSORSHIP_TYPE_LABEL } from "@/lib/sponsor-types";

export const Route = createFileRoute("/_authenticated/sponsors")({
  component: ManageSponsors,
  head: () => ({
    meta: [{ title: "Manage sponsors — Fixture Radar" }],
  }),
});

const TYPES: SponsorshipType[] = ["shirt_front", "sleeve", "stadium", "official_partner"];

function ManageSponsors() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return setIsAdmin(false);
      const { data: r } = await (supabase as any).rpc("has_role", { _user_id: uid, _role: "admin" });
      setIsAdmin(Boolean(r));
    })();
  }, []);

  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: fetchTeams });
  const { data: sponsors = [] } = useQuery({ queryKey: ["sponsors"], queryFn: fetchSponsorProfiles });

  const [form, setForm] = useState<{
    brand_name: string;
    category: string;
    sponsorship_type: SponsorshipType;
    team_ids: number[];
    rival_brands: string;
    rival_categories: string;
  }>({
    brand_name: "",
    category: "",
    sponsorship_type: "official_partner",
    team_ids: [],
    rival_brands: "",
    rival_categories: "",
  });
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.brand_name.trim() || !form.category.trim()) return;
    const payload = {
      brand_name: form.brand_name.trim(),
      category: form.category.trim(),
      sponsorship_type: form.sponsorship_type,
      team_ids: form.team_ids,
      rival_brands: form.rival_brands.split(",").map((s) => s.trim()).filter(Boolean),
      rival_categories: form.rival_categories.split(",").map((s) => s.trim()).filter(Boolean),
      is_example: false,
    };
    const { error } = await (supabase as any).from("sponsor_profiles").insert(payload);
    if (error) return setErr(error.message);
    setForm({ brand_name: "", category: "", sponsorship_type: "official_partner", team_ids: [], rival_brands: "", rival_categories: "" });
    qc.invalidateQueries({ queryKey: ["sponsors"] });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("sponsor_profiles").delete().eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["sponsors"] });
  }

  async function updateSponsor(id: string, patch: Partial<SponsorProfile>) {
    const { error } = await (supabase as any).from("sponsor_profiles").update(patch).eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["sponsors"] });
  }

  if (isAdmin === null) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Not an admin yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Grant your account admin access first:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-surface-2 p-3 text-[11px]">
{`insert into public.user_roles (user_id, role)
values ('${userId ?? "<your-user-id>"}', 'admin');`}
        </pre>
        <div className="mt-6 flex gap-2 text-xs">
          <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))} className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">
            Sign out
          </button>
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">Home</Link>
        </div>
      </div>
    );
  }

  const teamsSorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Manage sponsors</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Sponsor profiles power the Sponsor Lens view. Seeded EXAMPLE brands are placeholders —
            replace them with verified real sponsors from each club's official partners page.
          </p>
        </div>
        <Link
          to="/_authenticated/admin"
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
        >
          Marquee players →
        </Link>
      </header>

      <form onSubmit={submit} className="card-glass mb-8 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Brand name</label>
          <input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} placeholder="e.g. Moët & Chandon" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Category</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. champagne" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Sponsorship type</label>
          <select value={form.sponsorship_type} onChange={(e) => setForm({ ...form, sponsorship_type: e.target.value as SponsorshipType })} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
            {TYPES.map((t) => (<option key={t} value={t}>{SPONSORSHIP_TYPE_LABEL[t]}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Clubs (multi-select)</label>
          <select
            multiple
            value={form.team_ids.map(String)}
            onChange={(e) => {
              const ids = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
              setForm({ ...form, team_ids: ids });
            }}
            className="h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            {teamsSorted.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Rival brands (comma-separated)</label>
          <input value={form.rival_brands} onChange={(e) => setForm({ ...form, rival_brands: e.target.value })} placeholder="Bollinger, Veuve Clicquot" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Rival categories (comma-separated)</label>
          <input value={form.rival_categories} onChange={(e) => setForm({ ...form, rival_categories: e.target.value })} placeholder="champagne, sparkling_wine" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2 flex items-center justify-between">
          {err && <div className="text-xs text-destructive">{err}</div>}
          <button type="submit" className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">Add sponsor</button>
        </div>
      </form>

      <ul className="space-y-3">
        {sponsors.map((s) => (
          <li key={s.id} className="card-glass p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold">{s.brand_name}</span>
                  {s.is_example && (
                    <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">Example</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {s.category} · {SPONSORSHIP_TYPE_LABEL[s.sponsorship_type] ?? s.sponsorship_type} ·{" "}
                  Clubs: {s.team_ids.map((id) => teams.find((t) => t.id === id)?.name ?? `#${id}`).join(", ") || "—"}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Rival brands: {s.rival_brands.join(", ") || "—"} · Rival categories: {s.rival_categories.join(", ") || "—"}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {s.is_example && (
                  <button
                    onClick={() => updateSponsor(s.id, { is_example: false, brand_name: s.brand_name.replace(/^EXAMPLE — /, "") })}
                    className="rounded border border-border px-2 py-1 text-[11px] hover:bg-surface-2"
                  >
                    Mark real
                  </button>
                )}
                <button onClick={() => remove(s.id)} className="rounded border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
