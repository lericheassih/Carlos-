import "server-only";
import { revalidatePath } from "next/cache";

/** Purge les caches éventuels (routeur, sitemap) après une publication. Le site lit les données en direct. */
export function revalidatePublic(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/", "layout");
  for (const s of slugs) if (s) revalidatePath(`/appartements/${s}`);
}
