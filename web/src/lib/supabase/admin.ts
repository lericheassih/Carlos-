import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client "service role" : contourne la RLS. Strictement réservé au serveur
 * (collecte analytics, demandes de réservation publiques, gestion de l'équipe).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante (variable d'environnement serveur).");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
