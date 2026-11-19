"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { ResStatus } from "@/components/admin/StatusBadges";
import { addDays, diffDays, parseIso, toIso, todayIso } from "@/lib/dates";
import { dateFr, fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ReservationStatus } from "@/lib/types";
import { blockDates, moveReservation, unblock } from "./actions";

type Apt = { id: string; name: string; status?: string; reference?: string };
type Res = { id: string; reference: string; apartment_id: string; check_in: string; check_out: string; status: ReservationStatus; guests: number; total_amount: number; customer: { full_name: string } | null };
type Block = { id: string; apartment_id: string; start_date: string; end_date: string; reason: string };

const COLORS: Record<string, string> = {
  confirmed: "bg-[#2a78d6] text-white",
  in_progress: "bg-[#1d4f9a] text-white",
  completed: "bg-slate-400 text-white",
  pending: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-400 [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(217,119,6,0.18)_6px_8px)]",
};

export function CalendarBoard({ view, from, to, anchor, apartmentFilter, apartments, allApartments, reservations, blocks }: {
  view: "week" | "month"; from: string; to: string; anchor: string; apartmentFilter: string;
  apartments: Apt[]; allApartments: Apt[]; reservations: Res[]; blocks: Block[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<{ apt: string; start: string; end?: string } | null>(null);
  const [selRes, setSelRes] = useState<Res | null>(null);
  const [selBlock, setSelBlock] = useState<Block | null>(null);
  const [reason, setReason] = useState("");
  const [move, setMove] = useState({ check_in: "", check_out: "", apartment_id: "" });
  const today = todayIso();
  const days = useMemo(() => Array.from({ length: diffDays(from, to) }, (_, i) => addDays(from, i)), [from, to]);
  const cellW = view === "week" ? 120 : 40;

  const nav = (dir: number) => {
    const d = parseIso(anchor);
    if (view === "week") d.setUTCDate(d.getUTCDate() + 7 * dir); else { d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + dir); }
    return url({ date: toIso(d) });
  };
  function url(p: Partial<{ date: string; vue: string; appartement: string }>) {
    const u = new URLSearchParams();
    u.set("vue", p.vue ?? (view === "week" ? "semaine" : "mois"));
    u.set("date", p.date ?? anchor);
    const a = p.appartement ?? apartmentFilter;
    if (a) u.set("appartement", a);
    return `/admin/calendrier?${u}`;
  }

  const occupied = (apt: string, d: string) =>
    reservations.some((r) => r.apartment_id === apt && r.check_in <= d && d < r.check_out && r.status !== "pending") ||
    blocks.some((b) => b.apartment_id === apt && b.start_date <= d && d < b.end_date);

  function clickCell(apt: string, d: string) {
    if (occupied(apt, d)) return;
    if (!sel || sel.apt !== apt || sel.end || d < sel.start) { setSel({ apt, start: d }); return; }
    let end = addDays(d, 1);
    for (let x = sel.start; x < end; x = addDays(x, 1)) if (occupied(apt, x)) { end = x; break; }
    setSel({ ...sel, end });
  }
  const inSel = (apt: string, d: string) => !!sel && sel.apt === apt && (sel.end ? d >= sel.start && d < sel.end : d === sel.start);

  const doBlock = () => start(async () => {
    if (!sel?.end) return;
    const r = await blockDates([sel.apt], sel.start, sel.end, reason);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); setSel(null); setReason(""); router.refresh(); }
  });
  const doUnblock = (id: string) => start(async () => {
    const r = await unblock(id);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); setSelBlock(null); router.refresh(); }
  });
  const doMove = () => start(async () => {
    if (!selRes) return;
    const r = await moveReservation(selRes.id, move.check_in, move.check_out, move.apartment_id);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); setSelRes(null); router.refresh(); }
  });

  // Placement des barres (réservations et blocages) dans la grille
  function bars(apt: string) {
    const items: { key: string; left: number; width: number; cls: string; label: string; onClick: () => void }[] = [];
    const place = (s: string, e: string) => {
      const a = Math.max(0, diffDays(from, s)), b = Math.min(days.length, diffDays(from, e));
      return { left: a * cellW + 2, width: Math.max(0, (b - a) * cellW - 4), clippedStart: s < from };
    };
    reservations.filter((r) => r.apartment_id === apt).forEach((r) => {
      const p = place(r.check_in, r.check_out);
      if (p.width <= 0) return;
      items.push({ key: r.id, left: p.left + (p.clippedStart ? 0 : cellW / 2 - 2), width: p.width - (p.clippedStart ? 0 : cellW / 2 - 2) + cellW / 2, cls: COLORS[r.status] ?? COLORS.confirmed!,
        label: `${r.customer?.full_name ?? ""} · ${r.reference}`, onClick: () => { setSelRes(r); setMove({ check_in: r.check_in, check_out: r.check_out, apartment_id: r.apartment_id }); } });
    });
    blocks.filter((b) => b.apartment_id === apt).forEach((b) => {
      const p = place(b.start_date, b.end_date);
      if (p.width <= 0) return;
      items.push({ key: b.id, left: p.left, width: p.width, cls: "bg-slate-200 text-slate-600 [background-image:repeating-linear-gradient(45deg,transparent_0_5px,rgba(100,116,139,0.25)_5px_7px)]",
        label: b.reason || "Bloqué", onClick: () => setSelBlock(b) });
    });
    return items;
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-line bg-white">
          <Link href={nav(-1)} className="grid size-9 place-items-center hover:bg-slate-50" aria-label="Précédent"><ChevronLeft className="size-4" /></Link>
          <Link href={url({ date: today })} className="px-3 text-sm font-medium hover:bg-slate-50">Aujourd&apos;hui</Link>
          <Link href={nav(1)} className="grid size-9 place-items-center hover:bg-slate-50" aria-label="Suivant"><ChevronRight className="size-4" /></Link>
        </div>
        <h2 className="text-[15px] font-semibold capitalize">
          {view === "month" ? dateFr(from, { month: "long", year: "numeric" }) : `${dateFr(from, { day: "numeric", month: "short" })} – ${dateFr(addDays(to, -1))}`}
        </h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <select className="input w-auto" value={apartmentFilter} onChange={(e) => router.push(url({ appartement: e.target.value }))}>
            <option value="">Tous les appartements</option>
            {allApartments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-line bg-white p-0.5 text-sm">
            <Link href={url({ vue: "mois" })} className={cn("rounded-md px-3 py-1.5", view === "month" && "bg-ink text-white")}>Mois</Link>
            <Link href={url({ vue: "semaine" })} className={cn("rounded-md px-3 py-1.5", view === "week" && "bg-ink text-white")}>Semaine</Link>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
        <Legend cls={COLORS.confirmed!} label="Confirmée" /><Legend cls={COLORS.in_progress!} label="En cours" /><Legend cls={COLORS.pending!} label="En attente" />
        <Legend cls="bg-slate-200 [background-image:repeating-linear-gradient(45deg,transparent_0_5px,rgba(100,116,139,0.25)_5px_7px)]" label="Bloquée" />
        <Legend cls="bg-white ring-1 ring-inset ring-line" label="Disponible" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ width: 180 + days.length * cellW }}>
            <div className="sticky top-0 flex border-b border-line bg-slate-50 text-[11px] text-muted">
              <div className="sticky left-0 z-10 w-[180px] shrink-0 border-r border-line bg-slate-50 px-3 py-2 font-medium">Appartement</div>
              {days.map((d) => {
                const dt = parseIso(d); const we = dt.getUTCDay() === 0 || dt.getUTCDay() === 6;
                return (
                  <div key={d} style={{ width: cellW }} className={cn("shrink-0 py-1.5 text-center", we && "bg-slate-100", d === today && "bg-brand-50 font-semibold text-brand-700")}>
                    <div>{dateFr(d, { weekday: "narrow" })}</div><div className="text-[13px] text-ink">{dt.getUTCDate()}</div>
                  </div>
                );
              })}
            </div>
            {apartments.length === 0 && <p className="p-6 text-sm text-muted">Aucun appartement.</p>}
            {apartments.map((a) => (
              <div key={a.id} className="flex border-b border-line last:border-0">
                <Link href={`/admin/appartements/${a.id}`} className="sticky left-0 z-10 w-[180px] shrink-0 truncate border-r border-line bg-white px-3 py-3 text-[13px] font-medium hover:text-brand-600">{a.name}</Link>
                <div className="relative flex">
                  {days.map((d) => (
                    <button key={d} type="button" style={{ width: cellW }} onClick={() => clickCell(a.id, d)}
                      className={cn("h-12 shrink-0 border-r border-line/60 transition", d < today && "bg-slate-50/80", inSel(a.id, d) ? "bg-brand-100" : "hover:bg-brand-50")}
                      aria-label={`${a.name} ${dateFr(d)}`} />
                  ))}
                  {bars(a.id).map((b) => (
                    <button key={b.key} type="button" onClick={b.onClick} title={b.label}
                      style={{ left: b.left, width: b.width }} className={cn("absolute top-2 flex h-8 items-center overflow-hidden rounded-md px-2 text-left text-[11px] font-medium shadow-sm", b.cls)}>
                      <span className="truncate">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {sel && !sel.end && <p className="mt-3 text-sm text-muted">Début : {dateFr(sel.start)} — cliquez sur la dernière nuit de la période. <button className="text-brand-600 underline" onClick={() => setSel(null)}>Annuler</button></p>}

      <Modal open={!!sel?.end} onClose={() => setSel(null)} title="Période sélectionnée" size="sm"
        footer={<>
          <ButtonLink href={`/admin/reservations/nouvelle?appartement=${sel?.apt}&arrivee=${sel?.start}&depart=${sel?.end}`}>Créer une réservation</ButtonLink>
          <Button variant="primary" onClick={doBlock} loading={pending}><Lock className="size-4" /> Bloquer ces dates</Button>
        </>}>
        {sel?.end && (
          <div className="space-y-3 text-sm">
            <p><strong>{apartments.find((a) => a.id === sel.apt)?.name}</strong><br />Du {dateFr(sel.start)} au {dateFr(sel.end)} ({diffDays(sel.start, sel.end)} nuit(s))</p>
            <Field label="Motif du blocage (interne)" htmlFor="reason"><Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. travaux, usage personnel…" /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!selBlock} onClose={() => setSelBlock(null)} title="Dates bloquées" size="sm"
        footer={<Button variant="danger" onClick={() => selBlock && doUnblock(selBlock.id)} loading={pending}>Débloquer</Button>}>
        {selBlock && <p className="text-sm">Du {dateFr(selBlock.start_date)} au {dateFr(selBlock.end_date)}{selBlock.reason ? ` — ${selBlock.reason}` : ""}</p>}
      </Modal>

      <Modal open={!!selRes} onClose={() => setSelRes(null)} title={`Réservation ${selRes?.reference ?? ""}`}
        footer={<>
          <ButtonLink href={`/admin/reservations/${selRes?.id}`}>Ouvrir la fiche</ButtonLink>
          <Button variant="primary" onClick={doMove} loading={pending}>Modifier les dates</Button>
        </>}>
        {selRes && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><strong>{selRes.customer?.full_name}</strong><ResStatus s={selRes.status} /></div>
            <p className="text-muted">{selRes.guests} pers. · {fcfa(selRes.total_amount)}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Arrivée" htmlFor="mi"><Input id="mi" type="date" value={move.check_in} onChange={(e) => setMove({ ...move, check_in: e.target.value })} /></Field>
              <Field label="Départ" htmlFor="mo"><Input id="mo" type="date" value={move.check_out} onChange={(e) => setMove({ ...move, check_out: e.target.value })} /></Field>
            </div>
            <Field label="Appartement" htmlFor="ma">
              <Select id="ma" value={move.apartment_id} onChange={(e) => setMove({ ...move, apartment_id: e.target.value })}>
                {allApartments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-3 w-5 rounded", cls)} />{label}</span>;
}
