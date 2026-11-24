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

/** Autres logements à proposer sous une fiche : même quartier, capacité suffisante et prix proche d'abord.
 *  Si des dates sont choisies, seuls les logements libres à ces dates sont gardés. */
export async function getOtherApartments(current: { id: string; neighborhood: string | null; max_guests: number; pricing: { night: number } },
  opts: { checkIn?: string; checkOut?: string; guests?: number } = {}, limit = 8): Promise<{ list: PublicApartment[]; datesFiltered: boolean }> {
  let list = (await getApartments()).filter((x) => x.id !== current.id);
  const datesFiltered = Boolean(opts.checkIn && opts.checkOut && opts.checkIn < opts.checkOut);
  if (datesFiltered) {
    const ok = await getAvailableIds(opts.checkIn!, opts.checkOut!);
    list = list.filter((x) => ok.has(x.id));
  }
  const want = opts.guests && opts.guests > 0 ? opts.guests : current.max_guests;
  const ref = current.pricing.night || 1;
  const score = (x: PublicApartment) =>
    (x.neighborhood && x.neighborhood === current.neighborhood ? 3 : 0) +
    (x.max_guests >= want ? 2 : 0) +
    (x.featured ? 0.5 : 0) -
    Math.min(2, Math.abs((x.pricing.night || 0) - ref) / ref);
  return { list: list.map((x) => ({ x, s: score(x) })).sort((p, q) => q.s - p.s).slice(0, limit).map((o) => o.x), datesFiltered };
}
