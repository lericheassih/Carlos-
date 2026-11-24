// Captures du vrai site (mobile 390×844 @3x) + positions des éléments à annoter (en fraction de l'écran).
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(execSync("npm root -g").toString().trim() + "/playwright")); }
const B = process.env.SITE || "http://localhost:3000";
const O = new URL("./ui/", import.meta.url).pathname;
mkdirSync(O, { recursive: true });
const VW = 390, VH = 844;
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await c.newPage();
await p.addInitScript(() => { localStorage.setItem("lm_consent", "denied"); localStorage.removeItem("lm_fav"); });
const boxes = {};
const box = async (name, sel) => {
  const r = await p.locator(sel).first().boundingBox();
  if (r) boxes[name] = { x: r.x / VW, y: r.y / VH, w: r.width / VW, h: r.height / VH };
};
const shot = async (n) => { await p.waitForTimeout(450); await p.screenshot({ path: O + n + ".png" }); };
const day = (n) => { const x = new Date(); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const fmt = (s) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lome" }).format(new Date(s + "T12:00:00Z"));

// Accueil
await p.goto(B + "/"); await p.waitForTimeout(1200); await shot("s-accueil");
await box("acc_decouvrir", "text=Découvrir les appartements");
// Catalogue + filtres
await p.goto(B + "/appartements"); await p.waitForTimeout(1200);
await p.fill('input[name="arrivee"]', day(12)); await p.fill('input[name="depart"]', day(15)); await p.fill('input[name="voyageurs"]', "2");
await p.selectOption('select[name="quartier"]', "Agoè 2 Lions");
await p.evaluate(() => scrollTo(0, 150)); await shot("s-filtres"); // compteur de logements hors champ
await box("f_dates", 'input[name="arrivee"]'); await box("f_quartier", 'select[name="quartier"]'); await box("f_btn", "form button.btn-brand");
await p.click("form button.btn-brand"); await p.waitForLoadState("networkidle"); await p.waitForTimeout(800);
await p.evaluate(() => scrollTo(0, 330)); await shot("s-resultats");
await box("r_carte", "main a.group"); await box("r_coeur", 'main a.group button[aria-label="Ajouter aux favoris"]');
await p.click('main a.group button[aria-label="Ajouter aux favoris"]'); await shot("s-favori");
// Fiche
await p.goto(B + "/appartements/appartement-1-chambre-salon-agoe-2-lions"); await p.waitForTimeout(1500); await shot("s-fiche");
await box("fi_visite", "button:has-text('Visite photo')"); await box("fi_photo", "button[aria-label='Photo 1']"); await box("fi_barre", "#mobile-book-bar");
await p.click("button:has-text('Visite photo')"); await shot("s-visite");
await p.evaluate(() => document.querySelector('[aria-label="Visite photo"]').scrollBy(0, 420)); await shot("s-visite2");
await p.click('[aria-label="Retour"]');
await p.click("button[aria-label='Photo 1']"); await p.waitForTimeout(400);
const zb = await p.locator("[aria-label='Photo agrandie'] .touch-none").boundingBox();
await p.mouse.dblclick(zb.x + zb.width * 0.5, zb.y + zb.height * 0.45); await shot("s-zoom");
await p.click("[aria-label='Fermer']");
await p.locator("text=Ce que propose ce logement").first().evaluate((e) => e.scrollIntoView({ block: "start" })); await p.evaluate(() => scrollBy(0, -20)); await shot("s-equipements");
await box("eq_btn", "button:has-text('équipements')");
await p.click("button:has-text('équipements')"); await shot("s-equipements-liste");
await p.click("[aria-label='Retour']");
await p.locator("h2:has-text('À savoir')").evaluate((e) => e.scrollIntoView({ block: "start" })); await p.evaluate(() => scrollBy(0, -20)); await shot("s-asavoir");
await box("as_regles", "button:has-text('Règlement intérieur')");
// Dates + total + barre
await p.locator("#reserver").evaluate((e) => e.scrollIntoView({ block: "start" }));
for (const s of [day(12), day(15)]) {
  for (let i = 0; i < 2 && !(await p.locator(`aside button[aria-label^="${fmt(s)}"]`).count()); i++) await p.click('aside button[aria-label="Mois suivant"]');
  await p.click(`aside button[aria-label^="${fmt(s)}"]`);
}
await p.evaluate(() => scrollBy(0, 40)); await shot("s-dates");
await box("d_cal", "aside .grid.grid-cols-7");
await p.locator("text=Total estimé").evaluate((e) => e.scrollIntoView({ block: "center" })); await shot("s-total");
await box("t_total", "aside .rounded-xl.bg-slate-50"); await box("t_wa", "aside a[href*='wa.me']"); await box("t_demande", "text=Envoyer une demande de réservation");
await box("t_barre", "#mobile-book-bar");
// Tarifs dégressifs (Totsi)
await p.goto(B + "/appartements/appartement-3-chambres-totsi"); await p.waitForTimeout(1200);
await p.locator("h2:has-text('Tarifs')").evaluate((e) => e.scrollIntoView({ block: "start" })); await p.evaluate(() => scrollBy(0, -20)); await shot("s-tarifs");
// Demande de réservation (Agoè) : formulaire + confirmation
await p.goto(B + "/appartements/appartement-1-chambre-salon-agoe-2-lions"); await p.waitForTimeout(1200);
await p.locator("#reserver").evaluate((e) => e.scrollIntoView({ block: "start" }));
for (const s of [day(40), day(43)]) {
  for (let i = 0; i < 3 && !(await p.locator(`aside button[aria-label^="${fmt(s)}"]`).count()); i++) await p.click('aside button[aria-label="Mois suivant"]');
  await p.click(`aside button[aria-label^="${fmt(s)}"]`);
}
await p.click("text=Envoyer une demande de réservation");
await p.fill('input[autocomplete="name"]', "Akossiwa D."); await p.fill('aside input[type="tel"]', "+228 90 00 00 00");
await p.locator("text=Envoyer ma demande").evaluate((e) => e.scrollIntoView({ block: "center" })); await shot("s-formulaire");
await box("fo_btn", "text=Envoyer ma demande");
await p.click("text=Envoyer ma demande"); await p.waitForSelector("text=Demande envoyée", { timeout: 15000 });
await p.locator("text=Demande envoyée").evaluate((e) => e.scrollIntoView({ block: "center" })); await shot("s-envoyee");
writeFileSync(O + "positions.json", JSON.stringify(boxes, null, 1));
writeFileSync(O + "positions.js", "window.TUTO_POS = " + JSON.stringify(boxes) + ";\n");
console.log(Object.keys(boxes).join(", "));
await b.close();
