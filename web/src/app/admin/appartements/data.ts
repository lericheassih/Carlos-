import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";

export async function loadEditorData(id: string | null) {
  const supabase = await createClient();
  const [{ data: amenities }, { data: settings }] = await Promise.all([
    supabase.from("amenities").select("id,name,icon,category,sort_order").order("sort_order").order("name"),
    supabase.from("app_settings").select("booking").eq("id", 1).maybeSingle(),
  ]);
  let selected: string[] = [];
  let media: { media_id: string; kind: "image" | "video"; url: string; name: string; is_cover: boolean; caption: string }[] = [];
  if (id) {
    const [{ data: am }, { data: md }] = await Promise.all([
      supabase.from("apartment_amenities").select("amenity_id").eq("apartment_id", id),
      supabase.from("apartment_media").select("is_cover, caption, position, media:media(id,kind,storage_path,name)").eq("apartment_id", id).order("position"),
    ]);
    selected = (am ?? []).map((x) => x.amenity_id as string);
    type Row = { is_cover: boolean; caption: string; media: { id: string; kind: "image" | "video"; storage_path: string; name: string } | null };
    media = ((md ?? []) as unknown as Row[]).filter((r) => r.media).map((r) => ({
      media_id: r.media!.id, kind: r.media!.kind, url: mediaUrl(r.media!.storage_path)!, name: r.media!.name, is_cover: r.is_cover, caption: r.caption,
    }));
  }
  return {
    amenities: (amenities ?? []).map(({ id, name, icon, category }) => ({ id, name, icon, category })),
    selected,
    media,
    defaultMinNights: Number((settings?.booking as { default_min_nights?: number } | null)?.default_min_nights ?? 1) || 1,
  };
}
