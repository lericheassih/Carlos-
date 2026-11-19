"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import { dateFr } from "@/lib/format";
import { deleteReview, saveReview, toggleReview } from "./actions";

type Review = { id: string; apartment_id: string | null; reservation_id: string | null; author_name: string; author_country: string | null; rating: number; comment: string; stay_date: string | null; is_published: boolean; created_at: string; apartment: { name: string } | null };
type Res = { id: string; reference: string; apartment_id: string; check_in: string; customer: { full_name: string; country: string | null } | null };
const EMPTY = { apartment_id: "", reservation_id: "", author_name: "", author_country: "", rating: 5, comment: "", stay_date: "", is_published: false };

export function ReviewsManager({ reviews, apartments, reservations }: { reviews: Review[]; apartments: { id: string; name: string }[]; reservations: Res[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState<{ id: string | null; v: typeof EMPTY } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const done = (r: { ok: boolean; error?: string; message?: string }) => { if (!r.ok) toast.error(r.error!); else { toast(r.message!); router.refresh(); } };

  return (
    <>
      <div className="mb-3 flex justify-end"><Button variant="primary" onClick={() => setEdit({ id: null, v: EMPTY })}><Plus className="size-4" /> Ajouter un avis</Button></div>
      <Card>
        {reviews.length === 0 ? <EmptyState icon={<Star className="size-5" />} title="Aucun avis" text="Ajoutez les avis reçus de vos clients (WhatsApp, e-mail…), puis publiez-les." /> : (
          <ul className="divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</span>
                    <strong className="text-sm">{r.author_name}</strong>
                    {r.author_country && <span className="text-xs text-muted">{r.author_country}</span>}
                    {r.is_published ? <Badge tone="success" dot>Publié</Badge> : <Badge dot>Masqué</Badge>}
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-slate-700">{r.comment}</p>}
                  <p className="mt-1 text-xs text-muted">{r.apartment?.name ?? "Avis général"}{r.stay_date ? ` · séjour ${dateFr(r.stay_date)}` : ""}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" onClick={() => start(async () => done(await toggleReview(r.id, !r.is_published)))}>{r.is_published ? <><EyeOff className="size-4" /> Masquer</> : <><Eye className="size-4" /> Publier</>}</Button>
                  <Button size="sm" variant="ghost" aria-label="Modifier" onClick={() => setEdit({ id: r.id, v: { apartment_id: r.apartment_id ?? "", reservation_id: r.reservation_id ?? "", author_name: r.author_name, author_country: r.author_country ?? "", rating: r.rating, comment: r.comment, stay_date: r.stay_date ?? "", is_published: r.is_published } })}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" aria-label="Supprimer" className="text-red-600" onClick={() => setDel(r.id)}><Trash2 className="size-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Modifier l'avis" : "Ajouter un avis"}
        footer={<><Button onClick={() => setEdit(null)}>Annuler</Button><Button variant="primary" loading={pending} onClick={() => start(async () => {
          const v = edit!.v;
          const r = await saveReview(edit!.id, { ...v, apartment_id: v.apartment_id || null, reservation_id: v.reservation_id || null, author_country: v.author_country || null, stay_date: v.stay_date || null });
          done(r); if (r.ok) setEdit(null);
        })}>Enregistrer</Button></>}>
        {edit && (
          <div className="space-y-3">
            <Field label="Séjour concerné (facultatif)" htmlFor="rres" help="Pré-remplit l'appartement, le client et la date.">
              <Select id="rres" value={edit.v.reservation_id} onChange={(e) => {
                const r = reservations.find((x) => x.id === e.target.value);
                setEdit({ ...edit, v: { ...edit.v, reservation_id: e.target.value, ...(r ? { apartment_id: r.apartment_id, author_name: edit.v.author_name || r.customer?.full_name || "", author_country: edit.v.author_country || r.customer?.country || "", stay_date: r.check_in } : {}) } });
              }}>
                <option value="">—</option>
                {reservations.map((r) => <option key={r.id} value={r.id}>{r.reference} · {r.customer?.full_name} · {dateFr(r.check_in)}</option>)}
              </Select>
            </Field>
            <Field label="Appartement" htmlFor="rapt">
              <Select id="rapt" value={edit.v.apartment_id} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, apartment_id: e.target.value } })}>
                <option value="">Avis général (entreprise)</option>
                {apartments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom du client" htmlFor="ran" required><Input id="ran" value={edit.v.author_name} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, author_name: e.target.value } })} /></Field>
              <Field label="Pays" htmlFor="rac"><Input id="rac" value={edit.v.author_country} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, author_country: e.target.value } })} /></Field>
              <Field label="Note" htmlFor="rrt">
                <div className="flex gap-1" id="rrt">{[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setEdit({ ...edit, v: { ...edit.v, rating: n } })} aria-label={`${n} étoile(s)`}>
                    <Star className={`size-7 ${n <= edit.v.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </button>
                ))}</div>
              </Field>
              <Field label="Date du séjour" htmlFor="rsd"><Input id="rsd" type="date" value={edit.v.stay_date} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, stay_date: e.target.value } })} /></Field>
            </div>
            <Field label="Commentaire" htmlFor="rcm"><Textarea id="rcm" rows={4} value={edit.v.comment} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, comment: e.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={edit.v.is_published} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, is_published: e.target.checked } })} /> Publier sur le site</label>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger loading={pending} title="Supprimer cet avis ?" message="Cette action est irréversible." confirmLabel="Supprimer"
        onConfirm={() => start(async () => { done(await deleteReview(del!)); setDel(null); })} />
    </>
  );
}
