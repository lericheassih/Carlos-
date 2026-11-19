"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Search, UserPlus, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { dateFr, fcfa } from "@/lib/format";
import { diffDays } from "@/lib/dates";
import { PAY_METHOD_LABELS, RES_STATUS_LABELS, SOURCE_LABELS, type ReservationStatus } from "@/lib/types";
import { checkStay, saveReservation, searchCustomers } from "./actions";

type Apt = { id: string; name: string; status: string };
type Cust = { id: string; full_name: string; phone: string | null; whatsapp: string | null; email: string | null };
export type ReservationInitial = {
  id: string | null; customer: Cust | null; apartment_id: string; check_in: string; check_out: string; guests: number;
  price_per_night: number; extra_fees: number; discount: number; total_amount: number; payment_method: string | null;
  status: ReservationStatus; source: string; notes: string;
};
type Check = Awaited<ReturnType<typeof checkStay>>;

export function ReservationForm({ apartments, initial }: { apartments: Apt[]; initial: ReservationInitial }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [v, setV] = useState(initial);
  const [cust, setCust] = useState<Cust | null>(initial.customer);
  const [newCust, setNewCust] = useState({ full_name: initial.customer?.full_name ?? "", phone: initial.customer?.phone ?? "", whatsapp: initial.customer?.whatsapp ?? "", email: initial.customer?.email ?? "" });
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Cust[]>([]);
  const [auto, setAuto] = useState(isNew);
  const [check, setCheck] = useState<Check>(null);
  const [advance, setAdvance] = useState("");
  const [pending, start] = useTransition();
  const ticket = useRef(0);

  const set = <K extends keyof ReservationInitial>(k: K, val: ReservationInitial[K]) => setV((s) => ({ ...s, [k]: val }));
  const nights = v.check_in && v.check_out ? diffDays(v.check_in, v.check_out) : 0;

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(async () => setFound(await searchCustomers(q)), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!v.apartment_id || !v.check_in || !v.check_out || v.check_out <= v.check_in) { setCheck(null); return; }
    const my = ++ticket.current;
    const t = setTimeout(async () => {
      const r = await checkStay(v.apartment_id, v.check_in, v.check_out, v.guests, initial.id);
      if (my !== ticket.current) return;
      setCheck(r);
      if (r && auto) {
        setV((s) => ({ ...s, price_per_night: r.quote.avgPerNight, extra_fees: r.quote.feesTotal, total_amount: Math.max(0, r.quote.stayTotal + r.quote.feesTotal - s.discount) }));
      }
    }, 250);
    return () => clearTimeout(t);
  }, [v.apartment_id, v.check_in, v.check_out, v.guests, auto, initial.id]);

  function recompute(next: Partial<ReservationInitial>) {
    setV((s) => {
      const m = { ...s, ...next };
      const n = m.check_in && m.check_out ? Math.max(0, diffDays(m.check_in, m.check_out)) : 0;
      return { ...m, total_amount: Math.max(0, m.price_per_night * n + m.extra_fees - m.discount) };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveReservation(initial.id, {
        customer_id: cust?.id ?? null,
        customer: newCust,
        apartment_id: v.apartment_id, check_in: v.check_in, check_out: v.check_out, guests: v.guests,
        price_per_night: v.price_per_night, extra_fees: v.extra_fees, discount: v.discount, total_amount: v.total_amount,
        payment_method: v.payment_method || null, status: v.status, source: v.source, notes: v.notes,
        initial_payment: Number(advance) || 0,
      });
      if (!r.ok) return toast.error(r.error);
      toast(r.message!);
      if (isNew) router.push(`/admin/reservations/${r.data!.id}`);
      else router.refresh();
    });
  }

  const activeConflicts = check?.conflicts.filter((c) => c.status !== "pending") ?? [];
  const pendingConflicts = check?.conflicts.filter((c) => c.status === "pending") ?? [];
  const wantsBlocking = ["confirmed", "in_progress"].includes(v.status);

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Client" />
          <CardBody className="space-y-3">
            {!cust && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Rechercher un client existant (nom, téléphone, e-mail)…" value={q} onChange={(e) => setQ(e.target.value)} />
                {found.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-lg">
                    {found.map((c) => (
                      <button type="button" key={c.id} onClick={() => { setCust(c); setNewCust({ full_name: c.full_name, phone: c.phone ?? "", whatsapp: c.whatsapp ?? "", email: c.email ?? "" }); setQ(""); setFound([]); }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                        <span className="font-medium">{c.full_name}</span> <span className="text-muted">{c.whatsapp || c.phone || c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {cust && (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
                <span>Client existant : <strong>{cust.full_name}</strong></span>
                <button type="button" onClick={() => { setCust(null); setNewCust({ full_name: "", phone: "", whatsapp: "", email: "" }); }} className="text-muted hover:text-ink" aria-label="Changer de client"><X className="size-4" /></button>
              </div>
            )}
            {!cust && <p className="flex items-center gap-1.5 text-xs text-muted"><UserPlus className="size-3.5" /> Ou saisissez un nouveau client :</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom complet" htmlFor="cn" required><Input id="cn" required value={newCust.full_name} onChange={(e) => setNewCust({ ...newCust, full_name: e.target.value })} /></Field>
              <Field label="Téléphone" htmlFor="cp"><Input id="cp" type="tel" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} placeholder="+228…" /></Field>
              <Field label="WhatsApp" htmlFor="cw"><Input id="cw" type="tel" value={newCust.whatsapp} onChange={(e) => setNewCust({ ...newCust, whatsapp: e.target.value })} placeholder="+228…" /></Field>
              <Field label="E-mail" htmlFor="ce"><Input id="ce" type="email" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} /></Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Séjour" />
          <CardBody className="space-y-3">
            <Field label="Appartement" htmlFor="apt" required>
              <Select id="apt" required value={v.apartment_id} onChange={(e) => set("apartment_id", e.target.value)}>
                <option value="">Choisir…</option>
                {apartments.map((a) => <option key={a.id} value={a.id}>{a.name}{a.status !== "published" ? ` (${a.status === "draft" ? "brouillon" : a.status === "hidden" ? "masqué" : "archivé"})` : ""}</option>)}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Arrivée" htmlFor="ci" required><Input id="ci" type="date" required value={v.check_in} onChange={(e) => set("check_in", e.target.value)} /></Field>
              <Field label="Départ" htmlFor="co" required><Input id="co" type="date" required min={v.check_in} value={v.check_out} onChange={(e) => set("check_out", e.target.value)} /></Field>
              <Field label="Personnes" htmlFor="g"><Input id="g" type="number" min={1} value={v.guests} onChange={(e) => set("guests", Math.max(1, Number(e.target.value)))} /></Field>
            </div>
            {nights > 0 && <p className="text-[13px] text-muted">{nights} nuit{nights > 1 ? "s" : ""}{check && nights < check.minNights ? ` · minimum habituel : ${check.minNights}` : ""}{check && v.guests > check.maxGuests ? ` · capacité max : ${check.maxGuests}` : ""}</p>}
            {(check?.blocks.length ?? 0) > 0 && (
              <Alert tone="danger">Dates bloquées sur cette période : {check!.blocks.map((b) => `${dateFr(b.start_date)} → ${dateFr(b.end_date)}${b.reason ? ` (${b.reason})` : ""}`).join(", ")}</Alert>
            )}
            {activeConflicts.length > 0 && (
              <Alert tone="danger">Déjà réservé : {activeConflicts.map((c) => `${c.reference} · ${c.name} (${dateFr(c.check_in)} → ${dateFr(c.check_out)})`).join(" ; ")}. {wantsBlocking ? "La confirmation sera refusée." : ""}</Alert>
            )}
            {pendingConflicts.length > 0 && (
              <Alert tone="warning">Autre(s) demande(s) en attente sur ces dates : {pendingConflicts.map((c) => `${c.reference} · ${c.name}`).join(" ; ")}.</Alert>
            )}
            {check && !activeConflicts.length && !check.blocks.length && <p className="text-[13px] font-medium text-emerald-700">✓ Dates disponibles</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Montants" actions={<label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-brand-600" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Calcul automatique</label>} />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            <Field label="Prix par nuit" htmlFor="ppn"><MoneyInput id="ppn" value={v.price_per_night} onChange={(e) => { setAuto(false); recompute({ price_per_night: Number(e.target.value) }); }} /></Field>
            <Field label="Frais supplémentaires" htmlFor="fees"><MoneyInput id="fees" value={v.extra_fees} onChange={(e) => { setAuto(false); recompute({ extra_fees: Number(e.target.value) }); }} /></Field>
            <Field label="Remise" htmlFor="disc"><MoneyInput id="disc" value={v.discount} onChange={(e) => recompute({ discount: Number(e.target.value) })} /></Field>
            <Field label="Montant total" htmlFor="tot" help="Modifiable manuellement"><MoneyInput id="tot" value={v.total_amount} onChange={(e) => { setAuto(false); set("total_amount", Number(e.target.value)); }} /></Field>
            {isNew && <Field label="Avance versée" htmlFor="adv" help="Enregistrée comme premier paiement"><MoneyInput id="adv" value={advance} onChange={(e) => setAdvance(e.target.value)} /></Field>}
            <Field label="Mode de paiement" htmlFor="pm">
              <Select id="pm" value={v.payment_method ?? ""} onChange={(e) => set("payment_method", e.target.value || null)}>
                <option value="">—</option>
                {Object.entries(PAY_METHOD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Statut" />
          <CardBody className="space-y-3">
            <Field label="Statut de la réservation" htmlFor="st">
              <Select id="st" value={v.status} onChange={(e) => set("status", e.target.value as ReservationStatus)}>
                {Object.entries(RES_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Origine" htmlFor="src">
              <Select id="src" value={v.source} onChange={(e) => set("source", e.target.value)}>
                {Object.entries(SOURCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Notes internes" htmlFor="notes"><Textarea id="notes" rows={4} value={v.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Total</span><strong className="tabular-nums">{fcfa(v.total_amount)}</strong></div>
            {isNew && <div className="flex justify-between"><span className="text-muted">Reste à payer</span><span className="tabular-nums">{fcfa(Math.max(0, v.total_amount - (Number(advance) || 0)))}</span></div>}
            <Button type="submit" variant="primary" className="mt-2 w-full" loading={pending}>{isNew ? "Créer la réservation" : "Enregistrer"}</Button>
          </CardBody>
        </Card>
      </div>
    </form>
  );
}

function Alert({ tone, children }: { tone: "danger" | "warning"; children: React.ReactNode }) {
  return (
    <p className={`flex gap-2 rounded-lg px-3 py-2 text-[13px] ${tone === "danger" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{children}</span>
    </p>
  );
}
