"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Film, Loader2, Search, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";
import { uploadMedia, type MediaItem } from "@/lib/upload";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

/** Sélecteur de médias : bibliothèque centrale + envoi de nouveaux fichiers. */
export function MediaPicker({ open, onClose, onSelect, multiple = true, kind }: {
  open: boolean; onClose: () => void; onSelect: (items: MediaItem[]) => void; multiple?: boolean; kind?: "image" | "video";
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("media").select("*").order("created_at", { ascending: false }).limit(200);
    if (kind) query = query.eq("kind", kind);
    if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
    const { data } = await query;
    setItems(((data ?? []) as Omit<MediaItem, "url">[]).map((m) => ({ ...m, url: mediaUrl(m.storage_path)! })));
    setLoading(false);
  }, [kind, q]);

  useEffect(() => { if (open) { setSel([]); load(); } }, [open, load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setProgress(`Envoi 0/${files.length}…`);
    const { items: up, errors } = await uploadMedia(Array.from(files), (d, t) => setProgress(`Envoi ${d}/${t}…`));
    setProgress(null);
    errors.forEach((e) => toast.error(e));
    if (up.length) {
      toast(`${up.length} fichier(s) ajouté(s) à la galerie.`);
      setItems((l) => [...up, ...l]);
      setSel((s) => (multiple ? [...up.map((u) => u.id), ...s] : [up[0]!.id]));
    }
  }

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Galerie média"
      footer={<>
        <span className="mr-auto self-center text-[13px] text-muted">{sel.length} sélectionné(s)</span>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="primary" disabled={!sel.length} onClick={() => { onSelect(sel.map((id) => items.find((i) => i.id === id)!).filter(Boolean)); onClose(); }}>
          Ajouter la sélection
        </Button>
      </>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Rechercher par nom…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <input ref={input} type="file" multiple={multiple} hidden accept={kind === "video" ? "video/*" : kind === "image" ? "image/*" : "image/*,video/*"} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <Button variant="primary" onClick={() => input.current?.click()} loading={!!progress}>
          <Upload className="size-4" /> {progress ?? "Importer depuis l'appareil"}
        </Button>
      </div>
      {loading ? (
        <div className="grid place-items-center py-16 text-muted"><Loader2 className="size-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Aucun média pour l&apos;instant. Importez vos premières photos.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {items.map((m) => {
            const on = sel.includes(m.id);
            return (
              <button key={m.id} type="button" onClick={() => toggle(m.id)}
                className={cn("group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-2 transition", on ? "ring-brand-500" : "ring-transparent hover:ring-slate-300")}>
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name} className="size-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid size-full place-items-center bg-slate-800 text-white"><Film className="size-6" /></span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 text-left text-[11px] text-white">{m.name}</span>
                {on && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand-500 text-white"><Check className="size-3.5" /></span>}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
