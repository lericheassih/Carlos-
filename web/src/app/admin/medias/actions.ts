"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";
import { MEDIA_BUCKET, mediaUrl } from "@/lib/media";

export async function renameMedia(id: string, name: string, alt: string): Promise<ActionResult> {
  await requireAdmin();
  const n = name.trim();
  if (n.length < 1 || n.length > 120) return { ok: false, error: "Nom invalide." };
  const supabase = await createClient();
  const { error } = await supabase.from("media").update({ name: n, alt: alt.trim().slice(0, 200) }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/medias");
  return { ok: true, message: "Média renommé." };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { data: m } = await supabase.from("media").select("id, storage_path").eq("id", id).maybeSingle();
  if (!m) return { ok: false, error: "Média introuvable." };
  const url = mediaUrl(m.storage_path)!;
  const [{ data: links }, { data: pub }, { data: site }] = await Promise.all([
    supabase.from("apartment_media").select("apartment:apartments(name)").eq("media_id", id),
    supabase.from("apartments").select("name").contains("published", { media: [{ id }] }),
    supabase.from("website_settings").select("draft, published").eq("id", 1).maybeSingle(),
  ]);
  const names = new Set<string>();
  (links ?? []).forEach((l) => { const a = (l as unknown as { apartment: { name: string } | null }).apartment; if (a) names.add(a.name); });
  (pub ?? []).forEach((p) => names.add(p.name));
  if (names.size) return { ok: false, error: `Ce média est utilisé par : ${[...names].join(", ")}. Retirez-le de ces fiches (et republiez-les) avant de le supprimer.` };
  if (JSON.stringify(site ?? {}).includes(url)) return { ok: false, error: "Ce média est utilisé dans la personnalisation du site (logo ou image de couverture)." };
  const { error: se } = await supabase.storage.from(MEDIA_BUCKET).remove([m.storage_path]);
  if (se) return { ok: false, error: "Suppression du fichier impossible : " + se.message };
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/medias");
  return { ok: true, message: "Média supprimé." };
}
