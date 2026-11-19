import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReservationForm } from "../ReservationForm";
import { addDays, isIsoDate, todayIso } from "@/lib/dates";

export default async function NewReservation({ searchParams }: { searchParams: Promise<{ appartement?: string; arrivee?: string; depart?: string; client?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: apts }, { data: cust }] = await Promise.all([
    supabase.from("apartments").select("id, name, status").neq("status", "archived").order("name"),
    sp.client ? supabase.from("customers").select("id, full_name, phone, whatsapp, email").eq("id", sp.client).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const ci = isIsoDate(sp.arrivee) ? sp.arrivee! : todayIso();
  const co = isIsoDate(sp.depart) && sp.depart! > ci ? sp.depart! : addDays(ci, 2);
  return (
    <>
      <PageHeader title="Nouvelle réservation" back="/admin/reservations" />
      <ReservationForm apartments={apts ?? []} initial={{
        id: null, customer: cust ?? null, apartment_id: sp.appartement ?? "", check_in: ci, check_out: co, guests: 2,
        price_per_night: 0, extra_fees: 0, discount: 0, total_amount: 0, payment_method: null, status: "confirmed", source: "admin", notes: "",
      }} />
    </>
  );
}
