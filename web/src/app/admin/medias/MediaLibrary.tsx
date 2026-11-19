"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Film, Images, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toaster";
import { SearchBox } from "@/components/admin/SearchBox";
import { uploadMedia } from "@/lib/upload";
import { dateFr } from "@/lib/format";
import { deleteMedia, renameMedia } from "./actions";

type Item = { id: string; kind: "image" | "video"; url: string; name: string; alt: string; size: number; width: number | null; height: number | null; created_at: string; used: { id: string; name: string }[] };

export function MediaLibrary({ items }: { items: Item[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [edit, setEdit] = useState({ name: "", alt: "" });
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setProgress(`0/${files.length}`);
    const { items: up, errors } = await uploadMedia(Array.from(files), (d, t) => setProgress(`${d}/${t}`));
    setProgress(null);
    errors.forEach((e) => toast.error(e));
    if (up.length) { toast(`${up.length} fichier(s) importé(s).`); router.refresh(); }
  }

  return (
    <Card onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
      className={drag ? "ring-2 ring-brand-500" : ""}>
      <div className="flex flex-wrap gap-2 border-b border-line p-3">
        <SearchBox placeholder="Rechercher un média par nom…" />
        <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <Button variant="primary" onClick={() => input.current?.click()} loading={!!progress}><Upload className="size-4" /> {progress ? `Envoi ${progress}` : "Importer des photos ou vidéos"}</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Images className="size-5" />} title="Aucun média" text="Importez vos photos et vidéos : elles seront optimisées et stockées dans le cloud, puis réutilisables dans toutes vos fiches." />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <button key={m.id} onClick={() => { setOpen(m); setEdit({ name: m.name, alt: m.alt }); }} className="group overflow-hidden rounded-xl border border-line bg-white text-left hover:shadow-md">
              <div className="relative aspect-square bg-slate-100">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt || m.name} loading="lazy" className="size-full object-cover" />
                ) : <span className="grid size-full place-items-center bg-slate-800 text-white"><Film className="size-7" /></span>}
                {m.used.length > 0 && <span className="absolute left-1.5 top-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">{m.used.length} fiche(s)</span>}
              </div>
              <div className="truncate px-2 py-1.5 text-xs font-medium">{m.name}</div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title="Détails du média" size="lg"
        footer={<>
          <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Supprimer</Button>
          <Button onClick={() => setOpen(null)}>Fermer</Button>
          <Button variant="primary" loading={pending} onClick={() => start(async () => { const r = await renameMedia(open!.id, edit.name, edit.alt); if (!r.ok) toast.error(r.error); else { toast(r.message!); setOpen(null); router.refresh(); } })}>Enregistrer</Button>
        </>}>
        {open && (
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="overflow-hidden rounded-lg bg-slate-100">
              {open.kind === "image"
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={open.url} alt={open.alt} className="mx-auto max-h-[55vh]" />
                : <video src={open.url} controls className="max-h-[55vh] w-full" />}
            </div>
            <div className="space-y-3 text-sm">
              <Field label="Nom" htmlFor="mn"><Input id="mn" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Texte alternatif (SEO, accessibilité)" htmlFor="ma"><Input id="ma" value={edit.alt} onChange={(e) => setEdit({ ...edit, alt: e.target.value })} /></Field>
              <dl className="space-y-1 text-xs text-muted">
                <div>{open.width && open.height ? `${open.width} × ${open.height} px · ` : ""}{(open.size / 1024).toFixed(0)} Ko</div>
                <div>Ajouté le {dateFr(open.created_at)}</div>
              </dl>
              <button className="flex items-center gap-1 text-xs font-medium text-brand-600" onClick={() => { navigator.clipboard.writeText(open.url); toast("Lien copié."); }}><Copy className="size-3.5" /> Copier le lien</button>
              <div>
                <div className="mb-1 text-xs font-semibold">Utilisé dans</div>
                {open.used.length === 0 ? <p className="text-xs text-muted">Aucune fiche.</p> : open.used.map((a) => <Link key={a.id} href={`/admin/appartements/${a.id}`} className="block text-xs text-brand-600 hover:underline">{a.name}</Link>)}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} danger loading={pending} title="Supprimer ce média ?" confirmLabel="Supprimer"
        message="Le fichier sera supprimé définitivement du stockage cloud."
        onConfirm={() => start(async () => { const r = await deleteMedia(open!.id); setConfirm(false); if (!r.ok) toast.error(r.error); else { toast(r.message!); setOpen(null); router.refresh(); } })} />
    </Card>
  );
}
