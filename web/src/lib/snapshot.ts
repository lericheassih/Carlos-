import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApartmentRow, ApartmentSnapshot } from "./types";
import { pricingFromRow } from "./pricing";
import { mediaUrl } from "./media";

/** Construit l'instantané public d'un appartement à partir de ses données de travail. */
export async function buildSnapshot(supabase: SupabaseClient, id: string): Promise<{ row: ApartmentRow; snapshot: ApartmentSnapshot } | null> {
  const [{ data: row }, { data: am }, { data: md }] = await Promise.all([
    supabase.from("apartments").select("*").eq("id", id).maybeSingle(),
    supabase.from("apartment_amenities").select("included, amenity:amenities(id,name,icon,category,description,sort_order)").eq("apartment_id", id),
    supabase
      .from("apartment_media")
      .select("position,is_cover,caption,room,media:media(id,kind,storage_path,alt,width,height,name)")
      .eq("apartment_id", id)
      .order("position"),
  ]);
  if (!row) return null;
  const a = row as ApartmentRow;

  type AmJoin = { included: boolean; amenity: { id: string; name: string; icon: string; category: string; description: string; sort_order: number } | null };
  type MdJoin = {
    position: number; is_cover: boolean; caption: string; room: string;
    media: { id: string; kind: "image" | "video"; storage_path: string; alt: string; width: number | null; height: number | null; name: string } | null;
  };
  const amenities = ((am ?? []) as unknown as AmJoin[])
    .filter((x) => x.amenity)
    .map((x) => ({ ...x.amenity!, included: x.included !== false }))
    .sort((x, y) => x.sort_order - y.sort_order || x.name.localeCompare(y.name))
    .map(({ id, name, icon, category, description, included }) => ({ id, name, icon, category, description, included }));

  let media = ((md ?? []) as unknown as MdJoin[])
    .filter((x) => x.media)
    .map((x) => ({
      id: x.media!.id,
      kind: x.media!.kind,
      url: mediaUrl(x.media!.storage_path)!,
      alt: x.caption || x.media!.alt || a.name,
      width: x.media!.width,
      height: x.media!.height,
      is_cover: x.is_cover,
      room: x.room || "",
    }));
  // La photo principale passe en tête
  media = [...media.filter((m) => m.is_cover), ...media.filter((m) => !m.is_cover)];
  const cover = media.find((m) => m.kind === "image");

  const snapshot: ApartmentSnapshot = {
    id: a.id,
    slug: a.slug,
    reference: a.reference,
    name: a.name,
    short_description: a.short_description,
    description: a.description,
    city: a.city,
    neighborhood: a.neighborhood,
    property_type: a.property_type,
    bedrooms: a.bedrooms,
    living_rooms: a.living_rooms,
    bathrooms: a.bathrooms,
    max_guests: a.max_guests,
    latitude: a.latitude === null ? null : Number(a.latitude),
    longitude: a.longitude === null ? null : Number(a.longitude),
    pricing: pricingFromRow(a),
    booking_conditions: a.booking_conditions,
    house_rules: a.house_rules,
    check_in_time: a.check_in_time,
    check_out_time: a.check_out_time,
    amenities,
    media,
    cover_url: cover?.url ?? null,
  };
  return { row: a, snapshot };
}
