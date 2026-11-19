"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";
import { revalidatePublic } from "@/lib/revalidate";

const url = z.string().trim().max(500).refine((v) => !v || /^https?:\/\//.test(v), "Lien invalide (doit commencer par https://).");
const S = z.object({
  company_name: z.string().trim().min(2, "Nom de l'entreprise requis.").max(80),
  tagline: z.string().max(80),
  logo_url: url.nullable(),
  phone: z.string().max(30), whatsapp: z.string().max(30), email: z.string().max(120), address: z.string().max(200),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide."), accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide."),
  hero_title: z.string().trim().min(2).max(140), hero_subtitle: z.string().max(400), hero_images: z.array(url).max(10),
  about_title: z.string().max(120), about_text: z.string().max(2000),
  services: z.array(z.object({ title: z.string().trim().min(1).max(80), text: z.string().max(300) })).max(9),
  advantages: z.array(z.string().trim().min(1).max(120)).max(12),
  booking_conditions: z.string().max(6000), cancellation_policy: z.string().max(4000), contact_text: z.string().max(400),
  social: z.object({ facebook: url, instagram: url, tiktok: url }),
  seo_title: z.string().max(90), seo_description: z.string().max(200),
  consent_mode: z.enum(["notice", "opt_in"]),
});

export async function saveSiteDraft(raw: unknown): Promise<ActionResult> {
  await requireManager();
  const p = S.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const data = { ...p.data, whatsapp: p.data.whatsapp.replace(/[^0-9]/g, "") };
  const supabase = await createClient();
  const { error } = await supabase.from("website_settings").update({ draft: data }).eq("id", 1);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/site");
  return { ok: true, message: "Brouillon enregistré. Publiez pour mettre le site à jour." };
}

export async function publishSite(): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { data } = await supabase.from("website_settings").select("draft").eq("id", 1).single();
  const p = S.safeParse(data?.draft);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const { error } = await supabase.from("website_settings").update({ published: p.data, published_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePublic();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Site publié : les visiteurs voient la nouvelle version." };
}
