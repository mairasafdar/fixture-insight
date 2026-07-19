import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAgencies, type Agency } from "@/lib/agency-types";

export const Route = createFileRoute("/_authenticated/agencies")({
  component: ManageAgencies,
  head: () => ({ meta: [{ title: "Agencies — Fixture Radar" }] }),
});

function ManageAgencies() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: agencies = [] } = useQuery({ queryKey: ["agencies"], queryFn: fetchAgencies });

  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    primary_color: "#37003c",
    contact_email: "",
    footer_note: "",
  });
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!userId) return;
    if (!form.name.trim()) return;
    const payload = {
      owner_id: userId,
      name: form.name.trim(),
      logo_url: form.logo_url.trim() || null,
      primary_color: form.primary_color || "#37003c",
      contact_email: form.contact_email.trim() || null,
      footer_note: form.footer_note.trim() || null,
    };
    const { error } = await (supabase as any).from("agencies").insert(payload);
    if (error) return setErr(error.message);
    setForm({ name: "", logo_url: "", primary_color: "#37003c", contact_email: "", footer_note: "" });
    qc.invalidateQueries({ queryKey: ["agencies"] });
  }

  async function update(id: string, patch: Partial<Agency>) {
    const { error } = await (supabase as any).from("agencies").update(patch).eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["agencies"] });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("agencies").delete().eq("id", id);
    if (error) setErr(error.message);
    qc.invalidateQueries({ queryKey: ["agencies"] });
  }

  const mine = agencies.filter((a) => a.owner_id === userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Agencies</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Create a white-label agency profile — logo, brand colour and footer note — then assign
            it to sponsors on the manage-sponsors page. Every fixture briefing for that sponsor
            renders with your branding and exports as a branded PDF.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <Link to="/_authenticated/manage-sponsors" className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">Sponsors →</Link>
          <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))} className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2">Sign out</button>
        </div>
      </header>

      <form onSubmit={submit} className="card-glass mb-8 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Agency name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Northline Partnerships" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Logo URL</label>
          <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Brand colour</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-9 w-14 rounded border border-border bg-surface" />
            <input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Contact email</label>
          <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="partnerships@agency.com" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Footer note (appears on briefings)</label>
          <input value={form.footer_note} onChange={(e) => setForm({ ...form, footer_note: e.target.value })} placeholder="Prepared by Northline Partnerships · Confidential" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2 flex items-center justify-between">
          {err && <div className="text-xs text-destructive">{err}</div>}
          <button type="submit" className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">Create agency</button>
        </div>
      </form>

      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your agencies</h2>
      <ul className="space-y-3">
        {mine.length === 0 && (
          <li className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No agencies yet — create one above.
          </li>
        )}
        {mine.map((a) => (
          <li key={a.id} className="card-glass p-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border text-xs font-bold text-white"
                style={{ backgroundColor: a.primary_color ?? "#37003c" }}
              >
                {a.logo_url ? (
                  <img src={a.logo_url} alt="" className="max-h-12 max-w-12 object-contain" />
                ) : (
                  a.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">{a.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {a.contact_email ?? "—"} · {a.primary_color}
                </div>
                {a.footer_note && (
                  <div className="mt-1 text-[11px] italic text-muted-foreground">"{a.footer_note}"</div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => {
                    const name = prompt("Agency name", a.name);
                    if (name) update(a.id, { name });
                  }}
                  className="rounded border border-border px-2 py-1 text-[11px] hover:bg-surface-2"
                >
                  Rename
                </button>
                <button onClick={() => remove(a.id)} className="rounded border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10">
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
