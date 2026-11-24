"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";
import { revalidatePublic } from "@/lib/revalidate";

const R = z.object({
  apartment_id: z.string().uuid().nullable(),
  reservation_id: z.string().uuid().nullable(),
  author_name: z.string().trim().min(2, "Nom de l'auteur requis.").max(120),
  author_country: z.string().trim().max(60).nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(3000),
  stay_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  is_published: z.boolean(),
});

export async function saveReview(id: string | null, raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const p = R.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("reviews").update(p.data).eq("id", id) : await supabase.from("reviews").insert(p.data);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/avis");
  revalidatePublic(await slugOf(p.data.apartment_id));
  return { ok: true, message: p.data.is_published ? "Avis enregistré et publié." : "Avis enregistré (masqué)." };
}

async function slugOf(aptId: string | null) {
  if (!aptId) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("apartments").select("slug").eq("id", aptId).maybeSingle();
  return [data?.slug];
}

export async function toggleReview(id: string, publish: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").update({ is_published: publish }).eq("id", id).select("apartment_id").single();
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/avis");
  revalidatePublic(await slugOf(data.apartment_id));
  return { ok: true, message: publish ? "Avis publié sur le site." : "Avis masqué." };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/avis");
  revalidatePublic();
  return { ok: true, message: "Avis supprimé." };
}
