import Link from "next/link";
import { Building2, ImageOff, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkTabs } from "@/components/ui/Tabs";
import { AptStatus } from "@/components/admin/StatusBadges";
import { SearchBox } from "@/components/admin/SearchBox";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/Badge";
import { fcfa, dateFr } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { ApartmentStatus } from "@/lib/types";

const PER = 30;
const TABS = [
  { key: "all", label: "Tous" }, { key: "published", label: "Publiés" }, { key: "draft", label: "Brouillons" },
  { key: "hidden", label: "Masqués" }, { key: "archived", label: "Archivés" },
];

export default async function Apartments({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const statut = TABS.some((t) => t.key === sp.statut) ? sp.statut! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();

  let q = supabase.from("apartments")
    .select("id, reference, name, slug, status, neighborhood, city, price_night, bedrooms, max_guests, updated_at, published_at, apartment_media(is_cover, media:media(storage_path, kind))", { count: "exact" })
    .order("sort_order").order("created_at", { ascending: false })
    .range((page - 1) * PER, page * PER - 1);
  if (statut !== "all") q = q.eq("status", statut);
  else q = q.neq("status", "archived");
  if (sp.q) q = q.or(`name.ilike.%${sp.q.replace(/[%,()]/g, "")}%,reference.ilike.%${sp.q.replace(/[%,()]/g, "")}%,neighborhood.ilike.%${sp.q.replace(/[%,()]/g, "")}%`);
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  type Row = {
    id: string; reference: string; name: string; slug: string; status: ApartmentStatus; neighborhood: string; city: string; price_night: number;
    bedrooms: number; max_guests: number; updated_at: string; published_at: string | null;
    apartment_media: { is_cover: boolean; media: { storage_path: string; kind: string } | null }[];
  };
  const rows = (data ?? []) as unknown as Row[];
  const qs = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    if (statut !== "all") u.set("statut", statut);
    if (sp.q) u.set("q", sp.q);
    Object.entries(p).forEach(([k, v]) => (v === undefined ? u.delete(k) : u.set(k, String(v))));
    return `/admin/appartements?${u.toString()}`;
  };

  return (
    <>
      <PageHeader title="Mes appartements" description={`${count ?? 0} appartement(s)`}
        actions={<ButtonLink href="/admin/appartements/nouveau" variant="primary"><Plus className="size-4" /> Ajouter un appartement</ButtonLink>} />
      <LinkTabs active={statut} items={TABS.map((t) => ({ key: t.key, label: t.label, href: `/admin/appartements${t.key === "all" ? "" : `?statut=${t.key}`}` }))} />
      <Card>
        <div className="border-b border-line p-3"><SearchBox placeholder="Rechercher par nom, identifiant ou quartier…" /></div>
        {rows.length === 0 ? (
          <EmptyState icon={<Building2 className="size-5" />} title={sp.q ? "Aucun résultat" : "Aucun appartement ici"}
            text={sp.q ? "Essayez un autre terme de recherche." : "Ajoutez votre premier appartement pour le publier sur votre site."}
            action={!sp.q && <ButtonLink href="/admin/appartements/nouveau" variant="primary"><Plus className="size-4" /> Ajouter un appartement</ButtonLink>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th className="w-16"></th><th>Appartement</th><th>Statut</th><th className="hidden md:table-cell">Quartier</th><th className="text-right">Prix / nuit</th><th className="hidden lg:table-cell">Modifié</th></tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const cover = a.apartment_media.find((m) => m.is_cover && m.media?.kind === "image") ?? a.apartment_media.find((m) => m.media?.kind === "image");
                  const pending = a.status === "published" && a.published_at && new Date(a.updated_at).getTime() - new Date(a.published_at).getTime() > 1500;
                  return (
                    <tr key={a.id} className="cursor-pointer">
                      <td className="py-2">
                        <Link href={`/admin/appartements/${a.id}`} className="block size-11 overflow-hidden rounded-lg border border-line bg-slate-100">
                          {cover?.media ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(cover.media.storage_path)!} alt="" className="size-full object-cover" loading="lazy" />
                          ) : <span className="grid size-full place-items-center text-slate-400"><ImageOff className="size-4" /></span>}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/admin/appartements/${a.id}`} className="font-medium text-ink hover:underline">{a.name}</Link>
                        <div className="text-xs text-muted">{a.reference} · {a.bedrooms} ch. · {a.max_guests} pers.</div>
                      </td>
                      <td><div className="flex flex-col items-start gap-1"><AptStatus s={a.status} />{pending && <Badge tone="warning">Modifs non publiées</Badge>}</div></td>
                      <td className="hidden text-muted md:table-cell">{[a.neighborhood, a.city].filter(Boolean).join(", ") || "—"}</td>
                      <td className="text-right font-medium tabular-nums">{fcfa(a.price_night)}</td>
                      <td className="hidden text-muted lg:table-cell">{dateFr(a.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={count ?? 0} perPage={PER} href={(p) => qs({ page: p })} />
      </Card>
    </>
  );
}
