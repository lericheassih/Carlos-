import Link from "next/link";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/admin/SearchBox";
import { Pagination } from "@/components/admin/Pagination";
import { LinkTabs } from "@/components/ui/Tabs";
import { dateFr, fcfa } from "@/lib/format";
import { NewCustomerButton } from "./NewCustomerButton";

const PER = 40;
const SORTS = [{ key: "recent", label: "Récents" }, { key: "fideles", label: "Plus de séjours" }, { key: "depense", label: "Plus gros montants" }, { key: "sans", label: "Sans séjour" }];

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; tri?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const tri = SORTS.some((s) => s.key === sp.tri) ? sp.tri! : "recent";
  const supabase = await createClient();
  let q = supabase.from("customer_stats").select("*", { count: "exact" }).range((page - 1) * PER, page * PER - 1);
  if (tri === "fideles") q = q.order("stays", { ascending: false });
  else if (tri === "depense") q = q.order("total_spent", { ascending: false });
  else if (tri === "sans") q = q.eq("stays", 0).order("created_at", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  if (sp.q) { const s = sp.q.replace(/[%,()]/g, ""); q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,whatsapp.ilike.%${s}%,email.ilike.%${s}%`); }
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);
  const qs = (extra: Record<string, string>) => `/admin/clients?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(tri !== "recent" ? { tri } : {}), ...extra })}`;
  return (
    <>
      <PageHeader title="Clients" description={`${count ?? 0} client(s)`} actions={<NewCustomerButton />} />
      <LinkTabs active={tri} items={SORTS.map((s) => ({ key: s.key, label: s.label, href: `/admin/clients?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(s.key !== "recent" ? { tri: s.key } : {}) })}` }))} />
      <Card>
        <div className="border-b border-line p-3"><SearchBox placeholder="Nom, téléphone, WhatsApp, e-mail…" /></div>
        {(data ?? []).length === 0 ? <EmptyState icon={<Users className="size-5" />} title="Aucun client" text="Les clients sont créés automatiquement avec les réservations." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Client</th><th className="hidden md:table-cell">Contact</th><th className="text-right">Séjours</th><th className="text-right">Total dépensé</th><th className="hidden lg:table-cell">Dernier séjour</th></tr></thead>
              <tbody>
                {(data ?? []).map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/admin/clients/${c.id}`} className="font-medium hover:underline">{c.full_name}</Link>{c.country && <div className="text-xs text-muted">{c.country}</div>}</td>
                    <td className="hidden text-muted md:table-cell">{c.whatsapp || c.phone || "—"}{c.email && <div className="text-xs">{c.email}</div>}</td>
                    <td className="text-right tabular-nums">{c.stays}</td>
                    <td className="text-right tabular-nums">{fcfa(c.total_spent)}</td>
                    <td className="hidden lg:table-cell">{dateFr(c.last_check_in)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={count ?? 0} perPage={PER} href={(p) => qs({ page: String(p) })} />
      </Card>
    </>
  );
}
