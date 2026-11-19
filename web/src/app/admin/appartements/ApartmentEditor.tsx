"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown, ArrowUp, Archive, Copy, ExternalLink, Eye, EyeOff, Film, GripVertical, ImagePlus, Plus, RefreshCw, Star, Trash2, Upload, X,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import { AptStatus } from "@/components/admin/StatusBadges";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { AmenityIcon } from "@/components/AmenityIcon";
import { uploadMedia, type MediaItem } from "@/lib/upload";
import { fcfa, slugify, dateTimeFr } from "@/lib/format";
import { PROPERTY_TYPES, type ApartmentRow, type ApartmentStatus, type ExtraFee } from "@/lib/types";
import { quoteStay, pricingFromRow } from "@/lib/pricing";
import { addDays, todayIso } from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
  createAmenity, deleteApartment, duplicateApartment, publishApartment, saveApartment, setApartmentStatus,
} from "./actions";

type Amenity = { id: string; name: string; icon: string; category: string };
type EditorMedia = { media_id: string; kind: "image" | "video"; url: string; name: string; is_cover: boolean; caption: string };

type FormState = {
  name: string; slug: string; short_description: string; description: string; city: string; neighborhood: string; address: string;
  property_type: string; bedrooms: number; living_rooms: number; bathrooms: number; max_guests: number;
  latitude: string; longitude: string;
  price_night: string; price_week: string; price_month: string; promo_price_night: string; promo_label: string;
  promo_start: string; promo_end: string; extra_fees: ExtraFee[]; min_nights: number; pricing_conditions: string;
  booking_conditions: string; house_rules: string; check_in_time: string; check_out_time: string; featured: boolean;
};

function initial(a: ApartmentRow | null): FormState {
  return {
    name: a?.name ?? "", slug: a?.slug ?? "", short_description: a?.short_description ?? "", description: a?.description ?? "",
    city: a?.city ?? "Lomé", neighborhood: a?.neighborhood ?? "", address: a?.address ?? "", property_type: a?.property_type ?? "appartement",
    bedrooms: a?.bedrooms ?? 1, living_rooms: a?.living_rooms ?? 1, bathrooms: a?.bathrooms ?? 1, max_guests: a?.max_guests ?? 2,
    latitude: a?.latitude?.toString() ?? "", longitude: a?.longitude?.toString() ?? "",
    price_night: a ? String(a.price_night || "") : "", price_week: a?.price_week?.toString() ?? "", price_month: a?.price_month?.toString() ?? "",
    promo_price_night: a?.promo_price_night?.toString() ?? "", promo_label: a?.promo_label ?? "", promo_start: a?.promo_start ?? "", promo_end: a?.promo_end ?? "",
    extra_fees: a?.extra_fees ?? [], min_nights: a?.min_nights ?? 1, pricing_conditions: a?.pricing_conditions ?? "",
    booking_conditions: a?.booking_conditions ?? "", house_rules: a?.house_rules ?? "",
    check_in_time: a?.check_in_time ?? "14:00", check_out_time: a?.check_out_time ?? "12:00", featured: a?.featured ?? false,
  };
}

export function ApartmentEditor({ apartment, amenities: allAmenities, selectedAmenities, media: initialMedia, hasUnpublishedChanges, defaultMinNights }: {
  apartment: ApartmentRow | null; amenities: Amenity[]; selectedAmenities: string[]; media: EditorMedia[]; hasUnpublishedChanges: boolean; defaultMinNights: number;
}) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => {
    const s = initial(apartment);
    if (!apartment) s.min_nights = defaultMinNights;
    return s;
  });
  const [amenities, setAmenities] = useState(allAmenities);
  const [amSel, setAmSel] = useState<string[]>(selectedAmenities);
  const [media, setMedia] = useState<EditorMedia[]>(initialMedia);
  const [dirty, setDirty] = useState(!apartment);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState<EditorMedia | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const status = (apartment?.status ?? "draft") as ApartmentStatus;
  const id = apartment?.id ?? null;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }

  const payload = () => ({
    ...f,
    slug: f.slug || slugify(f.name),
    promo_label: f.promo_label || null,
    amenity_ids: amSel,
    media: media.map((m) => ({ media_id: m.media_id, is_cover: m.is_cover, caption: m.caption })),
  });

  async function save(): Promise<string | null> {
    const r = await saveApartment(id, payload());
    if (!r.ok) { toast.error(r.error); return null; }
    setDirty(false);
    if (r.data && r.data.slug !== f.slug) setF((s) => ({ ...s, slug: r.data!.slug }));
    return r.data!.id;
  }

  function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    start(async () => {
      try { await fn(); } finally { setBusy(null); }
    });
  }

  const onSave = () => run("save", async () => {
    const newId = await save();
    if (!newId) return;
    toast("Modifications enregistrées." + (status === "published" ? " Cliquez sur « Publier » pour les mettre en ligne." : ""));
    if (!id) router.replace(`/admin/appartements/${newId}`);
    else router.refresh();
  });

  const onPublish = () => run("publish", async () => {
    const newId = await save();
    if (!newId) return;
    const r = await publishApartment(newId);
    if (!r.ok) { toast.error(r.error); if (!id) router.replace(`/admin/appartements/${newId}`); return; }
    toast(r.message!);
    if (!id) router.replace(`/admin/appartements/${newId}`);
    else router.refresh();
  });

  const onPreview = () => {
    // On ouvre l'onglet tout de suite (sinon bloqué par le navigateur), puis on y charge l'aperçu
    const w = window.open("about:blank", "_blank");
    run("preview", async () => {
      const newId = dirty || !id ? await save() : id;
      if (!newId) { w?.close(); return; }
      if (w) w.location.href = `/apercu/appartement/${newId}`;
      if (!id) router.replace(`/admin/appartements/${newId}`);
    });
  };

  const onStatus = (s: ApartmentStatus) => run(s, async () => {
    if (!id) return;
    if (dirty) { const ok = await save(); if (!ok) return; }
    const r = await setApartmentStatus(id, s);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); router.refresh(); }
  });

  const onDuplicate = () => run("dup", async () => {
    if (!id) return;
    const r = await duplicateApartment(id);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); router.push(`/admin/appartements/${r.data!.id}`); }
  });

  const onDelete = () => run("delete", async () => {
    if (!id) return;
    const r = await deleteApartment(id);
    setConfirmDelete(false);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); setDirty(false); router.push("/admin/appartements"); }
  });

  // ---- Médias
  function addMedia(items: MediaItem[]) {
    setMedia((list) => {
      const existing = new Set(list.map((m) => m.media_id));
      const add = items.filter((i) => !existing.has(i.id)).map((i) => ({ media_id: i.id, kind: i.kind, url: i.url, name: i.name, is_cover: false, caption: "" }));
      const next = [...list, ...add];
      if (!next.some((m) => m.is_cover)) { const firstImg = next.find((m) => m.kind === "image"); if (firstImg) firstImg.is_cover = true; }
      return next;
    });
    setDirty(true);
  }
  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(`0/${files.length}`);
    const { items, errors } = await uploadMedia(Array.from(files), (d, t) => setUploading(`${d}/${t}`));
    setUploading(null);
    errors.forEach((e) => toast.error(e));
    if (items.length) { addMedia(items); toast(`${items.length} média(s) ajouté(s). Pensez à enregistrer.`); }
  }
  async function onReplace(files: FileList | null) {
    const target = replaceTarget.current;
    if (!files?.length || !target) return;
    setUploading("1/1");
    const { items, errors } = await uploadMedia([files[0]!]);
    setUploading(null);
    errors.forEach((e) => toast.error(e));
    const n = items[0];
    if (!n) return;
    setMedia((list) => list.map((m) => (m.media_id === target ? { media_id: n.id, kind: n.kind, url: n.url, name: n.name, is_cover: m.is_cover && n.kind === "image", caption: m.caption } : m)));
    setDirty(true);
    toast("Média remplacé. Pensez à enregistrer.");
  }
  function move(i: number, j: number) {
    if (j < 0 || j >= media.length) return;
    setMedia((list) => { const c = [...list]; const [x] = c.splice(i, 1); c.splice(j, 0, x!); return c; });
    setDirty(true);
  }
  function setCover(mid: string) {
    setMedia((list) => list.map((m) => ({ ...m, is_cover: m.media_id === mid })));
    setDirty(true);
  }
  function removeMedia(mid: string) {
    setMedia((list) => {
      const next = list.filter((m) => m.media_id !== mid);
      if (!next.some((m) => m.is_cover)) { const img = next.find((m) => m.kind === "image"); if (img) img.is_cover = true; }
      return next;
    });
    setDirty(true);
  }

  async function addAmenity() {
    const r = await createAmenity(newAmenity);
    if (!r.ok) return toast.error(r.error);
    const a = r.data!;
    setAmenities((l) => (l.some((x) => x.id === a.id) ? l : [...l, a]));
    setAmSel((s) => (s.includes(a.id) ? s : [...s, a.id]));
    setNewAmenity("");
    setDirty(true);
  }

  const amenityGroups = useMemo(() => {
    const g = new Map<string, Amenity[]>();
    amenities.forEach((a) => g.set(a.category, [...(g.get(a.category) ?? []), a]));
    return [...g.entries()];
  }, [amenities]);

  // Simulation de prix (aide à la saisie)
  const sim = useMemo(() => {
    const night = Number(f.price_night) || 0;
    if (!night) return null;
    const p = pricingFromRow({
      price_night: night, price_week: Number(f.price_week) || null, price_month: Number(f.price_month) || null,
      promo_price_night: Number(f.promo_price_night) || null, promo_label: f.promo_label, promo_start: f.promo_start || null, promo_end: f.promo_end || null,
      extra_fees: f.extra_fees, min_nights: f.min_nights, pricing_conditions: "",
    });
    const t = todayIso();
    return [3, 7, 30].map((n) => ({ n, q: quoteStay(p, t, addDays(t, n), 2) }));
  }, [f.price_night, f.price_week, f.price_month, f.promo_price_night, f.promo_label, f.promo_start, f.promo_end, f.extra_fees, f.min_nights]);

  const num = (k: "bedrooms" | "living_rooms" | "bathrooms" | "max_guests" | "min_nights", label: string, min = 0) => (
    <Field label={label} htmlFor={k}>
      <Input id={k} type="number" min={min} max={100} value={f[k]} onChange={(e) => set(k, Math.max(min, Number(e.target.value)))} />
    </Field>
  );

  return (
    <>
      {/* Barre d'enregistrement façon Shopify */}
      <div className={cn("sticky top-14 z-20 -mx-3 mb-4 flex items-center gap-2 px-3 py-2 transition sm:-mx-6 sm:px-6",
        dirty ? "bg-[#1a1c1f] text-white shadow-md" : "pointer-events-none mb-0 h-0 overflow-hidden py-0 opacity-0")}>
        <span className="flex-1 text-sm">{id ? "Modifications non enregistrées" : "Nouvel appartement (non enregistré)"}</span>
        {id && <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => { setF(initial(apartment)); setMedia(initialMedia); setAmSel(selectedAmenities); setDirty(false); }}>Annuler</Button>}
        <Button size="sm" onClick={onSave} loading={busy === "save"}>Enregistrer</Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
        {status === "published" && hasUnpublishedChanges && !dirty && (
          <span className="mr-auto rounded-lg bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-800 ring-1 ring-amber-200">
            Des modifications enregistrées ne sont pas encore en ligne.
          </span>
        )}
        {id && <Button onClick={onDuplicate} loading={busy === "dup"}><Copy className="size-4" /> Dupliquer</Button>}
        <Button onClick={onPreview} loading={busy === "preview"}><Eye className="size-4" /> Prévisualiser</Button>
        <Button onClick={onSave} loading={busy === "save"} disabled={!dirty && !!id}>Enregistrer</Button>
        <Button variant="primary" onClick={onPublish} loading={busy === "publish"}>
          <RefreshCw className="size-4" /> {status === "published" ? "Publier les modifications" : "Publier"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* A. Informations générales */}
          <Card>
            <CardHeader title="Informations générales" />
            <CardBody className="space-y-4">
              <Field label="Nom de l'appartement" htmlFor="name" required>
                <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Appartement 3 chambres salon, Totsi" maxLength={160} />
              </Field>
              <Field label="Description courte" htmlFor="short" help="Affichée sur les cartes du catalogue (≈ 160 caractères).">
                <Textarea id="short" rows={2} className="min-h-0" value={f.short_description} maxLength={400} onChange={(e) => set("short_description", e.target.value)} />
              </Field>
              <Field label="Description détaillée" htmlFor="desc" help="Les retours à la ligne sont conservés sur le site.">
                <Textarea id="desc" rows={8} value={f.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Type de logement" htmlFor="type">
                  <Select id="type" value={f.property_type} onChange={(e) => set("property_type", e.target.value)}>
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</option>)}
                  </Select>
                </Field>
                {num("bedrooms", "Chambres")}
                {num("living_rooms", "Salons")}
                {num("bathrooms", "Salles de bain")}
                {num("max_guests", "Capacité max. (personnes)", 1)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Localisation" description="Le quartier et la ville sont affichés publiquement. L'adresse exacte reste interne." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville" htmlFor="city"><Input id="city" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="Quartier" htmlFor="nb"><Input id="nb" value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ex. Hedzranawoé" /></Field>
              <Field label="Adresse (interne)" htmlFor="addr" className="sm:col-span-2"><Input id="addr" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="Latitude (facultatif)" htmlFor="lat" help="Pour afficher la carte. Ex. 6.1725"><Input id="lat" inputMode="decimal" value={f.latitude} onChange={(e) => set("latitude", e.target.value)} /></Field>
              <Field label="Longitude (facultatif)" htmlFor="lng" help="Ex. 1.2314"><Input id="lng" inputMode="decimal" value={f.longitude} onChange={(e) => set("longitude", e.target.value)} /></Field>
            </CardBody>
          </Card>

          {/* D. Photos et vidéos */}
          <Card>
            <CardHeader title="Photos et vidéos" description="Glissez pour réordonner. L'étoile définit la photo principale."
              actions={<>
                <Button size="sm" onClick={() => setPicker(true)}><ImagePlus className="size-4" /> Galerie</Button>
                <Button size="sm" variant="primary" onClick={() => fileInput.current?.click()} loading={!!uploading}><Upload className="size-4" /> {uploading ? `Envoi ${uploading}` : "Importer"}</Button>
              </>} />
            <CardBody>
              <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
              <input ref={replaceInput} type="file" accept="image/*,video/*" hidden onChange={(e) => { onReplace(e.target.files); e.target.value = ""; }} />
              {media.length === 0 ? (
                <button type="button" onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-10 text-sm text-muted hover:border-brand-200 hover:bg-brand-50/40">
                  <Upload className="size-6" />
                  <span><strong className="text-ink">Ajoutez des photos</strong> ou déposez-les ici</span>
                  <span className="text-xs">JPG, PNG, WebP, HEIC · vidéos MP4/MOV (200 Mo max). Les images sont optimisées automatiquement.</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
                  onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); onUpload(e.dataTransfer.files); } }}>
                  {media.map((m, i) => (
                    <div key={m.media_id} draggable
                      onDragStart={() => { dragIndex.current = i; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex.current !== null && dragIndex.current !== i) move(dragIndex.current, i); dragIndex.current = null; }}
                      className={cn("group relative overflow-hidden rounded-xl border bg-slate-100", m.is_cover ? "border-brand-500 ring-2 ring-brand-200" : "border-line", i === 0 && "sm:col-span-2 sm:row-span-2")}>
                      <button type="button" className="block aspect-[4/3] w-full" onClick={() => setPreview(m)} aria-label="Agrandir le média">
                        {m.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt={m.name} className="size-full object-cover" loading="lazy" />
                        ) : (
                          <span className="grid size-full place-items-center bg-slate-800 text-white"><Film className="size-7" /></span>
                        )}
                      </button>
                      <span className="absolute left-2 top-2 hidden cursor-grab rounded-md bg-white/90 p-1 text-slate-600 shadow-sm sm:block"><GripVertical className="size-4" /></span>
                      {m.is_cover && <span className="absolute left-2 bottom-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-medium text-white sm:left-10 sm:top-2 sm:bottom-auto">Principale</span>}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        {m.kind === "image" && !m.is_cover && <IconBtn label="Définir comme photo principale" onClick={() => setCover(m.media_id)}><Star className="size-4" /></IconBtn>}
                        <IconBtn label="Remplacer" onClick={() => { replaceTarget.current = m.media_id; replaceInput.current?.click(); }}><RefreshCw className="size-4" /></IconBtn>
                        <IconBtn label="Retirer de cet appartement" onClick={() => removeMedia(m.media_id)}><X className="size-4" /></IconBtn>
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <IconBtn label="Avancer" onClick={() => move(i, i - 1)}><ArrowUp className="size-4" /></IconBtn>
                        <IconBtn label="Reculer" onClick={() => move(i, i + 1)}><ArrowDown className="size-4" /></IconBtn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* B. Tarification */}
          <Card>
            <CardHeader title="Tarification" description="Montants en FCFA. Le meilleur tarif (nuit, semaine ou mois) est appliqué automatiquement au client." />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Prix par nuit" htmlFor="pn" required><MoneyInput id="pn" value={f.price_night} onChange={(e) => set("price_night", e.target.value)} /></Field>
                <Field label="Prix par semaine (7 nuits)" htmlFor="pw" help="Facultatif"><MoneyInput id="pw" value={f.price_week} onChange={(e) => set("price_week", e.target.value)} /></Field>
                <Field label="Prix par mois (30 nuits)" htmlFor="pm" help="Facultatif"><MoneyInput id="pm" value={f.price_month} onChange={(e) => set("price_month", e.target.value)} /></Field>
              </div>
              <div className="rounded-xl border border-line p-4">
                <div className="mb-3 text-[13px] font-semibold">Tarif promotionnel</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Prix promo par nuit" htmlFor="pp"><MoneyInput id="pp" value={f.promo_price_night} onChange={(e) => set("promo_price_night", e.target.value)} /></Field>
                  <Field label="Libellé (facultatif)" htmlFor="pl"><Input id="pl" value={f.promo_label} onChange={(e) => set("promo_label", e.target.value)} placeholder="Ex. Offre de lancement" /></Field>
                  <Field label="Du" htmlFor="ps" help="Vide = dès maintenant"><Input id="ps" type="date" value={f.promo_start} onChange={(e) => set("promo_start", e.target.value)} /></Field>
                  <Field label="Au" htmlFor="pe" help="Vide = sans fin"><Input id="pe" type="date" value={f.promo_end} onChange={(e) => set("promo_end", e.target.value)} /></Field>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Frais supplémentaires</span>
                  <Button size="sm" variant="plain" onClick={() => set("extra_fees", [...f.extra_fees, { label: "Frais de ménage", amount: 0, per: "stay" }])}><Plus className="size-4" /> Ajouter des frais</Button>
                </div>
                {f.extra_fees.length === 0 && <p className="text-[13px] text-muted">Aucuns frais supplémentaires.</p>}
                <div className="space-y-2">
                  {f.extra_fees.map((fee, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2 sm:grid-cols-[1fr_160px_160px_auto]">
                      <Input aria-label="Libellé" value={fee.label} onChange={(e) => set("extra_fees", f.extra_fees.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                      <MoneyInput aria-label="Montant" value={fee.amount || ""} onChange={(e) => set("extra_fees", f.extra_fees.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} />
                      <Select aria-label="Mode" className="col-span-2 sm:col-span-1" value={fee.per} onChange={(e) => set("extra_fees", f.extra_fees.map((x, j) => (j === i ? { ...x, per: e.target.value as ExtraFee["per"] } : x)))}>
                        <option value="stay">par séjour</option><option value="night">par nuit</option><option value="guest">par personne</option>
                      </Select>
                      <Button size="md" variant="ghost" aria-label="Supprimer" className="row-start-1 col-start-3 sm:col-start-4" onClick={() => set("extra_fees", f.extra_fees.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {num("min_nights", "Durée minimale (nuits)", 1)}
              </div>
              <Field label="Conditions tarifaires particulières" htmlFor="pc">
                <Textarea id="pc" rows={3} value={f.pricing_conditions} onChange={(e) => set("pricing_conditions", e.target.value)} placeholder="Ex. Caution de 50 000 FCFA restituée au départ. Électricité incluse." />
              </Field>
              {sim && (
                <div className="rounded-xl bg-slate-50 p-3 text-[13px]">
                  <div className="mb-1.5 font-medium">Simulation (2 personnes, à partir d&apos;aujourd&apos;hui)</div>
                  <div className="grid gap-1 sm:grid-cols-3">
                    {sim.map(({ n, q }) => (
                      <div key={n} className="rounded-lg bg-white px-3 py-2 ring-1 ring-line">
                        <div className="text-muted">{n} nuits</div>
                        <div className="font-semibold tabular-nums">{fcfa(q.total)}</div>
                        {q.savings > 0 && <div className="text-xs text-emerald-700">−{fcfa(q.savings)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* C. Équipements */}
          <Card>
            <CardHeader title="Équipements" description={`${amSel.length} sélectionné(s)`} />
            <CardBody className="space-y-4">
              {amenityGroups.map(([cat, list]) => (
                <div key={cat}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{cat}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {list.map((a) => {
                      const on = amSel.includes(a.id);
                      return (
                        <label key={a.id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition", on ? "border-brand-500 bg-brand-50/60" : "border-line hover:bg-slate-50")}>
                          <input type="checkbox" className="size-4 accent-brand-600" checked={on}
                            onChange={() => { setAmSel((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id])); setDirty(true); }} />
                          <AmenityIcon name={a.icon} className="size-4 text-slate-500" />
                          <span className="truncate">{a.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 border-t border-line pt-4">
                <Input placeholder="Nouvel équipement (ex. Fer à repasser)" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); } }} />
                <Button onClick={addAmenity} disabled={newAmenity.trim().length < 2}><Plus className="size-4" /> Ajouter</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Conditions de réservation" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Arrivée à partir de" htmlFor="ci"><Input id="ci" type="time" value={f.check_in_time} onChange={(e) => set("check_in_time", e.target.value)} /></Field>
                <Field label="Départ avant" htmlFor="co"><Input id="co" type="time" value={f.check_out_time} onChange={(e) => set("check_out_time", e.target.value)} /></Field>
              </div>
              <Field label="Conditions de réservation et d'annulation" htmlFor="bc">
                <Textarea id="bc" rows={4} value={f.booking_conditions} onChange={(e) => set("booking_conditions", e.target.value)} placeholder="Ex. Acompte de 50 % pour confirmer. Annulation gratuite jusqu'à 48 h avant l'arrivée." />
              </Field>
              <Field label="Règlement intérieur" htmlFor="hr">
                <Textarea id="hr" rows={4} value={f.house_rules} onChange={(e) => set("house_rules", e.target.value)} placeholder="Une règle par ligne" />
              </Field>
            </CardBody>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Statut" actions={<AptStatus s={status} />} />
            <CardBody className="space-y-3 text-[13px]">
              {status === "published" && apartment?.published_at && (
                <p className="text-muted">En ligne depuis la publication du {dateTimeFr(apartment.published_at)}.</p>
              )}
              {status === "draft" && <p className="text-muted">Brouillon : invisible sur le site tant qu&apos;il n&apos;est pas publié.</p>}
              {status === "hidden" && <p className="text-muted">Masqué : retiré du catalogue public. Cliquez sur « Publier » pour le remettre en ligne.</p>}
              {status === "archived" && <p className="text-muted">Archivé : conservé pour l&apos;historique, invisible sur le site.</p>}
              {status === "published" && f.slug && (
                <a href={`/appartements/${apartment?.published?.slug ?? f.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-brand-600 hover:underline">
                  <ExternalLink className="size-3.5" /> Voir sur le site
                </a>
              )}
              {id && (
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {status === "published" && <Button size="sm" onClick={() => onStatus("hidden")} loading={busy === "hidden"}><EyeOff className="size-4" /> Masquer</Button>}
                  {status !== "archived" && <Button size="sm" onClick={() => onStatus("archived")} loading={busy === "archived"}><Archive className="size-4" /> Archiver</Button>}
                  {(status === "archived" || status === "hidden") && <Button size="sm" onClick={() => onStatus("draft")} loading={busy === "draft"}>Repasser en brouillon</Button>}
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /> Supprimer</Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Référencement" />
            <CardBody className="space-y-3">
              {apartment && <div className="text-[13px] text-muted">Identifiant unique : <span className="font-mono font-medium text-ink">{apartment.reference}</span></div>}
              <Field label="Adresse de la page" htmlFor="slug" help={`/appartements/${f.slug || slugify(f.name || "nom")}`}>
                <Input id="slug" value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(f.name || "")} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand-600" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
                Mettre en avant sur la page d&apos;accueil
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Comment ça marche ?" />
            <CardBody className="space-y-2 text-[13px] text-muted">
              <p><strong className="text-ink">Enregistrer</strong> sauvegarde votre travail sans toucher au site public.</p>
              <p><strong className="text-ink">Publier</strong> met en ligne la version enregistrée : le site est mis à jour immédiatement.</p>
              <p><strong className="text-ink">Prévisualiser</strong> montre la page telle qu&apos;elle apparaîtra, avant publication.</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={addMedia} />
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ""} size="xl">
        {preview && (preview.kind === "image"
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] rounded-lg" />
          : <video src={preview.url} controls className="mx-auto max-h-[70vh] rounded-lg" />)}
        {preview && (
          <Field label="Légende (texte alternatif)" htmlFor="cap" className="mt-4">
            <Input id="cap" value={media.find((m) => m.media_id === preview.media_id)?.caption ?? ""}
              onChange={(e) => { const v = e.target.value; setMedia((l) => l.map((m) => (m.media_id === preview.media_id ? { ...m, caption: v } : m))); setDirty(true); }} />
          </Field>
        )}
      </Modal>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={onDelete} danger loading={busy === "delete"}
        title="Supprimer cet appartement ?" confirmLabel="Supprimer définitivement"
        message={<>« {f.name} » sera supprimé définitivement et retiré du site. Les photos restent dans la galerie média. Cette action est irréversible.</>} />
    </>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="grid size-7 place-items-center rounded-md bg-white/95 text-slate-700 shadow-sm hover:bg-white hover:text-ink">
      {children}
    </button>
  );
}
