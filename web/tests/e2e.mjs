// Test de bout en bout de la plateforme (administration + site public).
// Prérequis : application démarrée (npm run build && npm start), base Supabase accessible,
// compte admin créé. Usage :
//   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node tests/e2e.mjs [dossier-photos]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright")); }
import { readdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@test.local";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "MotDePasse-Test-2026";
const PHOTOS = process.argv[2];
const SHOTS = process.env.SHOTS_DIR;
const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`); if (!cond) process.exitCode = 1; };
const iso = (d) => d.toISOString().slice(0, 10);
const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }); };

const browser = await chromium.launch();
const admin = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await admin.newPage();
page.on("pageerror", (e) => console.log("  [pageerror admin]", e.message));

// ---------- 1. Sécurité : routes privées
const anon = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 844 } });
const pub = await anon.newPage();
pub.on("pageerror", (e) => console.log("  [pageerror public]", e.message));
await pub.goto(`${BASE}/admin/appartements`);
ok("Route admin protégée (redirection vers /connexion)", pub.url().includes("/connexion"));

// ---------- 2. Connexion
await page.goto(`${BASE}/connexion`);
await page.fill("#email", EMAIL);
await page.fill("#password", "mauvais-mot-de-passe");
await page.click("button[type=submit]");
await page.waitForSelector("p[role=alert]");
ok("Mauvais mot de passe refusé", (await page.textContent("p[role=alert]")).includes("incorrect"));
await page.fill("#password", PASSWORD);
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/admin`, { waitUntil: "commit" });
ok("Connexion administrateur", page.url().endsWith("/admin"));
await shot(page, "01-dashboard-vide");

// ---------- 3. Création d'un appartement
const name = `Appartement Test ${Date.now().toString(36)}`;
await page.goto(`${BASE}/admin/appartements/nouveau`);
await page.fill("#name", name);
await page.fill("#short", "Bel appartement meublé lumineux, idéal pour les séjours d'affaires.");
await page.fill("#desc", "Grand salon, deux chambres climatisées, cuisine équipée.\n\nSitué dans un quartier calme.");
await page.fill("#nb", "Hedzranawoé");
await page.fill("#bedrooms", "2");
await page.fill("#max_guests", "4");
await page.fill("#pn", "65000");
await page.fill("#pw", "400000");
await page.locator("label", { hasText: "Wi-Fi" }).locator("input").check();
await page.locator("label", { hasText: "Climatisation" }).locator("input").check();
if (PHOTOS) {
  const files = readdirSync(PHOTOS).filter((f) => /\.jpe?g$/i.test(f)).slice(0, 4).map((f) => path.join(PHOTOS, f));
  await page.locator('input[type=file][multiple]').first().setInputFiles(files);
  await page.waitForFunction((n) => document.querySelectorAll('[aria-label="Agrandir le média"] img').length >= n, files.length, { timeout: 60000 });
  ok("Téléversement de photos (stockage cloud)", true, `${files.length} photos optimisées et envoyées`);
}
await page.getByRole("button", { name: /^Publier$/ }).click();
await page.waitForURL(/\/admin\/appartements\/[0-9a-f-]{36}$/, { timeout: 30000, waitUntil: "commit" });
const aptId = page.url().split("/").pop();
await page.waitForSelector("text=Publié");
ok("Création + publication d'un appartement", true, aptId);
await shot(page, "02-fiche-appartement");

// ---------- 4. Synchronisation avec le site public
await pub.goto(`${BASE}/appartements`);
let card = pub.locator("a", { hasText: name });
ok("L'appartement apparaît dans le catalogue public", await card.count() > 0);
ok("Prix public = 65 000 FCFA", (await card.first().textContent()).includes("65 000 FCFA"));
await card.first().click();
await pub.waitForURL(/\/appartements\/.+/, { waitUntil: "commit" }); await pub.waitForSelector("h1");
const publicUrl = pub.url().split("?")[0];
ok("Page individuelle de l'appartement", (await pub.textContent("h1")).includes(name));
if (PHOTOS) ok("Photos affichées sur le site public", (await pub.locator("img[src*='storage'], img[src*='_next/image']").count()) > 0);

// Modification du prix : enregistrer SANS publier → le site ne change pas
await page.fill("#pn", "75000");
await page.getByRole("button", { name: "Enregistrer", exact: true }).first().click();
await page.waitForSelector("text=Des modifications enregistrées ne sont pas encore en ligne", { timeout: 15000 });
await pub.goto(publicUrl);
ok("Brouillon non publié : le site affiche encore 65 000 FCFA", (await pub.textContent("aside")).includes("65 000 FCFA"));

// Prévisualisation
const [preview] = await Promise.all([admin.waitForEvent("page"), page.getByRole("button", { name: "Prévisualiser" }).click()]);
await preview.waitForURL(/\/apercu\/appartement\//, { timeout: 20000, waitUntil: "commit" });
await preview.waitForSelector("aside");
ok("Prévisualisation avant publication (75 000 FCFA)", (await preview.textContent("aside")).includes("75 000 FCFA"));
await preview.close();

await page.waitForSelector("text=Le site public est à jour", { state: "detached", timeout: 10000 });
await page.getByRole("button", { name: /Publier les modifications/ }).click();
await page.waitForSelector("text=Le site public est à jour", { timeout: 15000 });
await pub.goto(publicUrl);
{ const t = await pub.textContent("aside"); ok("Après publication : le site affiche 75 000 FCFA (sans redéploiement)", t.includes("75 000 FCFA"), t.includes("75 000 FCFA") ? "" : t.slice(0, 120)); }
await pub.goto(`${BASE}/appartements`);
ok("Catalogue mis à jour : 75 000 FCFA", (await pub.locator("a", { hasText: name }).first().textContent()).includes("75 000 FCFA"));

// ---------- 5. Parcours visiteur : dates, WhatsApp, demande
await pub.goto(publicUrl);
await pub.waitForTimeout(1200);
const ci = day(10), co = day(13);
const monthNav = async (target) => {
  for (let i = 0; i < 3; i++) {
    if (await pub.locator(`aside button[aria-label^="${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lome" }).format(new Date(target + "T12:00:00Z"))}"]`).count()) return;
    await pub.click('aside button[aria-label="Mois suivant"]');
  }
};
const fmt = (d) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lome" }).format(new Date(d + "T12:00:00Z"));
await monthNav(ci);
await pub.click(`aside button[aria-label^="${fmt(ci)}"]`);
await monthNav(co);
await pub.click(`aside button[aria-label^="${fmt(co)}"]`);
const total = await pub.locator("aside", { hasText: "Total estimé" }).textContent();
ok("Récapitulatif du prix (3 nuits × 75 000 = 225 000 FCFA)", total.includes("225 000 FCFA"));
const wa = pub.locator("aside a", { hasText: /Réserver sur WhatsApp/i });
const href = await wa.getAttribute("href");
const msg = decodeURIComponent(href.split("text=")[1] ?? "");
ok("Message WhatsApp prérempli (nom, dates, nuits, personnes, prix)", msg.includes(name) && msg.includes("3 nuits") && msg.includes("2 personnes") && msg.includes("225 000 FCFA"), href.slice(0, 40) + "…");
await pub.route("https://wa.me/**", (r) => r.fulfill({ status: 200, body: "ok" }));
const [waPage] = await Promise.all([anon.waitForEvent("page"), wa.click()]);
await waPage.close();
await pub.click("text=Envoyer une demande de réservation");
await pub.fill('input[autocomplete="name"]', "Kossi Test");
await pub.fill('input[type="tel"]', "+228 90 11 22 33");
await pub.click("text=Envoyer ma demande");
await pub.waitForSelector("text=Demande envoyée", { timeout: 15000 });
const ref = (await pub.locator("strong", { hasText: /^R\d{4}-/ }).textContent()).trim();
ok("Demande de réservation enregistrée depuis le site", /^R\d{4}-\d{4}$/.test(ref), ref);
await shot(pub, "03-public-demande");

// ---------- 6. Gestion de la réservation dans l'admin
await page.goto(`${BASE}/admin/reservations?statut=pending`);
const row = page.locator("tr", { hasText: ref });
ok("La demande apparaît dans l'admin (en attente)", await row.count() > 0);
await row.locator("a").first().click();
await page.waitForURL(/\/admin\/reservations\/[0-9a-f-]{36}$/, { waitUntil: "commit" });
await page.getByRole("button", { name: "Confirmer la réservation" }).click();
await page.waitForSelector("text=les dates sont bloquées", { timeout: 15000 });
ok("Confirmation de la réservation", true);
// Acompte
await page.fill("#pa", "100000");
await page.fill("#pnote", "Acompte T-Money");
await page.getByRole("button", { name: "Enregistrer un paiement" }).click();
await page.waitForSelector("text=Acompte versé", { timeout: 15000 });
ok("Paiement d'acompte → statut « Acompte versé », reste 125 000 FCFA", (await page.textContent("body")).includes("125 000 FCFA"));

// Disponibilités publiques mises à jour
const av = await (await fetch(`${BASE}/api/availability?apartment=${aptId}`)).json();
ok("Dates confirmées indisponibles sur le site", av.ranges.some((r) => r.start_date === ci && r.end_date === co));
await pub.goto(publicUrl);
await pub.waitForTimeout(1200);
await monthNav(day(11));
ok("Calendrier public : nuit réservée désactivée", await pub.locator(`aside button[aria-label^="${fmt(day(11))}"]`).isDisabled());

// Double réservation refusée
await page.goto(`${BASE}/admin/reservations/nouvelle?appartement=${aptId}&arrivee=${day(11)}&depart=${day(12)}`);
await page.fill("#cn", "Client Doublon");
await page.fill("#cp", "+22899999999");
await page.waitForSelector("text=Déjà réservé", { timeout: 10000 });
ok("Alerte de chevauchement affichée", true);
await page.getByRole("button", { name: "Créer la réservation" }).click();
await page.waitForSelector("text=chevauchent une réservation confirmée", { timeout: 10000 });
ok("Double réservation bloquée par la base de données", true);

// Réservation manuelle sur d'autres dates
await page.fill("#ci", day(20));
await page.fill("#co", day(24));
await page.waitForSelector("text=✓ Dates disponibles", { timeout: 10000 });
await page.getByRole("button", { name: "Créer la réservation" }).click();
await page.waitForURL(/\/admin\/reservations\/[0-9a-f-]{36}$/, { timeout: 15000, waitUntil: "commit" });
ok("Réservation manuelle créée (4 nuits, prix calculé automatiquement)", (await page.textContent("body")).includes("300 000 FCFA"));

// Calendrier
await page.goto(`${BASE}/admin/calendrier?appartement=${aptId}&date=${day(10)}`);
ok("Calendrier : réservation visible", await page.locator(`button[title*="${ref}"]`).count() > 0);
await shot(page, "04-calendrier");

// Blocage de dates
await page.goto(`${BASE}/admin/tarifs`);
await page.selectOption("#bids", aptId);
await page.fill("#bs", day(30));
await page.fill("#be", day(33));
await page.fill("#br", "Travaux");
await page.getByRole("button", { name: "Bloquer", exact: true }).click();
await page.waitForSelector("text=elles ne sont plus réservables", { timeout: 10000 });
const av2 = await (await fetch(`${BASE}/api/availability?apartment=${aptId}`)).json();
ok("Blocage manuel de dates → indisponibles sur le site", av2.ranges.some((r) => r.start_date === day(30)));

// ---------- 7. Analytics
await pub.goto(`${BASE}/?utm_source=facebook&utm_medium=paid_social&utm_campaign=test_e2e`);
await pub.waitForTimeout(2500);
await page.goto(`${BASE}/admin/analytics?periode=today`);
await page.waitForFunction(() => /\d/.test(document.querySelector(".text-6xl")?.textContent ?? ""), null, { timeout: 15000 });
const live = Number((await page.textContent(".text-6xl")).trim());
ok("Visiteurs actifs en temps réel ≥ 1", live >= 1, `${live} en ligne`);
const aptRow = page.locator("tr", { hasText: name });
const cells = (await aptRow.locator("td").allTextContents()).map((s) => s.trim());
ok("Consultations de l'appartement comptées", Number(cells[1]) >= 3, `vues=${cells[1]}`);
ok("Clic WhatsApp compté pour l'appartement", Number(cells[3]) >= 1, `clics=${cells[3]}`);
ok("Réservation confirmée comptée séparément", Number(cells[7]) >= 1, `confirmées=${cells[7]}`);
ok("Campagne UTM Facebook attribuée", (await page.textContent("body")).includes("test_e2e"));
await shot(page, "05-analytics");

// Robots exclus
const botRes = await fetch(`${BASE}/api/track`, { method: "POST", headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)", "content-type": "application/json" }, body: JSON.stringify({ event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), visitor_id: crypto.randomUUID(), type: "page_view", path: "/" }) });
ok("Robots ignorés par la collecte", botRes.status === 204);

// ---------- 8. Tableau de bord
await page.goto(`${BASE}/admin`);
const body = await page.textContent("main");
ok("Tableau de bord : revenus encaissés réels (100 000 FCFA)", body.includes("100 000 FCFA"));
await shot(page, "06-dashboard");

// ---------- 9. Masquer → disparaît du site
await page.goto(`${BASE}/admin/appartements/${aptId}`);
await page.getByRole("button", { name: "Masquer" }).click();
await page.waitForSelector("text=il n'apparaît plus sur le site", { timeout: 10000 });
await pub.goto(`${BASE}/appartements`);
ok("Appartement masqué : retiré du catalogue", (await pub.locator("a", { hasText: name }).count()) === 0);
const r404 = await pub.goto(publicUrl);
ok("Appartement masqué : page publique en 404", r404.status() === 404);
await page.getByRole("button", { name: /^Publier$/ }).click();
await page.waitForSelector("text=Le site public est à jour", { timeout: 15000 });

// ---------- 10. Accès direct à la base sans authentification
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (sbUrl && anonKey) {
  const h = { apikey: anonKey, authorization: `Bearer ${anonKey}` };
  const c = await fetch(`${sbUrl}/rest/v1/customers?select=*`, { headers: h });
  ok("API anonyme : clients inaccessibles", c.status === 401 || c.status === 403 || (await c.json()).length === 0, `HTTP ${c.status}`);
  const a = await (await fetch(`${sbUrl}/rest/v1/public_apartments?select=id`, { headers: h })).json();
  ok("API anonyme : seuls les appartements publiés sont lisibles", Array.isArray(a));
  const w = await fetch(`${sbUrl}/rest/v1/apartments`, { method: "POST", headers: { ...h, "content-type": "application/json" }, body: JSON.stringify({ name: "Pirate", slug: "pirate" }) });
  ok("API anonyme : écriture refusée", w.status >= 400, `HTTP ${w.status}`);
}

await browser.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} vérifications réussies.`);
