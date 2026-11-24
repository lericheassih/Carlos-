"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";

const C = z.object({
  full_name: z.string().trim().min(2, "Nom requis.").max(160),
  phone: z.string().trim().max(30), whatsapp: z.string().trim().max(30),
  email: z.string().trim().max(160).refine((v) => !v || z.string().email().safeParse(v).success, "E-mail invalide."),
  country: z.string().trim().max(60), notes: z.string().max(4000),
});

export async function saveCustomer(id: string | null, raw: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const p = C.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const norm = (s: string) => s.replace(/[^0-9+]/g, "") || null;
  const row = { ...p.data, phone: norm(p.data.phone), whatsapp: norm(p.data.whatsapp), email: p.data.email || null, country: p.data.country || null };
  const supabase = await createClient();
  const q = id ? supabase.from("customers").update(row).eq("id", id).select("id").single() : supabase.from("customers").insert(row).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/clients");
  return { ok: true, data: { id: data.id }, message: "Client enregistré." };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { ok: false, error: error.code === "23503" ? "Ce client a des réservations : impossible de le supprimer." : pgError(error) };
  revalidatePath("/admin/clients");
  return { ok: true, message: "Client supprimé." };
}
