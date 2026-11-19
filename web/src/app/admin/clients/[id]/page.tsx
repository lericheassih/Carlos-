import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/admin/StatCard";
import { PayStatus, ResStatus } from "@/components/admin/StatusBadges";
import { dateFr, fcfa, waLink } from "@/lib/format";
import type { PaymentStatus, ReservationStatus } from "@/lib/types";
import { CustomerForm } from "../CustomerForm";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, { data: res }] = await Promise.all([
    supabase.from("customer_stats").select("*").eq("id", id).maybeSingle(),
    supabase.from("reservations").select("id, reference, check_in, check_out, nights, total_amount, amount_paid, status, payment_status, apartment:apartments(name)").eq("customer_id", id).order("check_in", { ascending: false }),
  ]);
  if (!c) notFound();
  type R = { id: string; reference: string; check_in: string; check_out: string; nights: number; total_amount: number; amount_paid: number; status: ReservationStatus; payment_status: PaymentStatus; apartment: { name: string } | null };
  const wa = c.whatsapp || c.phone;
  return (
    <>
      <PageHeader title={c.full_name} back="/admin/clients" description={`Client depuis le ${dateFr(c.created_at)}`}
        actions={<>
          {wa && <a href={waLink(wa, `Bonjour ${c.full_name}, `)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-lg bg-[#25D366] px-3.5 text-sm font-medium text-white">WhatsApp</a>}
          <ButtonLink href={`/admin/reservations/nouvelle?client=${c.id}`} variant="primary"><Plus className="size-4" /> Nouvelle réservation</ButtonLink>
        </>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Séjours" value={c.stays} />
        <StatCard label="Réservations" value={c.reservations_count} />
        <StatCard label="Montant total dépensé" value={fcfa(c.total_spent)} />
        <StatCard label="Dernière réservation" value={<span className="text-lg">{dateFr(c.last_check_in)}</span>} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Historique des réservations" />
          <div className="mt-3 overflow-x-auto">
            {(res ?? []).length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Aucune réservation.</p> : (
              <table className="table-base">
                <thead><tr><th>Réf.</th><th>Appartement</th><th>Séjour</th><th className="text-right">Total</th><th>Statut</th></tr></thead>
                <tbody>
                  {((res ?? []) as unknown as R[]).map((r) => (
                    <tr key={r.id}>
                      <td><Link className="font-medium hover:underline" href={`/admin/reservations/${r.id}`}>{r.reference}</Link></td>
                      <td>{r.apartment?.name}</td>
                      <td className="whitespace-nowrap">{dateFr(r.check_in, { day: "numeric", month: "short" })} → {dateFr(r.check_out)}</td>
                      <td className="text-right tabular-nums">{fcfa(r.total_amount)}<div><PayStatus s={r.payment_status} /></div></td>
                      <td><ResStatus s={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Coordonnées" />
          <CardBody><CustomerForm id={c.id} canDelete={admin.role !== "staff"} initial={{ full_name: c.full_name, phone: c.phone ?? "", whatsapp: c.whatsapp ?? "", email: c.email ?? "", country: c.country ?? "", notes: c.notes ?? "" }} /></CardBody>
        </Card>
      </div>
    </>
  );
}
