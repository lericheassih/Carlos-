import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "owner" | "admin" | "staff";
export type AdminSession = { userId: string; email: string; fullName: string | null; role: AdminRole };

/** Vérifie côté serveur que l'utilisateur est connecté ET membre de l'équipe. */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("role, full_name, email").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { userId: user.id, email: data.email ?? user.email ?? "", fullName: data.full_name, role: data.role as AdminRole };
});

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/connexion?erreur=acces");
  return admin;
}

export async function requireManager(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Action réservée aux gérants.");
  return admin;
}
