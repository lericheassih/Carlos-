import type { MetadataRoute } from "next";
import { getApartments } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const list = await getApartments().catch(() => []);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/appartements`, changeFrequency: "daily", priority: 0.9 },
    ...list.map((a) => ({ url: `${base}/appartements/${a.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${base}/conditions`, priority: 0.3 },
  ];
}
