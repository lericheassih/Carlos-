"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Heart, Share } from "lucide-react";
import { fcfa } from "@/lib/format";
import { track } from "@/lib/analytics/client";

export type QuoteEvent = { aptId: string; nights: number; total: number; start: string; end: string; valid: boolean; waLink: string | null };
export const QUOTE_EVENT = "lm:quote";

/** Boutons ronds flottants sur la photo (retour, partager, favori). */
export function FloatingActions({ aptId, name }: { aptId: string; name: string }) {
  const [fav, setFav] = useState(false);
  const [shared, setShared] = useState(false);
  useEffect(() => {
    try { setFav((JSON.parse(localStorage.getItem("lm_fav") || "[]") as string[]).includes(aptId)); } catch {}
  }, [aptId]);
  function toggleFav() {
    try {
      const l = JSON.parse(localStorage.getItem("lm_fav") || "[]") as string[];
      const next = l.includes(aptId) ? l.filter((x) => x !== aptId) : [...l, aptId];
      localStorage.setItem("lm_fav", JSON.stringify(next));
      setFav(next.includes(aptId));
    } catch { setFav((v) => !v); }
  }
  async function share() {
    const url = location.href.split("?")[0]!;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch {}
  }
  const btn = "grid size-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur active:scale-95";
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] sm:hidden">
      <Link href="/appartements" aria-label="Retour aux logements" className={`pointer-events-auto ${btn}`}><ChevronLeft className="size-5" /></Link>
      <div className="pointer-events-auto flex gap-3">
        <button onClick={share} aria-label="Partager" className={btn}>{shared ? <Check className="size-5" /> : <Share className="size-[18px]" />}</button>
        <button onClick={toggleFav} aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={fav} className={btn}>
          <Heart className={`size-5 ${fav ? "fill-[#e11d48] text-[#e11d48]" : ""}`} />
        </button>
      </div>
    </div>
  );
}

function range(a: string, b: string) {
  const d = (s: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...o, timeZone: "UTC" }).format(new Date(s + "T12:00:00Z"));
  return a.slice(0, 7) === b.slice(0, 7) ? `${d(a, { day: "numeric" })}–${d(b, { day: "numeric", month: "short" })}` : `${d(a, { day: "numeric", month: "short" })}–${d(b, { day: "numeric", month: "short" })}`;
}

/** Barre de réservation mobile : prix total des nuits choisies, mis à jour en direct. */
export function MobileBookBar({ aptId, nightPrice, minNights }: { aptId: string; nightPrice: number; minNights: number }) {
  const [q, setQ] = useState<QuoteEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { const d = (e as CustomEvent<QuoteEvent>).detail; if (d.aptId === aptId) setQ(d); };
    window.addEventListener(QUOTE_EVENT, on);
    return () => window.removeEventListener(QUOTE_EVENT, on);
  }, [aptId]);
  const ready = q && q.valid && q.nights > 0;
  return (
    <div id="mobile-book-bar" className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 rounded-t-3xl border-t border-slate-200 bg-white px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="min-w-0 flex-1 leading-tight">
        <div id="mb-price" className="text-[19px] font-semibold tabular-nums underline underline-offset-2">{ready ? fcfa(q.total) : fcfa(nightPrice)}</div>
        <div id="mb-sub" className="mt-0.5 truncate text-sm text-slate-600">{ready ? `Pour ${q.nights} nuit${q.nights > 1 ? "s" : ""} · ${range(q.start, q.end)}` : `par nuit${minNights > 1 ? ` · ${minNights} nuits min.` : ""}`}</div>
        <div className="mt-2 inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs leading-snug">0 FCFA aujourd&apos;hui · Paiement à l&apos;arrivée</div>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <a id="mb-btn" href={ready && q.waLink ? q.waLink : "#reserver"} target={ready ? "_blank" : undefined} rel="noopener noreferrer"
          onClick={() => { if (ready) track("whatsapp_click", { apartment_id: aptId, metadata: { placement: "mobile_bar", nights: q.nights } }); }}
          className="btn-brand rounded-full px-10 py-3.5 text-base font-semibold text-white shadow-sm active:scale-[0.98]">
          {ready ? "Réserver" : "Choisir les dates"}
        </a>
        <span className="mt-1.5 text-[11px] text-slate-500">Confirmation sur WhatsApp</span>
      </div>
    </div>
  );
}
