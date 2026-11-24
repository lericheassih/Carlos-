import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client anonyme pour le site public : n'accède qu'aux vues publiées (RLS).
 * Lecture toujours en direct (aucun cache) : une publication dans l'administration
 * est visible dès la requête suivante, sans redéploiement.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
