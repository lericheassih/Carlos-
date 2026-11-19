import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { getAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/connexion?erreur=acces");
  const supabase = await createClient();
  // Passage automatique des statuts (Confirmée → En cours → Terminée) selon la date du jour
  await supabase.rpc("refresh_reservation_statuses");
  const [{ count: pending }, { count: unread }, { data: site }] = await Promise.all([
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("website_settings").select("published").eq("id", 1).maybeSingle(),
  ]);
  const settings = normalizeSettings(site?.published);
  return (
    <Shell user={{ email: admin.email, fullName: admin.fullName, role: admin.role }} companyName={settings.company_name}
      pending={pending ?? 0} unread={unread ?? 0} signOut={signOut}>
      {children}
    </Shell>
  );
}
