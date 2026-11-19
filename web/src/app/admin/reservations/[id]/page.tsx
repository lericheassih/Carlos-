import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PayStatus, ResStatus } from "@/components/admin/StatusBadges";
import { dateFr, dateTimeFr, fcfa, waLink } from "@/lib/format";
import { SOURCE_LABELS, type PaymentStatus, type ReservationStatus } from "@/lib/types";
import { ReservationForm } from "../ReservationForm";
import { Payments, StatusActions } from "./ReservationActions";

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: r }, { data: apts }, { data: payments }] = await Promise.all([
    supabase.from("reservations").select("*, customer:customers(id, full_name, phone, whatsapp, email), apartment:apartments(id, name)").eq("id", id).maybeSingle(),
    supabase.from("apartments").select("id, name, status").order("name"),
    supabase.from("payments").select("id, amount, method, paid_at, note").eq("reservation_id", id).order("paid_at"),
  ]);
  if (!r) notFound();
  const wa = r.customer?.whatsapp || r.customer?.phone;
  const msg = `Bonjour ${r.customer?.full_name}, concernant votre réservation ${r.reference} (${r.apartment?.name}) du ${dateFr(r.check_in)} au ${dateFr(r.check_out)} : `;
  return (
    <>
      <PageHeader title={`Réservation ${r.reference}`} back="/admin/reservations"
        badge={<><ResStatus s={r.status as ReservationStatus} /><PayStatus s={r.payment_status as PaymentStatus} /></>}
        description={`${r.customer?.full_name} · ${r.apartment?.name} · ${dateFr(r.check_in)} → ${dateFr(r.check_out)} (${r.nights} nuits)`}
        actions={<StatusActions id={id} status={r.status as ReservationStatus} canDelete={admin.role !== "staff"} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ReservationForm apartments={apts ?? []} initial={{
          id, customer: r.customer, apartment_id: r.apartment_id, check_in: r.check_in, check_out: r.check_out, guests: r.guests,
          price_per_night: r.price_per_night, extra_fees: r.extra_fees, discount: r.discount, total_amount: r.total_amount,
          payment_method: r.payment_method, status: r.status, source: r.source, notes: r.notes,
        }} />
        <div className="space-y-4">
          <Card>
            <CardHeader title="Paiements" />
            <CardBody><Payments reservationId={id} payments={payments ?? []} total={r.total_amount} paid={r.amount_paid} defaultMethod={r.payment_method} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Contacter le client" />
            <CardBody className="space-y-2 text-sm">
              {wa && <a className="block font-medium text-emerald-700 hover:underline" href={waLink(wa, msg)} target="_blank" rel="noreferrer">WhatsApp : {r.customer?.whatsapp || r.customer?.phone}</a>}
              {r.customer?.phone && <a className="block hover:underline" href={`tel:${r.customer.phone}`}>Appeler : {r.customer.phone}</a>}
              {r.customer?.email && <a className="block hover:underline" href={`mailto:${r.customer.email}`}>{r.customer.email}</a>}
              <Link href={`/admin/clients/${r.customer_id}`} className="block text-brand-600 hover:underline">Fiche client →</Link>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Historique" />
            <CardBody>
              <ol className="space-y-2 border-l border-line pl-4 text-[13px]">
                <li><span className="text-muted">{dateTimeFr(r.created_at)}</span> — Créée ({SOURCE_LABELS[r.source]})</li>
                {r.confirmed_at && <li><span className="text-muted">{dateTimeFr(r.confirmed_at)}</span> — Confirmée</li>}
                {(payments ?? []).map((p) => <li key={p.id}><span className="text-muted">{dateFr(p.paid_at)}</span> — Paiement {fcfa(p.amount)}</li>)}
                {r.cancelled_at && <li><span className="text-muted">{dateTimeFr(r.cancelled_at)}</span> — Annulée</li>}
                <li><span className="text-muted">{dateTimeFr(r.updated_at)}</span> — Dernière modification</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
