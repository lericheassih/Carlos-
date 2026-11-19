import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";
import { SiteFooter, SiteHeader, WhatsAppFab } from "@/components/public/SiteChrome";
import { Tracker } from "@/components/public/Tracker";
import { siteStyle } from "@/components/public/theme";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.seo_title || s.company_name, template: `%s · ${s.company_name}` },
    description: s.seo_description || s.hero_subtitle,
    openGraph: { siteName: s.company_name, locale: "fr_FR", type: "website", images: s.hero_images[0] ? [s.hero_images[0]] : undefined },
    icons: s.logo_url ? { icon: s.logo_url } : undefined,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div style={siteStyle(s)} className="site min-h-dvh bg-white text-slate-900">
      <SiteHeader s={s} />
      <main>{children}</main>
      <SiteFooter s={s} />
      <WhatsAppFab s={s} />
      <Tracker consentMode={s.consent_mode} />
    </div>
  );
}
