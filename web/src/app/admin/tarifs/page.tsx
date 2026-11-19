import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { todayIso } from "@/lib/dates";
import { PricingTable, BlocksManager } from "./PricingClient";

export default async function Tarifs() {
  await requireAdmin();
  const supabase = await createClient();
  const today = todayIso();
  const [{ data: apts }, { data: blocks }] = await Promise.all([
    supabase.from("apartments").select("id, name, status, price_night, price_week, price_month, promo_price_night, min_nights, published").neq("status", "archived").order("name"),
    supabase.from("blocked_dates").select("id, apartment_id, start_date, end_date, reason").gte("end_date", today).order("start_date"),
  ]);
  return (
    <>
      <PageHeader title="Tarifs et disponibilités" description="Modifiez les prix de tous vos appartements au même endroit, et gérez les périodes bloquées." />
      <PricingTable rows={(apts ?? []).map((a) => ({ ...a, published_price: (a.published as { pricing?: { night?: number } } | null)?.pricing?.night ?? null }))} />
      <div className="mt-6"><BlocksManager apartments={(apts ?? []).map((a) => ({ id: a.id, name: a.name }))} blocks={blocks ?? []} /></div>
    </>
  );
}
