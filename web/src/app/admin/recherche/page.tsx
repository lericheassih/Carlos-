import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { SearchBox } from "@/components/admin/SearchBox";
import { AptStatus, ResStatus } from "@/components/admin/StatusBadges";
import { dateFr } from "@/lib/format";
import type { ApartmentStatus, ReservationStatus } from "@/lib/types";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const s = q.trim().replace(/[%,()]/g, "");
  const supabase = await createClient();
  const [apts, custs, res] = s.length >= 2 ? await Promise.all([
    supabase.from("apartments").select("id, name, reference, status, neighborhood").or(`name.ilike.%${s}%,reference.ilike.%${s}%,neighborhood.ilike.%${s}%`).limit(10),
    supabase.from("customers").select("id, full_name, phone, whatsapp, email").or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,whatsapp.ilike.%${s}%,email.ilike.%${s}%`).limit(10),
    supabase.from("reservations").select("id, reference, status, check_in, check_out, customer:customers(full_name), apartment:apartments(name)").ilike("reference", `%${s}%`).limit(10),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  type Res = { id: string; reference: string; status: ReservationStatus; check_in: string; check_out: string; customer: { full_name: string } | null; apartment: { name: string } | null };
  const empty = s.length >= 2 && !apts.data?.length && !custs.data?.length && !res.data?.length;
  return (
    <>
      <PageHeader title="Recherche" />
      <div className="mb-4"><SearchBox placeholder="Appartement, client, téléphone, référence de réservation…" /></div>
      {empty && <p className="text-sm text-muted">Aucun résultat pour « {q} ».</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {!!apts.data?.length && <Card><CardHeader title="Appartements" /><ul className="mt-2">{apts.data.map((a) => <li key={a.id}><Link href={`/admin/appartements/${a.id}`} className="flex items-center justify-between gap-2 border-t border-line px-5 py-2.5 text-sm hover:bg-slate-50"><span><span className="font-medium">{a.name}</span><span className="block text-xs text-muted">{a.reference} · {a.neighborhood}</span></span><AptStatus s={a.status as ApartmentStatus} /></Link></li>)}</ul></Card>}
        {!!custs.data?.length && <Card><CardHeader title="Clients" /><ul className="mt-2">{custs.data.map((c) => <li key={c.id}><Link href={`/admin/clients/${c.id}`} className="block border-t border-line px-5 py-2.5 text-sm hover:bg-slate-50"><span className="font-medium">{c.full_name}</span><span className="block text-xs text-muted">{c.whatsapp || c.phone || c.email}</span></Link></li>)}</ul></Card>}
        {!!res.data?.length && <Card><CardHeader title="Réservations" /><ul className="mt-2">{(res.data as unknown as Res[]).map((r) => <li key={r.id}><Link href={`/admin/reservations/${r.id}`} className="flex items-center justify-between gap-2 border-t border-line px-5 py-2.5 text-sm hover:bg-slate-50"><span><span className="font-medium">{r.reference}</span><span className="block text-xs text-muted">{r.customer?.full_name} · {r.apartment?.name} · {dateFr(r.check_in)}</span></span><ResStatus s={r.status} /></Link></li>)}</ul></Card>}
      </div>
    </>
  );
}
