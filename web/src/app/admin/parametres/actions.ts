"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdmin, requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";

const Booking = z.object({
  default_min_nights: z.coerce.number().int().min(1).max(365),
  deposit_percent: z.coerce.number().int().min(0).max(100),
  accept_website_requests: z.boolean(),
});
const Notif = z.object({ new_request: z.boolean(), notify_email: z.string().trim().max(160).refine((v) => !v || z.string().email().safeParse(v).success, "E-mail invalide.") });

export async function saveAppSettings(raw: { booking: unknown; notifications: unknown }): Promise<ActionResult> {
  await requireManager();
  const b = Booking.safeParse(raw.booking), n = Notif.safeParse(raw.notifications);
  if (!b.success) return { ok: false, error: b.error.issues[0]!.message };
  if (!n.success) return { ok: false, error: n.error.issues[0]!.message };
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update({ booking: b.data, notifications: n.data }).eq("id", 1);
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Paramètres enregistrés." };
}

export async function updateProfile(fullName: string): Promise<ActionResult> {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { error } = await createServiceClient().from("admin_users").update({ full_name: fullName.trim().slice(0, 120) || null }).eq("user_id", me.userId);
  if (error) return { ok: false, error: pgError(error) };
  await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (next.length < 10) return { ok: false, error: "Le nouveau mot de passe doit contenir au moins 10 caractères." };
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return { ok: false, error: "Utilisez au moins une lettre et un chiffre." };
  const supabase = await createClient();
  const { error: e1 } = await supabase.auth.signInWithPassword({ email: me.email, password: current });
  if (e1) return { ok: false, error: "Mot de passe actuel incorrect." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Mot de passe modifié." };
}

async function requireOwner() {
  const me = await requireAdmin();
  if (me.role !== "owner") throw new Error("Réservé au propriétaire du compte.");
  return me;
}

export async function addMember(email: string, password: string, fullName: string, role: "admin" | "staff"): Promise<ActionResult> {
  await requireOwner();
  if (!z.string().email().safeParse(email).success) return { ok: false, error: "E-mail invalide." };
  if (password.length < 10) return { ok: false, error: "Mot de passe provisoire : 10 caractères minimum." };
  const sb = createServiceClient();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error) return { ok: false, error: error.message.includes("already") ? "Un compte existe déjà avec cet e-mail." : error.message };
  const { error: e2 } = await sb.from("admin_users").insert({ user_id: data.user.id, email, full_name: fullName || null, role });
  if (e2) return { ok: false, error: pgError(e2) };
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Membre ajouté. Communiquez-lui son mot de passe provisoire." };
}

export async function setMemberRole(userId: string, role: "admin" | "staff"): Promise<ActionResult> {
  const me = await requireOwner();
  if (userId === me.userId) return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle." };
  const { error } = await createServiceClient().from("admin_users").update({ role }).eq("user_id", userId).neq("role", "owner");
  if (error) return { ok: false, error: pgError(error) };
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Rôle modifié." };
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const me = await requireOwner();
  if (userId === me.userId) return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
  const sb = createServiceClient();
  const { data } = await sb.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role === "owner") return { ok: false, error: "Impossible de retirer un propriétaire." };
  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Accès retiré." };
}
