export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

export function pgError(e: { message: string; code?: string; details?: string | null } | null | undefined, fallback = "Une erreur est survenue."): string {
  if (!e) return fallback;
  if (e.code === "23P01") return "Ces dates chevauchent une réservation confirmée existante pour cet appartement.";
  if (e.code === "23505") {
    if (e.message.includes("slug")) return "Cette adresse de page (slug) est déjà utilisée par un autre appartement.";
    if (e.message.includes("name")) return "Ce nom existe déjà.";
    return "Cette valeur existe déjà.";
  }
  if (e.code === "23503") return "Élément lié à d'autres données (ex. réservations) : archivez-le plutôt que de le supprimer.";
  if (e.code === "23514") return "Une valeur saisie n'est pas valide.";
  if (e.code === "P0001") return e.message;
  if (e.code === "42501") return "Vous n'avez pas les droits pour cette action.";
  return fallback;
}
