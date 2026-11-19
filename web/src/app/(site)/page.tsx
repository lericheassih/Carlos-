import { getApartments, getReviews, getSettings } from "@/lib/public-data";
import { HomeView } from "@/components/public/HomeView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [s, apartments, reviews] = await Promise.all([getSettings(), getApartments(), getReviews()]);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "LodgingBusiness", name: s.company_name, description: s.seo_description || s.hero_subtitle,
    telephone: s.phone || undefined, email: s.email || undefined, address: s.address ? { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "TG" } : undefined,
    url: process.env.NEXT_PUBLIC_SITE_URL, image: s.hero_images[0] ?? s.logo_url ?? undefined, currenciesAccepted: "XOF",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomeView s={s} apartments={apartments} reviews={reviews} />
    </>
  );
}
