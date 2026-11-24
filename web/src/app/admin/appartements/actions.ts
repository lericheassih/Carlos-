"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireManager } from "@/lib/auth";
import { buildSnapshot } from "@/lib/snapshot";
import { revalidatePublic } from "@/lib/revalidate";
import { slugify } from "@/lib/format";
import { pgError, type ActionResult } from "@/lib/action-result";
import { ApartmentInput } from "./schema";
import type { ApartmentStatus } from "@/lib/types";

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, wanted: string, selfId: string | null) {
  const base = slugify(wanted);
  let candidate = base;
  for (let i = 2; i < 200; i++) {
    const { data } = await supabase.from("apartments").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === selfId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Enregistre les données de travail (brouillon). Le site public n'est PAS modifié. */
export async function saveApartment(id: string | null, raw: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = ApartmentInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { amenity_ids, excluded_amenity_ids, media, slug, ...fields } = parsed.data;
  const supabase = await createClient();

  const finalSlug = await uniqueSlug(supabase, slug || fields.name, id);
  const row = { ...fields, slug: finalSlug, updated_at: new Date().toISOString() };

  let aptId = id;
  if (aptId) {
    const { error } = await supabase.from("apartments").update(row).eq("id", aptId);
    if (error) return { ok: false, error: pgError(error) };
  } else {
    const { data, error } = await supabase.from("apartments").insert({ ...row, status: "draft" }).select("id").single();
    if (error) return { ok: false, error: pgError(error) };
    aptId = data.id as string;
  }

  // Équipements
  const { error: e1 } = await supabase.from("apartment_amenities").delete().eq("apartment_id", aptId);
  if (e1) return { ok: false, error: pgError(e1) };
  const inc = [...new Set(amenity_ids)];
  const exc = [...new Set(excluded_amenity_ids)].filter((x) => !inc.includes(x));
  if (inc.length || exc.length) {
    const { error } = await supabase.from("apartment_amenities").insert([
      ...inc.map((amenity_id) => ({ apartment_id: aptId, amenity_id, included: true })),
      ...exc.map((amenity_id) => ({ apartment_id: aptId, amenity_id, included: false })),
    ]);
    if (error) return { ok: false, error: pgError(error) };
  }

  // Médias (ordre + photo principale)
  const { error: e2 } = await supabase.from("apartment_media").delete().eq("apartment_id", aptId);
  if (e2) return { ok: false, error: pgError(e2) };
  const seen = new Set<string>();
  const list = media.filter((m) => !seen.has(m.media_id) && seen.add(m.media_id));
  let coverSet = false;
  const rows = list.map((m, i) => {
    const cover = m.is_cover && !coverSet;
    if (cover) coverSet = true;
    return { apartment_id: aptId, media_id: m.media_id, position: i, is_cover: cover, caption: m.caption, room: m.room };
  });
  if (rows.length && !coverSet) rows[0]!.is_cover = true;
  if (rows.length) {
    const { error } = await supabase.from("apartment_media").insert(rows);
    if (error) return { ok: false, error: pgError(error) };
  }

  revalidatePath("/admin/appartements");
  return { ok: true, data: { id: aptId!, slug: finalSlug }, message: "Modifications enregistrées." };
}

/** Publie : l'instantané des données enregistrées devient la version affichée sur le site public. */
export async function publishApartment(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const built = await buildSnapshot(supabase, id);
  if (!built) return { ok: false, error: "Appartement introuvable." };
  if (built.row.price_night <= 0) return { ok: false, error: "Indiquez un prix par nuit avant de publier." };
  const oldSlug = built.row.published?.slug;
  const now = new Date().toISOString();
  const { error } = await supabase.from("apartments")
    .update({ published: built.snapshot, published_at: now, status: "published", updated_at: now }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePublic([built.row.slug, oldSlug]);
  revalidatePath(`/admin/appartements/${id}`);
  return { ok: true, message: "Publié ! Le site public est à jour." };
}

export async function setApartmentStatus(id: string, status: ApartmentStatus): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: apt } = await supabase.from("apartments").select("slug, published").eq("id", id).maybeSingle();
  if (!apt) return { ok: false, error: "Appartement introuvable." };
  if (status === "published") return publishApartment(id);
  const { error } = await supabase.from("apartments").update({ status }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePublic([apt.slug, (apt.published as { slug?: string } | null)?.slug]);
  revalidatePath("/admin/appartements");
  const msg = { hidden: "Appartement masqué : il n'apparaît plus sur le site.", archived: "Appartement archivé.", draft: "Repassé en brouillon : retiré du site." }[status];
  return { ok: true, message: msg };
}

export async function duplicateApartment(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: src } = await supabase.from("apartments").select("*").eq("id", id).maybeSingle();
  if (!src) return { ok: false, error: "Appartement introuvable." };
  const { id: _i, reference: _r, published: _p, published_at: _pa, created_at: _c, updated_at: _u, status: _s, slug, name, ...rest } = src;
  void _i; void _r; void _p; void _pa; void _c; void _u; void _s;
  const newSlug = await uniqueSlug(supabase, `${slug}-copie`, null);
  const { data: created, error } = await supabase.from("apartments")
    .insert({ ...rest, name: `${name} (copie)`, slug: newSlug, status: "draft", featured: false }).select("id").single();
  if (error) return { ok: false, error: pgError(error) };
  const [{ data: am }, { data: md }] = await Promise.all([
    supabase.from("apartment_amenities").select("amenity_id, included").eq("apartment_id", id),
    supabase.from("apartment_media").select("media_id, position, is_cover, caption, room").eq("apartment_id", id),
  ]);
  if (am?.length) await supabase.from("apartment_amenities").insert(am.map((a) => ({ ...a, apartment_id: created.id })));
  if (md?.length) await supabase.from("apartment_media").insert(md.map((m) => ({ ...m, apartment_id: created.id })));
  revalidatePath("/admin/appartements");
  return { ok: true, data: { id: created.id }, message: "Copie créée en brouillon." };
}

export async function deleteApartment(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { count } = await supabase.from("reservations").select("id", { count: "exact", head: true }).eq("apartment_id", id);
  if (count) return { ok: false, error: `Impossible de supprimer : ${count} réservation(s) sont liées à cet appartement. Archivez-le à la place pour conserver l'historique.` };
  const { data: apt } = await supabase.from("apartments").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("apartments").delete().eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePublic([apt?.slug]);
  revalidatePath("/admin/appartements");
  return { ok: true, message: "Appartement supprimé." };
}

export async function createAmenity(name: string, category = "Autres"): Promise<ActionResult<{ id: string; name: string; icon: string; category: string }>> {
  await requireAdmin();
  const n = name.trim();
  if (n.length < 2 || n.length > 60) return { ok: false, error: "Nom d'équipement invalide." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("amenities").select("id,name,icon,category").ilike("name", n).maybeSingle();
  if (existing) return { ok: true, data: existing };
  const { data, error } = await supabase.from("amenities").insert({ name: n, category, is_custom: true, icon: "check" }).select("id,name,icon,category").single();
  if (error) return { ok: false, error: pgError(error) };
  return { ok: true, data };
}

/** Modification rapide des prix (page Tarifs). */
export async function quickUpdatePricing(id: string, p: { price_night: number; price_week: number | null; price_month: number | null; promo_price_night: number | null; min_nights: number }, publish: boolean): Promise<ActionResult> {
  await requireAdmin();
  const clean = (v: number | null) => (v === null || Number.isNaN(v) ? null : Math.max(0, Math.round(v)));
  if (!(p.price_night > 0)) return { ok: false, error: "Le prix par nuit doit être supérieur à 0." };
  if (p.promo_price_night !== null && p.promo_price_night >= p.price_night) return { ok: false, error: "Le tarif promo doit être inférieur au prix par nuit." };
  const supabase = await createClient();
  const { error } = await supabase.from("apartments").update({
    price_night: Math.round(p.price_night), price_week: clean(p.price_week), price_month: clean(p.price_month),
    promo_price_night: clean(p.promo_price_night), min_nights: Math.max(1, Math.round(p.min_nights || 1)),
  }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  if (publish) {
    const { data } = await supabase.from("apartments").select("status").eq("id", id).single();
    if (data?.status === "published") return publishApartment(id);
  }
  revalidatePath("/admin/tarifs");
  return { ok: true, message: "Tarifs enregistrés." };
}
