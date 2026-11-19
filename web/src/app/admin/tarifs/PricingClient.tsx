"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { AptStatus } from "@/components/admin/StatusBadges";
import { dateFr, fcfa } from "@/lib/format";
import type { ApartmentStatus } from "@/lib/types";
import { quickUpdatePricing } from "../appartements/actions";
import { blockDates, unblock } from "../calendrier/actions";

type Row = { id: string; name: string; status: ApartmentStatus; price_night: number; price_week: number | null; price_month: number | null; promo_price_night: number | null; min_nights: number; published_price: number | null };

export function PricingTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader title="Grille tarifaire (FCFA)" description="« Enregistrer et publier » met à jour le site immédiatement pour les appartements publiés." />
      <div className="mt-3 overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Appartement</th><th>Nuit</th><th>Semaine</th><th>Mois</th><th>Promo / nuit</th><th>Min. nuits</th><th></th></tr></thead>
          <tbody>{rows.map((r) => <PriceRow key={r.id} r={r} />)}</tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-muted">Aucun appartement.</p>}
      </div>
    </Card>
  );
}

function PriceRow({ r }: { r: Row }) {
  const router = useRouter();
  const [v, setV] = useState({ price_night: String(r.price_night || ""), price_week: r.price_week?.toString() ?? "", price_month: r.price_month?.toString() ?? "", promo_price_night: r.promo_price_night?.toString() ?? "", min_nights: String(r.min_nights) });
  const [pending, start] = useTransition();
  const dirty = v.price_night !== String(r.price_night || "") || v.price_week !== (r.price_week?.toString() ?? "") || v.price_month !== (r.price_month?.toString() ?? "") || v.promo_price_night !== (r.promo_price_night?.toString() ?? "") || v.min_nights !== String(r.min_nights);
  const n = (s: string) => (s.trim() === "" ? null : Number(s));
  const save = (publish: boolean) => start(async () => {
    const res = await quickUpdatePricing(r.id, { price_night: Number(v.price_night), price_week: n(v.price_week), price_month: n(v.price_month), promo_price_night: n(v.promo_price_night), min_nights: Number(v.min_nights) }, publish);
    if (!res.ok) toast.error(res.error); else { toast(res.message ?? "Enregistré."); router.refresh(); }
  });
  const inp = (k: keyof typeof v, w = "w-28") => <input className={`input ${w} tabular-nums`} type="number" min={0} step={k === "min_nights" ? 1 : 500} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-label={k} />;
  const outdated = r.status === "published" && r.published_price !== null && r.published_price !== r.price_night;
  return (
    <tr>
      <td className="min-w-48"><div className="font-medium">{r.name}</div><div className="mt-1 flex items-center gap-2"><AptStatus s={r.status} />{outdated && <span className="text-[11px] text-amber-700">En ligne : {fcfa(r.published_price)}</span>}</div></td>
      <td>{inp("price_night")}</td><td>{inp("price_week")}</td><td>{inp("price_month")}</td><td>{inp("promo_price_night")}</td><td>{inp("min_nights", "w-20")}</td>
      <td className="whitespace-nowrap">
        <div className="flex gap-1.5">
          <Button size="sm" disabled={!dirty} loading={pending} onClick={() => save(false)}>Enregistrer</Button>
          {r.status === "published" && <Button size="sm" variant="primary" disabled={!dirty && !outdated} loading={pending} onClick={() => save(true)}>Enregistrer et publier</Button>}
        </div>
      </td>
    </tr>
  );
}

type Block = { id: string; apartment_id: string; start_date: string; end_date: string; reason: string };
export function BlocksManager({ apartments, blocks }: { apartments: { id: string; name: string }[]; blocks: Block[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ ids: [] as string[], start: "", end: "", reason: "" });
  return (
    <Card>
      <CardHeader title="Périodes bloquées" description="Les dates bloquées ne sont plus réservables sur le site (la date de fin est exclue, comme une date de départ)." />
      <CardBody className="space-y-4">
        <form className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-[1fr_150px_150px_1fr_auto] md:items-end" onSubmit={(e) => { e.preventDefault(); start(async () => {
          const r = await blockDates(f.ids, f.start, f.end, f.reason);
          if (!r.ok) toast.error(r.error); else { toast(r.message!); setF({ ids: [], start: "", end: "", reason: "" }); router.refresh(); }
        }); }}>
          <Field label="Appartements" htmlFor="bids">
            <select id="bids" multiple className="input h-24" value={f.ids} onChange={(e) => setF({ ...f, ids: Array.from(e.target.selectedOptions).map((o) => o.value) })}>
              {apartments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Du" htmlFor="bs"><Input id="bs" type="date" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
          <Field label="Au (exclu)" htmlFor="be"><Input id="be" type="date" required min={f.start} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
          <Field label="Motif" htmlFor="br"><Input id="br" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
          <Button type="submit" variant="primary" loading={pending} disabled={!f.ids.length}>Bloquer</Button>
        </form>
        {blocks.length === 0 ? <p className="text-sm text-muted">Aucune période bloquée à venir.</p> : (
          <ul className="divide-y divide-line rounded-lg border border-line text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1"><span className="font-medium">{apartments.find((a) => a.id === b.apartment_id)?.name}</span> · {dateFr(b.start_date)} → {dateFr(b.end_date)}{b.reason && <span className="text-muted"> · {b.reason}</span>}</div>
                <Button size="sm" variant="ghost" onClick={() => start(async () => { const r = await unblock(b.id); if (!r.ok) toast.error(r.error); else { toast(r.message!); router.refresh(); } })}><Trash2 className="size-4" /> Débloquer</Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
