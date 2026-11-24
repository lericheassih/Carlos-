"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Field, Input, MoneyInput, Select } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { PAY_METHOD_LABELS, type ReservationStatus } from "@/lib/types";
import { dateFr, fcfa } from "@/lib/format";
import { todayIso } from "@/lib/dates";
import { addPayment, deletePayment, deleteReservation, setReservationStatus } from "../actions";

export function StatusActions({ id, status, canDelete }: { id: string; status: ReservationStatus; canDelete: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const go = (s: ReservationStatus) => start(async () => {
    const r = await setReservationStatus(id, s);
    setConfirm(null);
    if (!r.ok) toast.error(r.error); else { toast(r.message!); router.refresh(); }
  });
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && <Button variant="primary" onClick={() => go("confirmed")} loading={pending}><Check className="size-4" /> Confirmer la réservation</Button>}
      {status === "cancelled" && <Button onClick={() => go("pending")} loading={pending}>Réactiver (en attente)</Button>}
      {status !== "cancelled" && status !== "completed" && <Button onClick={() => setConfirm("cancel")}><XCircle className="size-4" /> Annuler</Button>}
      {canDelete && <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm("delete")}><Trash2 className="size-4" /> Supprimer</Button>}
      <ConfirmDialog open={confirm === "cancel"} onClose={() => setConfirm(null)} onConfirm={() => go("cancelled")} loading={pending} danger
        title="Annuler cette réservation ?" message="Les dates seront libérées dans le calendrier et sur le site. Les paiements enregistrés sont conservés." confirmLabel="Annuler la réservation" />
      <ConfirmDialog open={confirm === "delete"} onClose={() => setConfirm(null)} danger loading={pending} title="Supprimer définitivement ?"
        message="La réservation et ses paiements seront supprimés de l'historique. Préférez l'annulation pour garder une trace." confirmLabel="Supprimer"
        onConfirm={() => start(async () => { const r = await deleteReservation(id); if (!r.ok) toast.error(r.error); else { toast(r.message!); router.push("/admin/reservations"); } })} />
    </div>
  );
}

type P = { id: string; amount: number; method: string; paid_at: string; note: string };
export function Payments({ reservationId, payments, total, paid, defaultMethod }: { reservationId: string; payments: P[]; total: number; paid: number; defaultMethod: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ amount: "", method: defaultMethod ?? "cash", paid_at: todayIso(), note: "" });
  const rest = total - paid;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-muted">Total</div><div className="font-semibold tabular-nums">{fcfa(total)}</div></div>
        <div className="rounded-lg bg-emerald-50 p-2"><div className="text-xs text-emerald-700">Versé</div><div className="font-semibold tabular-nums text-emerald-800">{fcfa(paid)}</div></div>
        <div className={`rounded-lg p-2 ${rest > 0 ? "bg-amber-50" : "bg-slate-50"}`}><div className="text-xs text-muted">Reste</div><div className="font-semibold tabular-nums">{fcfa(Math.max(0, rest))}</div></div>
      </div>
      {payments.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1"><span className={`font-medium tabular-nums ${p.amount < 0 ? "text-red-600" : ""}`}>{fcfa(p.amount)}</span> <span className="text-muted">· {PAY_METHOD_LABELS[p.method as keyof typeof PAY_METHOD_LABELS]} · {dateFr(p.paid_at)}</span>{p.note && <div className="text-xs text-muted">{p.note}</div>}</div>
              <button className="text-muted hover:text-red-600" aria-label="Supprimer le paiement" onClick={() => start(async () => { const r = await deletePayment(p.id, reservationId); if (!r.ok) toast.error(r.error); else router.refresh(); })}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid grid-cols-2 gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await addPayment(reservationId, { amount: Number(f.amount), method: f.method, paid_at: f.paid_at, note: f.note });
        if (!r.ok) toast.error(r.error); else { toast(r.message!); setF({ ...f, amount: "", note: "" }); router.refresh(); }
      }); }}>
        <Field label="Montant" htmlFor="pa" help="Négatif = remboursement" className="col-span-2"><MoneyInput id="pa" min={undefined} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder={rest > 0 ? String(rest) : ""} /></Field>
        <Field label="Mode" htmlFor="pmeth"><Select id="pmeth" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{Object.entries(PAY_METHOD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
        <Field label="Date" htmlFor="pdate"><Input id="pdate" type="date" value={f.paid_at} onChange={(e) => setF({ ...f, paid_at: e.target.value })} /></Field>
        <Field label="Note" htmlFor="pnote" className="col-span-2"><Input id="pnote" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ex. Acompte T-Money" /></Field>
        <Button type="submit" className="col-span-2" loading={pending} disabled={!Number(f.amount)}>Enregistrer un paiement</Button>
      </form>
    </div>
  );
}
