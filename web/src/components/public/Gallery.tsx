"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import type { PublicMedia } from "@/lib/types";

/** Disposition de la mosaïque selon le nombre de photos (1 à 5), sans case vide. */
function tile(i: number, n: number): string {
  if (n === 1) return "col-span-4 row-span-2";
  if (i === 0) return "col-span-2 row-span-2";
  if (n === 2) return "col-span-2 row-span-2";
  if (n === 3) return "col-span-2";
  if (n === 4 && i === 1) return "col-span-2";
  return "";
}

export function Gallery({ images, name }: { images: PublicMedia[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(null), []);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, images.length, close]);

  if (!images.length) return <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">Photos bientôt disponibles</div>;
  const five = images.slice(0, 5);

  return (
    <>
      {/* Mobile : carrousel */}
      <div className="relative -mx-4 sm:hidden">
        <div ref={track} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {images.map((m, i) => (
            <button key={m.id} className="relative aspect-[4/3] w-full shrink-0 snap-center" onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}`}>
              <Image src={m.url} alt={m.alt || name} fill sizes="100vw" priority={i === 0} className="object-cover" />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs tabular-nums text-white">{idx + 1} / {images.length}</span>
      </div>

      {/* Bureau : mosaïque */}
      <div className="relative hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:grid">
        {five.map((m, i) => (
          <button key={m.id} onClick={() => setOpen(i)} className={`relative overflow-hidden bg-slate-100 ${tile(i, five.length)}`}>
            <Image src={m.url} alt={m.alt || name} fill sizes={i === 0 ? "50vw" : "25vw"} priority={i === 0} className="object-cover transition duration-300 hover:scale-[1.03] hover:brightness-95" />
          </button>
        ))}
        {images.length > 1 && (
          <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-md ring-1 ring-slate-900/10 hover:bg-slate-50">
            <Grid2x2 className="size-4" /> Voir les {images.length} photos
          </button>
        )}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Galerie photos">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm tabular-nums">{open + 1} / {images.length}</span>
            <button onClick={close} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Fermer"><X className="size-5" /></button>
          </div>
          <div className="relative flex-1">
            <Image src={images[open]!.url} alt={images[open]!.alt || name} fill sizes="100vw" className="object-contain" />
            <button onClick={() => setOpen((open - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Précédente"><ChevronLeft /></button>
            <button onClick={() => setOpen((open + 1) % images.length)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Suivante"><ChevronRight /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {images.map((m, i) => (
              <button key={m.id} onClick={() => setOpen(i)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 ${i === open ? "ring-white" : "ring-transparent opacity-60"}`}>
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
