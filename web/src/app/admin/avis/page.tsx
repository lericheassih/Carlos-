import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkTabs } from "@/components/ui/Tabs";
import { ReviewsManager } from "./ReviewsManager";

export default async function Avis({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const f = sp.filtre === "publies" || sp.filtre === "masques" ? sp.filtre : "tous";
  const supabase = await createClient();
  let q = supabase.from("reviews").select("*, apartment:apartments(name)").order("created_at", { ascending: false });
  if (f === "publies") q = q.eq("is_published", true);
  if (f === "masques") q = q.eq("is_published", false);
  const [{ data }, { data: apts }, { data: res }] = await Promise.all([
    q,
    supabase.from("apartments").select("id, name").neq("status", "archived").order("name"),
    supabase.from("reservations").select("id, reference, apartment_id, check_in, customer:customers(full_name, country)").in("status", ["completed", "in_progress"]).order("check_out", { ascending: false }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Avis clients" description="Les avis n'apparaissent sur le site qu'une fois publiés. N'ajoutez que des avis réellement laissés par vos clients." />
      <LinkTabs active={f} items={[{ key: "tous", label: "Tous", href: "/admin/avis" }, { key: "publies", label: "Publiés", href: "/admin/avis?filtre=publies" }, { key: "masques", label: "En attente / masqués", href: "/admin/avis?filtre=masques" }]} />
      <ReviewsManager reviews={(data ?? []) as never} apartments={apts ?? []} reservations={(res ?? []) as never} />
    </>
  );
}
