// Envoie les photos de supabase/sauvegarde/media vers le bucket « media » d'un projet Supabase (mêmes chemins).
// Usage : NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/restaurer-medias.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis."); process.exit(1); }
const ROOT = new URL("../supabase/sauvegarde/media/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const type = (f) => (f.endsWith(".webp") ? "image/webp" : f.endsWith(".png") ? "image/png" : f.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
let ok = 0;
for (const f of walk(ROOT)) {
  const path = relative(ROOT, f);
  const r = await fetch(`${URL_}/storage/v1/object/media/${path}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": type(f), "x-upsert": "true" }, body: readFileSync(f) });
  if (r.ok) ok++; else console.error(path, r.status, await r.text());
}
console.log(`${ok} fichier(s) envoyé(s).`);
