import Link from "next/link";
import { CalendarCheck, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkTabs } from "@/components/ui/Tabs";
import { SearchBox } from "@/components/admin/SearchBox";
import { Pagination } from "@/components/admin/Pagination";
import { PayStatus, ResStatus } from "@/components/admin/StatusBadges";
import { dateFr, fcfa } from "@/lib/format";
import { isIsoDate } from "@/lib/dates";
import type { PaymentStatus, ReservationStatus } from "@/lib/types";

const PER = 40;
const TABS = [
  { key: "all", label: "Toutes" }, { key: "pending", label: "En attente" }, { key: "confirmed", label: "Confirmées" },
  { key: "in_progress", label: "En cours" }, { key: "completed", label: "Terminées" }, { key: "cancelled", label: "Annulées" },
];

type SP = { statut?: string; q?: string; appartement?: string; du?: string; au?: string; page?: string };

export default async function Reservations({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const statut = TABS.some((t) => t.key === sp.statut) ? sp.statut! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  const { data: apts } = await supabase.from("apartments").select("id, name").order("name");

  let q = supabase.from("reservations")
    .select("id, reference, check_in, check_out, nights, total_amount, amount_paid, status, payment_status, source, created_at, apartment:apartments(id,name), customer:customers!inner(id,full_name,phone,whatsapp)", { count: "exact" })
    .order("check_in", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (statut !== "all") q = q.eq("status", statut);
  if (sp.appartement) q = q.eq("apartment_id", sp.appartement);
  if (isIsoDate(sp.du)) q = q.gte("check_out", sp.du);
  if (isIsoDate(sp.au)) q = q.lte("check_in", sp.au);
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, "");
    const { data: custs } = await supabase.from("customers").select("id").or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,whatsapp.ilike.%${s}%,email.ilike.%${s}%`).limit(200);
    const ids = (custs ?? []).map((c) => c.id);
    q = q.or(`reference.ilike.%${s}%${ids.length ? `,customer_id.in.(${ids.join(",")})` : ""}`);
  }
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);
  type Row = { id: string; reference: string; check_in: string; check_out: string; nights: number; total_amount: number; amount_paid: number; status: ReservationStatus; payment_status: PaymentStatus; source: string; apartment: { name: string } | null; customer: { full_name: string; whatsapp: string | null; phone: string | null } | null };
  const rows = (data ?? []) as unknown as Row[];
  const base = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const href = (p: number) => { const u = new URLSearchParams(base); u.set("page", String(p)); return `/admin/reservations?${u}`; };
  const tabHref = (k: string) => { const u = new URLSearchParams(base); u.delete("statut"); if (k !== "all") u.set("statut", k); return `/admin/reservations?${u}`; };

  return (
    <>
      <PageHeader title="Réservations" description={`${count ?? 0} réservation(s)`}
        actions={<ButtonLink href="/admin/reservations/nouvelle" variant="primary"><Plus className="size-4" /> Ajouter une réservation</ButtonLink>} />
      <LinkTabs active={statut} items={TABS.map((t) => ({ key: t.key, label: t.label, href: tabHref(t.key) }))} />
      <Card>
        <form className="flex flex-wrap items-end gap-2 border-b border-line p-3" method="get">
          {statut !== "all" && <input type="hidden" name="statut" value={statut} />}
          <SearchBox placeholder="Référence, nom ou téléphone du client…" />
          <select name="appartement" defaultValue={sp.appartement ?? ""} className="input w-auto min-w-40">
            <option value="">Tous les appartements</option>
            {(apts ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-muted">Du <input type="date" name="du" defaultValue={sp.du} className="input w-auto" /></label>
          <label className="flex items-center gap-1 text-xs text-muted">au <input type="date" name="au" defaultValue={sp.au} className="input w-auto" /></label>
          <button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50">Filtrer</button>
          {(sp.appartement || sp.du || sp.au) && <Link href={tabHref(statut)} className="text-sm text-brand-600 hover:underline">Réinitialiser</Link>}
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="size-5" />} title="Aucune réservation" text="Les demandes envoyées depuis le site apparaissent ici automatiquement."
            action={<ButtonLink href="/admin/reservations/nouvelle" variant="primary"><Plus className="size-4" /> Ajouter une réservation</ButtonLink>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Réservation</th><th>Client</th><th className="hidden md:table-cell">Appartement</th><th>Séjour</th><th className="text-right">Total</th><th className="hidden lg:table-cell text-right">Reste</th><th>Statut</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/admin/reservations/${r.id}`} className="font-medium hover:underline">{r.reference}</Link>{r.source === "website" && <div className="text-[11px] text-brand-600">Site web</div>}</td>
                    <td><div className="font-medium">{r.customer?.full_name}</div><div className="text-xs text-muted">{r.customer?.whatsapp || r.customer?.phone}</div></td>
                    <td className="hidden md:table-cell">{r.apartment?.name}</td>
                    <td className="whitespace-nowrap">{dateFr(r.check_in, { day: "numeric", month: "short" })} → {dateFr(r.check_out)}<div className="text-xs text-muted">{r.nights} nuit(s)</div></td>
                    <td className="text-right tabular-nums">{fcfa(r.total_amount)}<div className="mt-0.5"><PayStatus s={r.payment_status} /></div></td>
                    <td className="hidden text-right tabular-nums lg:table-cell">{fcfa(Math.max(0, r.total_amount - r.amount_paid))}</td>
                    <td><ResStatus s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={count ?? 0} perPage={PER} href={href} />
      </Card>
    </>
  );
}
