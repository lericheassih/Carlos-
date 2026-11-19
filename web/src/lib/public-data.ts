import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { normalizeSettings, type SiteSettings } from "@/lib/site-settings";
import type { ApartmentSnapshot } from "@/lib/types";

export type PublicApartment = ApartmentSnapshot & { featured: boolean; sort_order: number; avg_rating: number | null; review_count: number };
export type PublicReview = { id: string; apartment_id: string | null; author_name: string; author_country: string | null; rating: number; comment: string; stay_date: string | null; created_at: string };

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const { data } = await createPublicClient().from("public_site").select("settings").maybeSingle();
  return normalizeSettings(data?.settings);
});

type Row = { id: string; slug: string; published: ApartmentSnapshot; featured: boolean; sort_order: number; avg_rating: number | null; review_count: number };
const toPublic = (r: Row): PublicApartment => ({ ...r.published, slug: r.slug, featured: r.featured, sort_order: r.sort_order, avg_rating: r.avg_rating, review_count: r.review_count });

export const getApartments = cache(async (): Promise<PublicApartment[]> => {
  const { data, error } = await createPublicClient().from("public_apartments").select("*")
    .order("featured", { ascending: false }).order("sort_order").order("published_at", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toPublic);
});

export const getApartment = cache(async (slug: string): Promise<PublicApartment | null> => {
  const { data } = await createPublicClient().from("public_apartments").select("*").eq("slug", slug).maybeSingle();
  return data ? toPublic(data as Row) : null;
});

export const getReviews = cache(async (apartmentId?: string): Promise<PublicReview[]> => {
  let q = createPublicClient().from("public_reviews").select("*").order("created_at", { ascending: false }).limit(apartmentId ? 30 : 9);
  if (apartmentId) q = q.eq("apartment_id", apartmentId);
  const { data } = await q;
  return (data ?? []) as PublicReview[];
});

export async function getAvailableIds(checkIn: string, checkOut: string): Promise<Set<string>> {
  const { data } = await createPublicClient().rpc("available_apartment_ids", { p_in: checkIn, p_out: checkOut });
  return new Set(((data ?? []) as string[]).map(String));
}
