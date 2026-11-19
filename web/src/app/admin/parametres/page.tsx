import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkTabs } from "@/components/ui/Tabs";
import { normalizeSettings } from "@/lib/site-settings";
import { AccountPanel, BookingPanel, CompanyPanel, DataPanel, TeamPanel } from "./Panels";

const TABS = [
  { key: "entreprise", label: "Entreprise" }, { key: "reservations", label: "Réservations et notifications" },
  { key: "compte", label: "Mon compte" }, { key: "equipe", label: "Équipe et permissions" }, { key: "donnees", label: "Données et sécurité" },
];

export default async function Settings({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.onglet) ? sp.onglet! : "entreprise";
  const supabase = await createClient();
  const [{ data: app }, { data: site }, { data: team }] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", 1).single(),
    supabase.from("website_settings").select("published").eq("id", 1).single(),
    supabase.from("admin_users").select("user_id, email, full_name, role, created_at").order("created_at"),
  ]);
  return (
    <>
      <PageHeader title="Paramètres" />
      <LinkTabs active={tab} items={TABS.map((t) => ({ key: t.key, label: t.label, href: `/admin/parametres?onglet=${t.key}` }))} />
      {tab === "entreprise" && <CompanyPanel s={normalizeSettings(site?.published)} currency={app?.currency ?? "XOF"} timezone={app?.timezone ?? "Africa/Lome"} />}
      {tab === "reservations" && <BookingPanel booking={app?.booking} notifications={app?.notifications} canEdit={me.role !== "staff"} />}
      {tab === "compte" && <AccountPanel email={me.email} fullName={me.fullName ?? ""} role={me.role} />}
      {tab === "equipe" && <TeamPanel team={team ?? []} me={me.userId} isOwner={me.role === "owner"} />}
      {tab === "donnees" && <DataPanel canExport={me.role !== "staff"} />}
    </>
  );
}
