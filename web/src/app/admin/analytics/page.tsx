import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { addDays, isIsoDate, todayIso } from "@/lib/dates";
import { LiveVisitors } from "./LiveVisitors";
import { Report, type ReportData } from "./Report";
import { UtmBuilder } from "./UtmBuilder";

const PERIODS = [
  { key: "today", label: "Aujourd'hui" }, { key: "yesterday", label: "Hier" }, { key: "7d", label: "7 derniers jours" },
  { key: "30d", label: "30 derniers jours" }, { key: "90d", label: "90 derniers jours" }, { key: "custom", label: "Personnalisée" },
];

export default async function Analytics({ searchParams }: { searchParams: Promise<{ periode?: string; du?: string; au?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const key = PERIODS.some((p) => p.key === sp.periode) ? sp.periode! : "7d";
  const today = todayIso();
  let from: string, to: string; // jours inclusifs (Africa/Lome = UTC+0)
  switch (key) {
    case "today": from = to = today; break;
    case "yesterday": from = to = addDays(today, -1); break;
    case "30d": from = addDays(today, -29); to = today; break;
    case "90d": from = addDays(today, -89); to = today; break;
    case "custom": from = isIsoDate(sp.du) ? sp.du! : addDays(today, -6); to = isIsoDate(sp.au) && sp.au! >= from ? sp.au! : today; break;
    default: from = addDays(today, -6); to = today;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("analytics_report", { p_from: `${from}T00:00:00Z`, p_to: `${addDays(to, 1)}T00:00:00Z` });
  if (error) throw new Error(error.message);
  const [{ data: site }] = await Promise.all([supabase.from("website_settings").select("published").eq("id", 1).maybeSingle()]);
  const { data: apts } = await supabase.from("apartments").select("slug, name, published").eq("status", "published").order("name");
  return (
    <>
      <PageHeader title="Analytics" description="Données réelles collectées sur votre site public (visiteurs anonymes, robots exclus)." />
      <LiveVisitors />
      <Report data={data as ReportData} periods={PERIODS} active={key} from={from} to={to} />
      <UtmBuilder siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} apartments={(apts ?? []).map((a) => ({ slug: (a.published as { slug?: string } | null)?.slug ?? a.slug, name: a.name }))} hasSite={!!site} />
    </>
  );
}
