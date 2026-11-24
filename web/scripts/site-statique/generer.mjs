// Génère le site public en version statique (HTML + photos), prêt à héberger sans serveur ni base de données.
// Le rendu vient de l'application elle-même (next start sur le port 3000, base locale démarrée).
//   node scripts/site-statique/generer.mjs <dossier>            → version en ligne (production)
//   node scripts/site-statique/generer.mjs <dossier> --apercu   → copie de démonstration (artefact claude.ai)
// Réglages (facultatifs) : PIXEL_ID=… (pixel Meta), SITE_URL=https://… (adresse du site, pour les aperçus de partage)
import { writeFileSync, mkdirSync, readFileSync, copyFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const B = "http://localhost:3000";
const OUT = process.argv[2];
const APERCU = process.argv.includes("--apercu");
const PIXEL = (process.env.PIXEL_ID || "").replace(/\D/g, "");
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const HERE = new URL(".", import.meta.url).pathname;
if (!OUT) { console.error("Usage : node generer.mjs <dossier> [--apercu]"); process.exit(1); }
mkdirSync(OUT + "/assets", { recursive: true });
const slugs = execSync(`PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -tAc "select published->>'slug' from apartments where status='published' order by created_at"`).toString().trim().split("\n").filter(Boolean);
const pages = { "/": "index.html", "/appartements": "appartements.html", "/conditions": "conditions.html", "/confidentialite": "confidentialite.html" };
slugs.forEach((s) => (pages[`/appartements/${s}`] = `${s}.html`));
const files = {};
const saved = new Map();

async function save(url, ext) {
  if (saved.has(url)) return saved.get(url);
  const r = await fetch(B + url, { headers: { accept: "image/webp,*/*" } });
  if (!r.ok) throw new Error(url + " " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = r.headers.get("content-type") || "";
  const e = ext || (ct.includes("webp") ? "webp" : ct.includes("avif") ? "avif" : ct.includes("png") ? "png" : "jpg");
  const name = `assets/${createHash("sha1").update(url).digest("hex").slice(0, 12)}.${e}`;
  writeFileSync(`${OUT}/${name}`, buf);
  files[name] = name;
  saved.set(url, name);
  return name;
}

// CSS + polices
const home = await (await fetch(B + "/")).text();
const cssUrl = home.match(/href="(\/_next\/static\/css\/[^"]+\.css)"/)[1];
let css = await (await fetch(B + cssUrl)).text();
for (const m of [...new Set(css.match(/\/_next\/static\/media\/[^)"']+\.woff2/g) || [])]) {
  const n = await save(m, "woff2");
  css = css.split(m).join(n.replace("assets/", ""));
}
css = css.replace(/\.(__variable_[a-z0-9]+)\{/g, ":root,.$1{");
writeFileSync(`${OUT}/assets/site.css`, css);
files["assets/site.css"] = "assets/site.css";

// Données : tarifs, disponibilités, photos par pièce, équipements (icônes en SVG), règles
import { createRequire } from "node:module";
const req = createRequire("/home/user/Carlos-/web/package.json");
const React = req("react"), { renderToStaticMarkup } = req("react-dom/server"), L = req("lucide-react");
const ICONS = { wifi:"Wifi", snowflake:"Snowflake", "chef-hat":"ChefHat", tv:"Tv", zap:"Zap", car:"Car", waves:"Waves", droplets:"Droplets", droplet:"Droplet", refrigerator:"Refrigerator",
  "washing-machine":"WashingMachine", "shield-check":"ShieldCheck", "arrow-up-down":"ArrowUpDown", sun:"Sun", umbrella:"Umbrella", laptop:"Laptop", "bed-double":"BedDouble", check:"Check",
  wind:"Wind", bath:"Bath", shirt:"Shirt", thermometer:"Thermometer", "cooking-pot":"CookingPot", flame:"Flame", microwave:"Microwave", coffee:"Coffee", "paw-print":"PawPrint",
  cigarette:"Cigarette", "key-round":"KeyRound", lock:"Lock", cctv:"Cctv", "alarm-smoke":"AlarmSmoke", siren:"Siren", "fire-extinguisher":"FireExtinguisher", "briefcase-medical":"BriefcaseMedical" };
const svg = (n, cls) => renderToStaticMarkup(React.createElement(L[ICONS[n] ?? "Check"], { className: cls, strokeWidth: 1.5, "aria-hidden": true }));
const q = (sql) => JSON.parse(execSync(`PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -tAc "${sql}"`).toString());
const settings = q("select json_build_object('wa',published->>'whatsapp','company',published->>'company_name','cancel',published->>'cancellation_policy','conditions',published->>'booking_conditions') from website_settings");
settings.preview = APERCU;
settings.pixel = PIXEL;
const data = {};
for (const s of slugs) {
  const row = q(`select json_build_object('id',id,'snap',published) from apartments where published->>'slug'='${s}'`);
  const a = row.snap;
  const av = await (await fetch(`${B}/api/availability?apartment=${row.id}`)).json();
  const media = [];
  for (const m of a.media.filter((x) => x.kind === "image")) media.push({ src: await save("/_next/image?url=" + encodeURIComponent(m.url) + "&w=1080&q=75"), room: m.room || "" });
  data[s] = {
    id: row.id, name: a.name, pricing: a.pricing, max: a.max_guests, bedrooms: a.bedrooms, neighborhood: a.neighborhood, ranges: av.ranges, media,
    amenities: a.amenities.map((x) => ({ name: x.name, category: x.category, description: x.description || "", included: x.included !== false, svg: svg(x.icon, "size-6 " + (x.included === false ? "text-slate-400" : "text-slate-900")) })),
    rules: a.house_rules.split("\n").map((x) => x.trim()).filter(Boolean), checkIn: a.check_in_time, checkOut: a.check_out_time,
    conditions: a.booking_conditions || settings.conditions || "",
  };
}

const enhance = `<script>window.__APTS=${JSON.stringify(data)};window.__SITE=${JSON.stringify(settings)};</script><script src="assets/enhance.js"></script>`;

for (const [path, file] of Object.entries(pages)) {
  let html = await (await fetch(B + path)).text();
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (m) => (/^<script type="application\/ld\+json"/.test(m) ? m : ""));
  html = html.replace(/<link[^>]+rel="(preload|modulepreload)"[^>]*>/g, "").replace(/<meta name="next-size-adjust"[^>]*>/g, "");
  // Vidéo d'accueil, icône et images de partage (og:image) -> fichiers locaux
  html = html.replace(/"\/videos\/(accueil\.[a-z0-9]+)"/g, '"assets/$1"');
  for (const m of [...new Set(html.match(/https?:\/\/(?:127\.0\.0\.1|localhost):54321\/storage\/v1\/object\/public\/[^"]+/g) || [])]) {
    const local = await save("/_next/image?url=" + encodeURIComponent(m) + "&w=1200&q=80");
    html = html.split(m).join(SITE_URL ? `${SITE_URL}/${local}` : local);
  }
  html = html.replace(/<link rel="icon" href="\/favicon\.ico"[^>]*>/g, "");
  html = html.replace(/<link rel="stylesheet" href="\/_next\/static\/css\/[^"]+"[^>]*>/g, '<link rel="stylesheet" href="assets/site.css">');
  // Images optimisées -> fichiers locaux
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const tag of imgs) {
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    if (!src || src.startsWith("assets/") || src.startsWith(SITE_URL + "/assets/")) continue;
    let u = src.replace(/&amp;/g, "&");
    if (u.startsWith("/_next/image")) u = u.replace(/w=\d+/, tag.includes("100vw") ? "w=1920" : "w=1080");
    else if (u.startsWith("http")) u = "/_next/image?url=" + encodeURIComponent(u) + "&w=640&q=75";
    const local = await save(u);
    const nt = tag.replace(/\s(srcset|sizes)="[^"]*"/gi, "").replace(/\ssrc="[^"]+"/, ` src="${local}"`);
    html = html.split(tag).join(nt);
  }
  // Liens internes
  html = html.replace(/href="\/appartements\/([a-z0-9-]+)(\?[^"]*)?"/g, (m, s) => (slugs.includes(s) ? `href="${s}.html"` : m));
  html = html.replace(/href="\/appartements(\?[^"]*)?"/g, 'href="appartements.html"');
  html = html.replace(/href="\/#contact"/g, 'href="index.html#contact"').replace(/href="\/"/g, 'href="index.html"');
  html = html.replace(/href="\/(conditions|confidentialite)"/g, 'href="$1.html"');
  if (SITE_URL) html = html.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):3000/g, SITE_URL);
  else html = html.replace(/<link rel="canonical"[^>]*>/g, "").replace(/<meta property="og:url"[^>]*>/g, "").replace(/https?:\/\/(?:localhost|127\.0\.0\.1):3000/g, "");
  html = html.replace(/action="\/appartements"/g, 'action="appartements.html"');
  html = html.replace("</body>", `${enhance}</body>`);
  html = html.replace(/<!DOCTYPE html>/i, "<!doctype html>");
  writeFileSync(`${OUT}/${file}`, html);
  if (file !== "index.html") files[file] = file;
}
// Vidéo d'accueil
for (const f of readdirSync(new URL("../../public/videos/", import.meta.url).pathname)) {
  copyFileSync(new URL("../../public/videos/" + f, import.meta.url).pathname, `${OUT}/assets/${f}`);
  files["assets/" + f] = "assets/" + f;
}
copyFileSync(HERE + "enhance.js", `${OUT}/assets/enhance.js`);
// Copie de démonstration (artefact) : page principale réduite au contenu (le squelette HTML est ajouté à la publication)
if (APERCU) {
  const h = readFileSync(`${OUT}/index.html`, "utf8");
  const head = h.match(/<head>([\s\S]*?)<\/head>/)[1];
  const keep = (head.match(/<title>[\s\S]*?<\/title>|<meta name="description"[^>]*>|<link rel="stylesheet"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).join("\n");
  const body = h.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  writeFileSync(`${OUT}/index.html`, `<title>Site LUMO Immobilier</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${keep.replace(/<title>[\s\S]*?<\/title>/, "")}\n<style>body{background:#fff}</style>\n${body}`);
}
files["assets/enhance.js"] = "assets/enhance.js";
if (APERCU) writeFileSync(`${OUT}/files.json`, JSON.stringify(files));
if (!APERCU) {
  writeFileSync(`${OUT}/robots.txt`, "User-agent: *\nAllow: /\n");
  writeFileSync(`${OUT}/_headers`, "/assets/*\n  Cache-Control: public, max-age=604800\n");
}
console.log(Object.keys(files).length, "fichiers", APERCU ? "(aperçu)" : "(production)", PIXEL ? "· pixel " + PIXEL : "· sans pixel");
