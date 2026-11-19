"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, DoorOpen, Grid2x2, CalendarX, ShieldCheck, X } from "lucide-react";
import type { PublicAmenity, PublicMedia } from "@/lib/types";
import { AmenityIcon } from "@/components/AmenityIcon";
import { ZoomViewer } from "./ZoomViewer";

/* ---------- Feuille plein écran (mobile) / fenêtre (ordinateur) ---------- */
export function Sheet({ open, onClose, title, children, wide, footer }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 hidden bg-black/50 sm:block" onClick={onClose} />
      <div className={`relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[88vh] sm:rounded-2xl sm:shadow-2xl ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"}`}>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:rounded-t-2xl">
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Retour">
            <ChevronLeft className="size-5 sm:hidden" /><X className="hidden size-4 sm:block" />
          </button>
          {title && <span className="flex-1 text-center text-[15px] font-semibold sm:text-left">{title}</span>}
          <span className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-28 pt-4 sm:pb-8">{children}</div>
        {footer}
      </div>
    </div>
  );
}

/* ---------- Galerie + Visite photo pièce par pièce ---------- */
function groupByRoom(images: PublicMedia[]) {
  const map = new Map<string, PublicMedia[]>();
  for (const m of images) {
    const r = m.room?.trim() || "Photos supplémentaires";
    map.set(r, [...(map.get(r) ?? []), m]);
  }
  const extra = map.get("Photos supplémentaires");
  map.delete("Photos supplémentaires");
  if (extra) map.set("Photos supplémentaires", extra);
  return [...map.entries()];
}

function Mosaic({ items, name, onOpen }: { items: PublicMedia[]; name: string; onOpen: (m: PublicMedia) => void }) {
  const chunks: PublicMedia[][] = [];
  for (let i = 0; i < items.length; i += 3) chunks.push(items.slice(i, i + 3));
  return (
    <div className="space-y-2">
      {chunks.map((c, k) => (
        <div key={k} className={`grid gap-2 ${c.length === 1 ? "aspect-[4/3] grid-cols-1" : c.length === 2 ? "aspect-[2/1.2] grid-cols-2" : "aspect-[1.13] grid-cols-[2fr_1fr] grid-rows-2"}`}>
          {c.map((m, i) => (
            <button key={m.id} onClick={() => onOpen(m)} className={`relative overflow-hidden rounded-2xl bg-slate-100 ${c.length === 3 && i === 0 ? "row-span-2" : ""}`}>
              <Image src={m.url} alt={m.alt || name} fill sizes="(max-width: 640px) 70vw, 600px" className="object-cover" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PhotoGallery({ images, name }: { images: PublicMedia[]; name: string }) {
  const [tour, setTour] = useState(false);
  const [zoom, setZoom] = useState<{ list: PublicMedia[]; i: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const rooms = useMemo(() => groupByRoom(images), [images]);
  const ordered = useMemo(() => rooms.flatMap(([, l]) => l), [rooms]);
  const sec = useRef<Record<string, HTMLElement | null>>({});
  const openAt = (m: PublicMedia) => setZoom({ list: ordered, i: Math.max(0, ordered.findIndex((x) => x.id === m.id)) });
  const openPhoto = (k: number) => setZoom({ list: images, i: k });

  if (!images.length) return <div className="grid aspect-[16/9] place-items-center rounded-xl bg-slate-100 text-slate-400">Photos bientôt disponibles</div>;
  const five = images.slice(0, 5);
  const tile = (i: number, n: number) => (n === 1 ? "col-span-4 row-span-2" : i === 0 ? "col-span-2 row-span-2" : n === 2 ? "col-span-2 row-span-2" : n === 3 ? "col-span-2" : n === 4 && i === 1 ? "col-span-2" : "");

  return (
    <>
      <div className="relative -mx-4 sm:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]" onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {images.map((m, i) => (
            <button key={m.id} className="relative aspect-[4/3] w-full shrink-0 snap-center" onClick={() => openPhoto(i)} aria-label={`Photo ${i + 1}`}>
              <Image src={m.url} alt={m.alt || name} fill sizes="100vw" priority={i === 0} className="object-cover" />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs tabular-nums text-white">{idx + 1} / {images.length}</span>
        <button onClick={() => setTour(true)} className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm"><Grid2x2 className="size-3.5" /> Visite photo</button>
      </div>
      <div className="relative hidden h-[440px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:grid">
        {five.map((m, i) => (
          <button key={m.id} onClick={() => openPhoto(i)} aria-label={`Agrandir la photo ${i + 1}`} className={`relative cursor-zoom-in overflow-hidden bg-slate-100 ${tile(i, five.length)}`}>
            <Image src={m.url} alt={m.alt || name} fill sizes={i === 0 ? "50vw" : "25vw"} priority={i === 0} className="object-cover transition hover:brightness-90" />
          </button>
        ))}
        <button onClick={() => setTour(true)} className="absolute bottom-5 right-5 flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-3.5 py-1.5 text-sm font-semibold">
          <Grid2x2 className="size-4" /> Afficher toutes les photos
        </button>
      </div>

      {tour && (
        <div className="site fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label="Visite photo">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3">
            <button onClick={() => setTour(false)} className="grid size-10 place-items-center rounded-full hover:bg-slate-100" aria-label="Retour"><ChevronLeft className="size-6" /></button>
            <span className="text-lg font-semibold">Visite photo</span>
            <span className="w-10" />
          </div>
          <div className="mx-auto max-w-3xl px-6 pb-32">
            <div className="flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none]">
              {rooms.map(([r, l]) => (
                <button key={r} onClick={() => sec.current[r]?.scrollIntoView({ behavior: "smooth", block: "start" })} className="w-28 shrink-0 text-left sm:w-32">
                  <span className="relative block aspect-[1.05] overflow-hidden rounded-xl bg-slate-100">
                    <Image src={l[0]!.url} alt="" fill sizes="128px" className="object-cover" />
                  </span>
                  <span className="mt-2 block text-sm text-slate-600">{r}</span>
                </button>
              ))}
            </div>
            {rooms.map(([r, l]) => (
              <section key={r} ref={(el) => { sec.current[r] = el; }} className="scroll-mt-16 pt-8">
                <h2 className="text-[26px] font-semibold">{r}</h2>
                {/^Chambre/.test(r) ? <p className="mb-5 mt-1 text-slate-600">1 lit</p> : r === "Salon" ? <p className="mb-5 mt-1 text-slate-600">Canapé</p> : <div className="h-4" />}
                <Mosaic items={l} name={name} onOpen={openAt} />
              </section>
            ))}
          </div>
          <a href="#reserver" onClick={() => setTour(false)} className="fixed bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--site-primary)] px-8 py-4 text-base font-semibold text-white shadow-xl">
            Vérifier les disponibilités
          </a>
        </div>
      )}

      {zoom && <ZoomViewer images={zoom.list} index={zoom.i} onClose={() => setZoom(null)} />}
    </>
  );
}

/* ---------- Ce que propose ce logement ---------- */
const CAT_ORDER = ["Salle de bain", "Chambre et linge", "Divertissement", "Chauffage et climatisation", "Internet et bureau", "Cuisine et salle à manger", "Parking et installations", "Services", "Sécurité", "Confort", "Général", "Autres"];

function AmenityRow({ a, big }: { a: PublicAmenity; big?: boolean }) {
  const off = a.included === false;
  return (
    <div className={`flex items-start gap-4 ${big ? "border-b border-slate-200 py-6 last:border-0" : "py-2"}`}>
      <span className="relative mt-0.5 shrink-0">
        <AmenityIcon name={a.icon} className={`size-6 ${off ? "text-slate-400" : "text-slate-900"}`} />
        {off && <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-base ${off ? "text-slate-500 line-through" : ""}`}>{a.name}</span>
        {big && a.description && !off && <span className="mt-0.5 block text-sm text-slate-500">{a.description}</span>}
      </span>
    </div>
  );
}

export function AmenitiesBlock({ amenities }: { amenities: PublicAmenity[] }) {
  const [open, setOpen] = useState(false);
  const inc = amenities.filter((a) => a.included !== false);
  const exc = amenities.filter((a) => a.included === false);
  const preview = [...inc.slice(0, Math.max(5, 10 - Math.min(exc.length, 2))), ...exc.slice(0, 2)].slice(0, 10);
  const groups = CAT_ORDER.concat([...new Set(inc.map((a) => a.category))].filter((c) => !CAT_ORDER.includes(c)))
    .map((c) => [c, inc.filter((a) => a.category === c)] as const).filter(([, l]) => l.length);
  if (!amenities.length) return null;
  return (
    <section className="border-t border-slate-200 py-10">
      <h2 className="text-[22px] font-semibold">Ce que propose ce logement</h2>
      <div className="mt-5 grid gap-x-8 sm:grid-cols-2">{preview.map((a) => <AmenityRow key={a.id} a={a} />)}</div>
      <button onClick={() => setOpen(true)} className="mt-6 w-full rounded-lg bg-slate-100 px-6 py-3.5 text-base font-semibold hover:bg-slate-200 sm:w-auto">
        Afficher les {inc.length} équipements
      </button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-2 text-[26px] font-semibold">Ce que propose ce logement</h2>
        {groups.map(([c, l]) => (
          <div key={c} className="pt-8">
            <h3 className="text-lg font-semibold">{c}</h3>
            <div>{l.map((a) => <AmenityRow key={a.id} a={a} big />)}</div>
          </div>
        ))}
        {exc.length > 0 && (
          <div className="pt-8">
            <h3 className="text-lg font-semibold">Non inclus</h3>
            <div>{exc.map((a) => <AmenityRow key={a.id} a={a} big />)}</div>
          </div>
        )}
      </Sheet>
    </section>
  );
}

/* ---------- À savoir ---------- */
export function GoodToKnow({ checkIn, checkOut, rules, amenities, conditions, cancellation, whatsappLink }: {
  checkIn: string; checkOut: string; rules: string[]; amenities: PublicAmenity[]; conditions: string; cancellation: string; whatsappLink: string | null;
}) {
  const [open, setOpen] = useState<null | "rules" | "safety" | "cancel">(null);
  const has = (n: string) => amenities.some((a) => a.name === n && a.included !== false);
  const selfCheckIn = has("Arrivée autonome") || has("Boîte à clé sécurisée");
  const allRules = [
    `Arrivée à partir de ${checkIn}`, `Départ avant ${checkOut}`,
    ...rules,
    ...(has("Animaux acceptés") ? ["Animaux acceptés"] : []),
    ...(has("Logement fumeur") ? ["Logement fumeur"] : []),
  ];
  const safety = [
    has("Caméras de surveillance extérieures") ? "Caméra de surveillance extérieure présente sur place" : null,
    has("Détecteur de monoxyde de carbone") ? "Détecteur de monoxyde de carbone" : "Aucune indication de la présence d'un détecteur de monoxyde de carbone",
    has("Détecteur de fumée") ? "Détecteur de fumée" : "Aucune indication de la présence d'un détecteur de fumée",
    has("Extincteur") ? "Extincteur" : null,
    has("Kit de premiers secours") ? "Kit de premiers secours" : null,
  ].filter(Boolean) as string[];
  const cancelText = cancellation || conditions;

  const Row = ({ icon, title, lines, onClick }: { icon: React.ReactNode; title: string; lines: string[]; onClick?: () => void }) => {
    const body = (
      <>
        <span className="mt-0.5 shrink-0 text-slate-900">{icon}</span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-base font-semibold">{title}</span>
          {lines.map((l) => <span key={l} className="mt-1 block text-base text-slate-500">{l}</span>)}
        </span>
        {onClick && <ChevronRight className="mt-1 size-5 shrink-0 text-slate-500" />}
      </>
    );
    return onClick
      ? <button onClick={onClick} className="flex w-full items-start gap-5 py-4">{body}</button>
      : <div className="flex items-start gap-5 py-4">{body}</div>;
  };

  return (
    <section className="border-t border-slate-200 py-10">
      <h2 className="mb-2 text-[22px] font-semibold">À savoir</h2>
      <div className="grid sm:grid-cols-2 sm:gap-x-10">
        <Row icon={<DoorOpen className="size-7" strokeWidth={1.4} />} title={`Arrivée : à partir de ${checkIn}`}
          lines={[`Départ avant ${checkOut}`, ...(selfCheckIn ? ["Arrivée autonome - boîte à clé sécurisée"] : [])]} />
        <Row icon={<ClipboardList className="size-7" strokeWidth={1.4} />} title="Règlement intérieur" lines={["Prenez-en connaissance pour un séjour sans encombre."]} onClick={() => setOpen("rules")} />
        <Row icon={<ShieldCheck className="size-7" strokeWidth={1.4} />} title="Sécurité et logement" lines={safety.slice(0, 2)} onClick={() => setOpen("safety")} />
        <Row icon={<CalendarX className="size-7" strokeWidth={1.4} />} title="Conditions d'annulation"
          lines={[cancelText ? cancelText.split("\n")[0]!.slice(0, 120) : "Ajoutez vos dates de voyage pour connaître les conditions d'annulation de ce séjour."]} onClick={() => setOpen("cancel")} />
      </div>
      <Sheet open={open === "rules"} onClose={() => setOpen(null)}>
        <h2 className="text-[26px] font-semibold">Règlement intérieur</h2>
        <p className="mt-2 text-slate-500">Vous séjournerez chez quelqu&apos;un : traitez ce logement avec soin et respect.</p>
        <div className="mt-4">{allRules.map((r) => <div key={r} className="border-b border-slate-200 py-5 text-base last:border-0">{r}</div>)}</div>
      </Sheet>
      <Sheet open={open === "safety"} onClose={() => setOpen(null)}>
        <h2 className="text-[26px] font-semibold">Sécurité et logement</h2>
        <h3 className="mt-6 text-lg font-semibold">Équipements de sécurité</h3>
        <div>{safety.map((r) => <div key={r} className="border-b border-slate-200 py-5 text-base last:border-0">{r}</div>)}</div>
      </Sheet>
      <Sheet open={open === "cancel"} onClose={() => setOpen(null)}>
        <h2 className="text-[26px] font-semibold">Conditions d&apos;annulation</h2>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed">{cancelText || "Les conditions d'annulation vous sont communiquées lors de votre demande de réservation."}</p>
        {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white">Poser la question sur WhatsApp</a>}
      </Sheet>
    </section>
  );
}
