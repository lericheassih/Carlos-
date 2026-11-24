import { createClient } from "@/lib/supabase/server";
import { normalizeSettings } from "@/lib/site-settings";
import { getApartments, getReviews } from "@/lib/public-data";
import { HomeView } from "@/components/public/HomeView";
import { SiteFooter, SiteHeader } from "@/components/public/SiteChrome";
import { PreviewBanner } from "@/components/public/PreviewBanner";
import { siteStyle } from "@/components/public/theme";

export default async function PreviewSite() {
  const supabase = await createClient();
  const { data } = await supabase.from("website_settings").select("draft").eq("id", 1).maybeSingle();
  const s = normalizeSettings(data?.draft);
  const [apartments, reviews] = await Promise.all([getApartments(), getReviews()]);
  return (
    <div style={siteStyle(s)} className="site min-h-dvh bg-white text-slate-900">
      <PreviewBanner back="/admin/site" text="brouillon de personnalisation (non publié)." />
      <SiteHeader s={s} />
      <HomeView s={s} apartments={apartments} reviews={reviews} />
      <SiteFooter s={s} />
    </div>
  );
}
