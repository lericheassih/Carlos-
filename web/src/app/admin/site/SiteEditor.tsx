"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { dateTimeFr } from "@/lib/format";
import type { SiteSettings } from "@/lib/site-settings";
import { publishSite, saveSiteDraft } from "./actions";

export function SiteEditor({ initial, differs, publishedAt, canEdit }: { initial: SiteSettings; differs: boolean; publishedAt: string | null; canEdit: boolean }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [picker, setPicker] = useState<null | "logo" | "hero">(null);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => { setS((x) => ({ ...x, [k]: v })); setDirty(true); };

  const run = (label: string, fn: () => Promise<void>) => { setBusy(label); start(async () => { try { await fn(); } finally { setBusy(null); } }); };
  const save = async () => { const r = await saveSiteDraft(s); if (!r.ok) { toast.error(r.error); return false; } setDirty(false); return true; };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-auto text-[13px] text-muted">
          {dirty ? "Modifications non enregistrées" : differs ? "Le brouillon contient des modifications non publiées." : `Version en ligne${publishedAt ? ` publiée le ${dateTimeFr(publishedAt)}` : ""}.`}
        </span>
        <Button disabled={!canEdit} onClick={() => run("save", async () => { if (await save()) { toast("Brouillon enregistré."); router.refresh(); } })} loading={busy === "save"}>Enregistrer le brouillon</Button>
        <Button disabled={!canEdit} onClick={() => { const w = window.open("about:blank", "_blank"); run("prev", async () => { if (await save()) { if (w) w.location.href = "/apercu/site"; router.refresh(); } else w?.close(); }); }} loading={busy === "prev"}><Eye className="size-4" /> Prévisualiser</Button>
        <Button variant="primary" disabled={!canEdit} onClick={() => run("pub", async () => { if (!(await save())) return; const r = await publishSite(); if (!r.ok) toast.error(r.error); else { toast(r.message!); router.refresh(); } })} loading={busy === "pub"}>Publier</Button>
      </div>
      {!canEdit && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Votre rôle ne permet pas de modifier le site.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Identité" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid size-16 place-items-center overflow-hidden rounded-xl border border-line bg-slate-50">
                {s.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={s.logo_url} alt="Logo" className="size-full object-contain" />
                  : <span className="text-xs text-muted">Logo</span>}
              </div>
              <Button size="sm" onClick={() => setPicker("logo")}><Upload className="size-4" /> Choisir un logo</Button>
              {s.logo_url && <Button size="sm" variant="ghost" onClick={() => set("logo_url", null)}>Retirer</Button>}
            </div>
            <Field label="Nom de l'entreprise" htmlFor="cn" required><Input id="cn" value={s.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
            <Field label="Slogan" htmlFor="tg"><Input id="tg" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Couleur principale" htmlFor="pc"><div className="flex gap-2"><input type="color" className="h-9 w-12 rounded border border-line" value={s.primary_color} onChange={(e) => set("primary_color", e.target.value)} /><Input id="pc" value={s.primary_color} onChange={(e) => set("primary_color", e.target.value)} /></div></Field>
              <Field label="Couleur secondaire" htmlFor="ac"><div className="flex gap-2"><input type="color" className="h-9 w-12 rounded border border-line" value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} /><Input id="ac" value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} /></div></Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coordonnées" />
          <CardBody className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Téléphone (affiché)" htmlFor="ph"><Input id="ph" value={s.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+228 70 00 00 00" /></Field>
              <Field label="Numéro WhatsApp" htmlFor="wa" help="Format international sans + (ex. 22870390505)"><Input id="wa" value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
            </div>
            <Field label="E-mail" htmlFor="em"><Input id="em" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Adresse" htmlFor="ad"><Input id="ad" value={s.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Texte de la section contact" htmlFor="ct"><Textarea id="ct" rows={2} value={s.contact_text} onChange={(e) => set("contact_text", e.target.value)} /></Field>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Page d'accueil" />
          <CardBody className="space-y-3">
            <Field label="Titre principal" htmlFor="ht"><Input id="ht" value={s.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></Field>
            <Field label="Texte d'accueil" htmlFor="hs"><Textarea id="hs" rows={3} value={s.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></Field>
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="label mb-0">Images de couverture</span><Button size="sm" onClick={() => setPicker("hero")}><ImagePlus className="size-4" /> Ajouter</Button></div>
              {s.hero_images.length === 0 ? <p className="text-[13px] text-muted">Aucune image : la photo principale de votre premier appartement sera utilisée.</p> : (
                <div className="flex flex-wrap gap-2">
                  {s.hero_images.map((u, i) => (
                    <div key={u} className="relative h-20 w-32 overflow-hidden rounded-lg border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="size-full object-cover" />
                      {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 text-[10px] text-white">Principale</span>}
                      <button onClick={() => set("hero_images", s.hero_images.filter((x) => x !== u))} className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-white/90" aria-label="Retirer"><X className="size-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Titre de présentation" htmlFor="at"><Input id="at" value={s.about_title} onChange={(e) => set("about_title", e.target.value)} /></Field>
              <Field label="Texte de présentation" htmlFor="ab"><Textarea id="ab" rows={3} value={s.about_text} onChange={(e) => set("about_text", e.target.value)} /></Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Services" actions={<Button size="sm" variant="plain" onClick={() => set("services", [...s.services, { title: "", text: "" }])}><Plus className="size-4" /> Ajouter</Button>} />
          <CardBody className="space-y-3">
            {s.services.map((x, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Input placeholder="Titre" value={x.title} onChange={(e) => set("services", s.services.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))} />
                  <Textarea rows={2} className="min-h-0" placeholder="Description" value={x.text} onChange={(e) => set("services", s.services.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} />
                </div>
                <Button variant="ghost" aria-label="Supprimer" onClick={() => set("services", s.services.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Avantages" actions={<Button size="sm" variant="plain" onClick={() => set("advantages", [...s.advantages, ""])}><Plus className="size-4" /> Ajouter</Button>} />
          <CardBody className="space-y-2">
            {s.advantages.map((x, i) => (
              <div key={i} className="flex gap-2">
                <Input value={x} onChange={(e) => set("advantages", s.advantages.map((y, j) => (j === i ? e.target.value : y)))} />
                <Button variant="ghost" aria-label="Supprimer" onClick={() => set("advantages", s.advantages.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Conditions de réservation" description="Affichées sur la page Conditions et sur chaque fiche (si la fiche n'a pas ses propres conditions)." />
          <CardBody className="space-y-3">
            <Field label="Conditions générales" htmlFor="bc"><Textarea id="bc" rows={5} value={s.booking_conditions} onChange={(e) => set("booking_conditions", e.target.value)} /></Field>
            <Field label="Politique d'annulation" htmlFor="cp"><Textarea id="cp" rows={3} value={s.cancellation_policy} onChange={(e) => set("cancellation_policy", e.target.value)} /></Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Réseaux sociaux, référencement et confidentialité" />
          <CardBody className="space-y-3">
            <Field label="Facebook" htmlFor="fb"><Input id="fb" value={s.social.facebook} onChange={(e) => set("social", { ...s.social, facebook: e.target.value })} placeholder="https://facebook.com/…" /></Field>
            <Field label="Instagram" htmlFor="ig"><Input id="ig" value={s.social.instagram} onChange={(e) => set("social", { ...s.social, instagram: e.target.value })} placeholder="https://instagram.com/…" /></Field>
            <Field label="TikTok" htmlFor="tt"><Input id="tt" value={s.social.tiktok} onChange={(e) => set("social", { ...s.social, tiktok: e.target.value })} placeholder="https://tiktok.com/@…" /></Field>
            <Field label="Titre Google (SEO)" htmlFor="st"><Input id="st" value={s.seo_title} maxLength={90} onChange={(e) => set("seo_title", e.target.value)} /></Field>
            <Field label="Description Google (SEO)" htmlFor="sd"><Textarea id="sd" rows={2} maxLength={200} value={s.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></Field>
            <Field label="Mesure d'audience" htmlFor="cm" help="« Information » : mesure anonyme avec possibilité de refuser. « Consentement préalable » : rien n'est mesuré avant acceptation (recommandé si vous ciblez l'Europe).">
              <Select id="cm" value={s.consent_mode} onChange={(e) => set("consent_mode", e.target.value as SiteSettings["consent_mode"])}>
                <option value="notice">Information + refus possible</option>
                <option value="opt_in">Consentement préalable</option>
              </Select>
            </Field>
          </CardBody>
        </Card>
      </div>

      <MediaPicker open={!!picker} onClose={() => setPicker(null)} kind="image" multiple={picker === "hero"}
        onSelect={(items) => {
          if (picker === "logo") set("logo_url", items[0]?.url ?? null);
          else set("hero_images", [...new Set([...s.hero_images, ...items.map((i) => i.url)])].slice(0, 10));
        }} />
    </>
  );
}
