import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApartment, getReviews, getSettings } from "@/lib/public-data";
import { ApartmentView } from "@/components/public/ApartmentView";
import { fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getApartment(slug);
  if (!a) return { title: "Appartement introuvable" };
  const desc = a.short_description || `${a.name} à ${a.neighborhood}, ${a.city} — à partir de ${fcfa(a.pricing.night)} la nuit.`;
  return {
    title: a.name,
    description: desc.slice(0, 160),
    alternates: { canonical: `/appartements/${a.slug}` },
    openGraph: { title: a.name, description: desc.slice(0, 200), images: a.cover_url ? [{ url: a.cover_url }] : undefined },
  };
}

export default async function ApartmentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ arrivee?: string; depart?: string; voyageurs?: string }> }) {
  const { slug } = await params;
  const [a, s] = await Promise.all([getApartment(slug), getSettings()]);
  if (!a) notFound();
  const reviews = await getReviews(a.id);
  const sp = await searchParams;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: a.name,
    description: a.short_description || a.description.slice(0, 300),
    image: a.media.filter((m) => m.kind === "image").slice(0, 6).map((m) => m.url),
    numberOfRooms: a.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: a.max_guests },
    address: { "@type": "PostalAddress", addressLocality: a.city, addressRegion: a.neighborhood, addressCountry: "TG" },
    amenityFeature: a.amenities.map((x) => ({ "@type": "LocationFeatureSpecification", name: x.name, value: true })),
    ...(a.review_count && a.avg_rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: a.avg_rating, reviewCount: a.review_count } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ApartmentView a={a} s={s} reviews={reviews} initial={sp} />
    </>
  );
}
