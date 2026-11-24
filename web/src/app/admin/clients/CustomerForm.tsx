"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import { deleteCustomer, saveCustomer } from "./actions";

type C = { full_name: string; phone: string; whatsapp: string; email: string; country: string; notes: string };
export function CustomerForm({ id, initial, canDelete }: { id: string | null; initial: C; canDelete?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await saveCustomer(id, v);
      if (!r.ok) return toast.error(r.error);
      toast(r.message!);
      if (!id) router.push(`/admin/clients/${r.data!.id}`); else router.refresh();
    }); }}>
      <Field label="Nom complet" htmlFor="fn" required><Input id="fn" required value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="ph"><Input id="ph" type="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field>
        <Field label="WhatsApp" htmlFor="wa"><Input id="wa" type="tel" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} /></Field>
        <Field label="E-mail" htmlFor="em"><Input id="em" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
        <Field label="Pays" htmlFor="co"><Input id="co" value={v.country} onChange={(e) => setV({ ...v, country: e.target.value })} /></Field>
      </div>
      <Field label="Notes" htmlFor="no"><Textarea id="no" rows={3} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} /></Field>
      <div className="flex justify-between gap-2">
        {id && canDelete ? <Button type="button" variant="ghost" className="text-red-600" onClick={() => setConfirm(true)}>Supprimer</Button> : <span />}
        <Button type="submit" variant="primary" loading={pending}>Enregistrer</Button>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} danger loading={pending} title="Supprimer ce client ?" message="Possible uniquement s'il n'a aucune réservation." confirmLabel="Supprimer"
        onConfirm={() => start(async () => { const r = await deleteCustomer(id!); setConfirm(false); if (!r.ok) toast.error(r.error); else { toast(r.message!); router.push("/admin/clients"); } })} />
    </form>
  );
}
