import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkTabs } from "@/components/ui/Tabs";
import { mediaUrl } from "@/lib/media";
import { MediaLibrary } from "./MediaLibrary";

export default async function Medias({ searchParams }: { searchParams: Promise<{ type?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const type = sp.type === "image" || sp.type === "video" ? sp.type : "all";
  const supabase = await createClient();
  let q = supabase.from("media").select("*, apartment_media(apartment:apartments(id,name))").order("created_at", { ascending: false }).limit(500);
  if (type !== "all") q = q.eq("kind", type);
  if (sp.q) q = q.ilike("name", `%${sp.q.replace(/[%,()]/g, "")}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  type Row = { id: string; kind: "image" | "video"; storage_path: string; name: string; alt: string; size_bytes: number; width: number | null; height: number | null; created_at: string; apartment_media: { apartment: { id: string; name: string } | null }[] };
  const items = ((data ?? []) as unknown as Row[]).map((m) => ({
    id: m.id, kind: m.kind, url: mediaUrl(m.storage_path)!, name: m.name, alt: m.alt, size: m.size_bytes, width: m.width, height: m.height, created_at: m.created_at,
    used: m.apartment_media.map((x) => x.apartment).filter(Boolean) as { id: string; name: string }[],
  }));
  const total = items.reduce((s, m) => s + m.size, 0);
  return (
    <>
      <PageHeader title="Galerie média" description={`${items.length} fichier(s) · ${(total / 1024 / 1024).toFixed(1)} Mo stockés dans le cloud`} />
      <LinkTabs active={type} items={[{ key: "all", label: "Tous", href: "/admin/medias" }, { key: "image", label: "Photos", href: "/admin/medias?type=image" }, { key: "video", label: "Vidéos", href: "/admin/medias?type=video" }]} />
      <MediaLibrary items={items} />
    </>
  );
}
