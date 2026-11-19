import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { addDays, endOfMonth, isIsoDate, startOfMonth, startOfWeek, todayIso } from "@/lib/dates";
import { CalendarBoard } from "./CalendarBoard";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ vue?: string; date?: string; appartement?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = sp.vue === "semaine" ? "week" : "month";
  const anchor = isIsoDate(sp.date) ? sp.date! : todayIso();
  const from = view === "week" ? startOfWeek(anchor) : startOfMonth(anchor);
  const to = view === "week" ? addDays(from, 7) : addDays(endOfMonth(anchor), 1); // exclusif
  const supabase = await createClient();
  let aptQ = supabase.from("apartments").select("id, name, status, reference").neq("status", "archived").order("sort_order").order("name");
  if (sp.appartement) aptQ = aptQ.eq("id", sp.appartement);
  const [{ data: apts }, { data: allApts }, { data: res }, { data: blocks }] = await Promise.all([
    aptQ,
    supabase.from("apartments").select("id, name").neq("status", "archived").order("name"),
    supabase.from("reservations").select("id, reference, apartment_id, check_in, check_out, status, guests, total_amount, customer:customers(full_name)")
      .neq("status", "cancelled").lt("check_in", to).gt("check_out", from),
    supabase.from("blocked_dates").select("id, apartment_id, start_date, end_date, reason").lt("start_date", to).gt("end_date", from),
  ]);
  return (
    <>
      <PageHeader title="Calendrier" description="Cliquez sur une date libre puis sur la date de fin pour bloquer des dates ou créer une réservation." />
      <CalendarBoard view={view} from={from} to={to} anchor={anchor} apartmentFilter={sp.appartement ?? ""}
        apartments={apts ?? []} allApartments={allApts ?? []}
        reservations={(res ?? []) as never} blocks={blocks ?? []} />
    </>
  );
}
