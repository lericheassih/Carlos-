"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Minus, Plus } from "lucide-react";
import type { Pricing } from "@/lib/types";
import { quoteStay } from "@/lib/pricing";
import { addDays, diffDays, isIsoDate, parseIso, todayIso, toIso } from "@/lib/dates";
import { dateFr, fcfa, waLink } from "@/lib/format";
import { track } from "@/lib/analytics/client";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { QUOTE_EVENT, type QuoteEvent } from "./MobileStay";

type Range = { start_date: string; end_date: string };
type Props = {
  apartment: { id: string; name: string; pricing: Pricing; max_guests: number };
  whatsapp: string; companyName: string; preview?: boolean;
  initial?: { arrivee?: string; depart?: string; voyageurs?: string };
};

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export function BookingWidget({ apartment, whatsapp, companyName, preview, initial }: Props) {
  const today = todayIso();
  const minN = Math.max(1, apartment.pricing.min_nights || 1);
  const [ranges, setRanges] = useState<Range[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [start, setStart] = useState<string | null>(isIsoDate(initial?.arrivee) && initial!.arrivee! >= today ? initial!.arrivee! : null);
  const [end, setEnd] = useState<string | null>(isIsoDate(initial?.depart) && start && initial!.depart! > start ? initial!.depart! : null);
  const [guests, setGuests] = useState(Math.min(apartment.max_guests, Math.max(1, Number(initial?.voyageurs) || Math.min(2, apartment.max_guests))));
  const [month, setMonth] = useState((start ?? today).slice(0, 7));
  const [started, setStarted] = useState(false);
  const [form, setForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [c, setC] = useState({ full_name: "", phone: "", email: "", message: "", website: "" });

  // Disponibilités en direct (réservations confirmées + dates bloquées)
  useEffect(() => {
    fetch(`/api/availability?apartment=${apartment.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { ranges: Range[] }) => setRanges(j.ranges))
      .catch(() => { setLoadError(true); setRanges([]); });
  }, [apartment.id, done]);

  const busy = useMemo(() => {
    const set = new Set<string>();
    for (const r of ranges ?? []) for (let d = r.start_date; d < r.end_date; d = addDays(d, 1)) set.add(d);
    return set;
  }, [ranges]);

  const rangeFree = (a: string, b: string) => { for (let d = a; d < b; d = addDays(d, 1)) if (busy.has(d)) return false; return true; };
  const conflict = start && end ? !rangeFree(start, end) : false;
  const nights = start && end ? diffDays(start, end) : 0;
  const q = start && end ? quoteStay(apartment.pricing, start, end, guests) : null;
  const valid = !!q && !conflict && nights >= minN && guests <= apartment.max_guests && ranges !== null;

  function pick(d: string) {
    setErr(null);
    if (!started && !preview) { setStarted(true); track("booking_start", { apartment_id: apartment.id }); }
    if (!start || end || d <= start) {
      if (busy.has(d)) return;
      setStart(d); setEnd(null);
      return;
    }
    if (!rangeFree(start, d)) { setErr("Certaines nuits de cette période sont déjà réservées."); setStart(busy.has(d) ? null : d); setEnd(null); return; }
    setEnd(d);
  }

  // Calendrier du mois affiché
  const first = parseIso(month + "-01");
  const lead = (first.getUTCDay() + 6) % 7;
  const dim = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const shift = (n: number) => { const d = new Date(first); d.setUTCMonth(d.getUTCMonth() + n); setMonth(toIso(d).slice(0, 7)); };
  const canPrev = month > today.slice(0, 7);

  const waMsg = [
    `Bonjour ${companyName}, je souhaite réserver :`,
    `🏠 ${apartment.name}`,
    start && end ? `📅 Du ${dateFr(start)} au ${dateFr(end)} (${nights} nuit${nights > 1 ? "s" : ""})` : "📅 Dates : à définir",
    `👥 ${guests} personne${guests > 1 ? "s" : ""}`,
    q ? `💰 Prix estimé : ${fcfa(q.total)}` : "",
    done ? `Référence de ma demande : ${done.reference}` : "",
    "Est-ce disponible ?",
  ].filter(Boolean).join("\n");

  // Informe la barre de réservation mobile (prix total, dates, lien WhatsApp)
  useEffect(() => {
    const detail: QuoteEvent = { aptId: apartment.id, nights, total: q?.total ?? 0, start: start ?? "", end: end ?? "", valid, waLink: whatsapp ? waLink(whatsapp, waMsg) : null };
    window.dispatchEvent(new CustomEvent(QUOTE_EVENT, { detail }));
  }, [apartment.id, nights, q?.total, start, end, valid, whatsapp, waMsg]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) { setErr("Aperçu : l'envoi de demandes est désactivé."); return; }
    if (!valid) return;
    setSending(true); setErr(null);
    try {
      const r = await fetch("/api/booking-request", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ apartment_id: apartment.id, check_in: start, check_out: end, guests, ...c }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error ?? "Envoi impossible."); return; }
      track("booking_request", { apartment_id: apartment.id, metadata: { nights } });
      setDone({ reference: j.reference });
    } catch {
      setErr("Connexion impossible. Vérifiez votre réseau ou écrivez-nous sur WhatsApp.");
    } finally { setSending(false); }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <div>
          <h3 className="text-lg font-semibold">Demande envoyée !</h3>
          <p className="mt-1 text-sm text-slate-600">Référence <strong>{done.reference}</strong>. Nous vous recontactons très vite pour confirmer la disponibilité et l&apos;acompte.</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-left text-sm">
          <div className="flex justify-between"><span>{dateFr(start!)} → {dateFr(end!)}</span><span>{nights} nuit(s)</span></div>
          <div className="mt-1 flex justify-between font-semibold"><span>Total estimé</span><span>{fcfa(q?.total)}</span></div>
        </div>
        {whatsapp && (
          <a href={waLink(whatsapp, waMsg)} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { apartment_id: apartment.id, metadata: { placement: "after_request" } })}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-white"><WhatsAppIcon /> Confirmer sur WhatsApp</a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendrier */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="grid size-9 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-30" aria-label="Mois précédent"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-semibold capitalize">{dateFr(month + "-01", { month: "long", year: "numeric" })}</span>
          <button type="button" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Mois suivant"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEK.map((w, i) => <span key={i} className="py-1 text-[11px] font-medium text-slate-400">{w}</span>)}
          {Array.from({ length: lead }).map((_, i) => <span key={`l${i}`} />)}
          {Array.from({ length: dim }).map((_, i) => {
            const d = `${month}-${String(i + 1).padStart(2, "0")}`;
            const past = d < today;
            const taken = busy.has(d);
            const choosingEnd = !!start && !end && d > start;
            const disabled = past || (taken && !(choosingEnd && rangeFree(start!, d)));
            const sel = d === start || d === end;
            const inRange = start && end && d > start && d < end;
            return (
              <button key={d} type="button" disabled={disabled || ranges === null} onClick={() => pick(d)}
                className={`mx-auto grid size-10 place-items-center rounded-full text-sm tabular-nums transition
                  ${sel ? "bg-slate-900 font-semibold text-white" : inRange ? "rounded-none bg-slate-100" : "hover:ring-1 hover:ring-slate-900"}
                  ${disabled ? "cursor-not-allowed text-slate-300 line-through hover:bg-transparent" : ""}`}
                aria-label={`${dateFr(d)}${taken ? " (indisponible)" : ""}`} aria-pressed={sel}>
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-slate-900" /> Sélection</span>
          <span className="flex items-center gap-1"><span className="text-slate-300 line-through">12</span> Indisponible</span>
          {ranges === null && <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Vérification…</span>}
        </div>
        {loadError && <p className="mt-2 text-xs text-amber-700">Disponibilités momentanément indisponibles : nous confirmerons sur WhatsApp.</p>}
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-400 text-sm">
        <div className="border-r border-slate-200 p-3"><div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Arrivée</div><div className="mt-0.5 font-medium">{start ? dateFr(start) : "—"}</div></div>
        <div className="p-3"><div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Départ</div><div className="mt-0.5 font-medium">{end ? dateFr(end) : "—"}</div></div>
        <div className="col-span-2 flex items-center justify-between border-t border-slate-200 p-3">
          <div><div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Personnes</div><div className="text-xs text-slate-500">max. {apartment.max_guests}</div></div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid size-8 place-items-center rounded-full border border-slate-300 disabled:opacity-30" disabled={guests <= 1} aria-label="Moins"><Minus className="size-4" /></button>
            <span className="w-5 text-center font-semibold tabular-nums">{guests}</span>
            <button type="button" onClick={() => setGuests((g) => Math.min(apartment.max_guests, g + 1))} className="grid size-8 place-items-center rounded-full border border-slate-300 disabled:opacity-30" disabled={guests >= apartment.max_guests} aria-label="Plus"><Plus className="size-4" /></button>
          </div>
        </div>
      </div>

      {!start && <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="size-4" /> Choisissez votre date d&apos;arrivée{minN > 1 ? ` (${minN} nuits minimum)` : ""}.</p>}
      {start && !end && <p className="text-sm text-slate-500">Choisissez maintenant votre date de départ.</p>}
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
      {q && nights < minN && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Séjour minimum : {minN} nuits.</p>}

      {q && nights > 0 && (
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">{nights} nuit{nights > 1 ? "s" : ""}</span><span className="tabular-nums">{fcfa(q.baseTotal)}</span></div>
          {q.savings > 0 && <div className="flex justify-between text-emerald-700"><span>{q.usesMonthly ? "Tarif mensuel" : q.usesWeekly ? "Tarif longue durée" : apartment.pricing.promo_label || "Promotion"}</span><span className="tabular-nums">−{fcfa(q.savings)}</span></div>}
          {q.fees.map((f) => <div key={f.label} className="flex justify-between"><span className="text-slate-600">{f.label}</span><span className="tabular-nums">{fcfa(f.amount)}</span></div>)}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total estimé</span><span className="tabular-nums">{fcfa(q.total)}</span></div>
        </div>
      )}

      {whatsapp && (
        <a href={valid ? waLink(whatsapp, waMsg) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!valid}
          onClick={(e) => { if (!valid) { e.preventDefault(); setErr(start && end ? null : "Sélectionnez vos dates d'arrivée et de départ."); return; } if (!preview) track("whatsapp_click", { apartment_id: apartment.id, metadata: { placement: "booking", nights } }); }}
          className={`flex h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold text-white transition ${valid ? "btn-brand" : "cursor-not-allowed bg-slate-300"}`}>
          <WhatsAppIcon /> Réserver
        </a>
      )}

      {!form ? (
        <button type="button" disabled={!valid} onClick={() => setForm(true)} className="w-full rounded-lg border border-slate-900 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-40">
          Envoyer une demande de réservation
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={c.website} onChange={(e) => setC({ ...c, website: e.target.value })} />
          <label className="block text-sm"><span className="mb-1 block font-medium">Nom complet *</span>
            <input required minLength={2} autoComplete="name" value={c.full_name} onChange={(e) => setC({ ...c, full_name: e.target.value })} className="h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium">Téléphone / WhatsApp *</span>
            <input required type="tel" minLength={8} autoComplete="tel" placeholder="+228 90 00 00 00" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className="h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium">E-mail</span>
            <input type="email" autoComplete="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className="h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium">Message</span>
            <textarea rows={2} value={c.message} onChange={(e) => setC({ ...c, message: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button disabled={sending || !valid} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg btn-brand font-semibold disabled:opacity-50">
            {sending && <Loader2 className="size-4 animate-spin" />} Envoyer ma demande
          </button>
          <p className="text-[11px] text-slate-500">Vos coordonnées servent uniquement à traiter votre réservation.</p>
        </form>
      )}
      <p className="text-center text-sm text-slate-500">Confirmation sur WhatsApp · aucun montant débité pour le moment</p>
    </div>
  );
}
