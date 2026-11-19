import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSnapshot } from "@/lib/snapshot";
import { normalizeSettings } from "@/lib/site-settings";
import { ApartmentView } from "@/components/public/ApartmentView";
import { SiteFooter, SiteHeader } from "@/components/public/SiteChrome";
import { PreviewBanner } from "@/components/public/PreviewBanner";
import { siteStyle } from "@/components/public/theme";

export default async function PreviewApartment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const built = await buildSnapshot(supabase, id);
  if (!built) notFound();
  const { data: ws } = await supabase.from("website_settings").select("published").eq("id", 1).maybeSingle();
  const s = normalizeSettings(ws?.published);
  return (
    <div style={siteStyle(s)} className="site min-h-dvh bg-white text-slate-900">
      <PreviewBanner back={`/admin/appartements/${id}`} text="version enregistrée, pas encore forcément publiée. Les visiteurs ne voient pas cette page." />
      <SiteHeader s={s} />
      <ApartmentView a={built.snapshot} s={s} reviews={[]} preview />
      <SiteFooter s={s} />
    </div>
  );
}
