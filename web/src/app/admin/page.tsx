import Link from "next/link";
import { Building2, CalendarCheck, CheckCircle2, Clock, DoorOpen, Percent, Plus, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PERIODS, periodRange, todayIso, addDays, type PeriodKey } from "@/lib/dates";
import { dateFr, fcfa, num, pct } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard, deltaPct } from "@/components/admin/StatCard";
import { PeriodFilter } from "@/components/admin/PeriodFilter";
import { ResStatus } from "@/components/admin/StatusBadges";
import { Bars, TrendChart } from "@/components/charts/Charts";
import type { ReservationStatus } from "@/lib/types";

type Stats = {
  apartments_total: number; apartments_published: number; occupied_today: number; blocked_today: number; available_today: number;
  reservations_period: number; reservations_prev: number; requests_period: number; pending_total: number;
  revenue_collected: number; revenue_collected_prev: number; revenue_booked: number; balance_due: number;
  occupancy_rate: number; occupancy_prev: number; customers_total: number; customers_new: number;
  period: { from: string; to: string; prev_from: string; prev_to: string };
};
type SeriesRow = { bucket: string; revenue: number; reservations: number; nights: number; occupancy: number };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const key = (PERIODS.some((p) => p.key === sp.periode) ? sp.periode : "month") as PeriodKey;
  const range = periodRange(key);
  const supabase = await createClient();
  const today = todayIso();

  const { data: statsRaw, error } = await supabase.rpc("dashboard_stats", { p_from: range.from, p_to: range.to });
  if (error) throw new Error(error.message);
  const s = statsRaw as Stats;
  const [cur, prev, upcoming, pendingList] = await Promise.all([
    supabase.rpc("dashboard_series", { p_from: range.from, p_to: range.to, p_bucket: range.bucket }),
    supabase.rpc("dashboard_series", { p_from: s.period.prev_from, p_to: s.period.prev_to, p_bucket: range.bucket }),
    supabase.from("reservations").select("id, reference, check_in, check_out, status, apartment:apartments(name), customer:customers(full_name)")
      .in("status", ["confirmed", "in_progress"]).or(`check_in.gte.${today},check_out.gte.${today}`).lte("check_in", addDays(today, 14))
      .order("check_in").limit(8),
    supabase.from("reservations").select("id, reference, check_in, check_out, total_amount, created_at, status, apartment:apartments(name), customer:customers(full_name)")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(6),
  ]);
  const series = (cur.data ?? []) as SeriesRow[];
  const prevSeries = (prev.data ?? []) as SeriesRow[];
  const fmtBucket = (b: string) =>
    range.bucket === "month" ? dateFr(b, { month: "short" }) : dateFr(b, { day: "numeric", month: "short" });
  const compare = series.map((r, i) => ({ label: fmtBucket(r.bucket), current: Number(r.revenue), previous: Number(prevSeries[i]?.revenue ?? 0) }));
  const chartData = series.map((r) => ({ label: fmtBucket(r.bucket), revenue: Number(r.revenue), reservations: Number(r.reservations), occupancy: Number(r.occupancy) }));
  const periodLabel = PERIODS.find((p) => p.key === key)!.label.toLowerCase();

  type J = { id: string; reference: string; check_in: string; check_out: string; status: ReservationStatus; total_amount?: number; apartment: { name: string } | null; customer: { full_name: string } | null };

  return (
    <>
      <PageHeader
        title={`Bonjour${admin.fullName ? " " + admin.fullName.split(" ")[0] : ""}`}
        description={`Activité du ${dateFr(range.from)} au ${dateFr(range.to)}`}
        actions={<>
          <ButtonLink href="/admin/reservations/nouvelle"><CalendarCheck className="size-4" /> Nouvelle réservation</ButtonLink>
          <ButtonLink href="/admin/appartements/nouveau" variant="primary"><Plus className="size-4" /> Ajouter un appartement</ButtonLink>
        </>}
      />
      <PeriodFilter base="/admin" active={key} items={PERIODS} />

      {s.apartments_total === 0 && (
        <Card className="mb-5">
          <EmptyState icon={<Building2 className="size-5" />} title="Bienvenue ! Commencez par ajouter votre premier appartement"
            text="Renseignez ses informations, ajoutez des photos, fixez le tarif puis cliquez sur « Publier » : il apparaîtra immédiatement sur votre site."
            action={<ButtonLink href="/admin/appartements/nouveau" variant="primary"><Plus className="size-4" /> Ajouter un appartement</ButtonLink>} />
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Appartements" value={num(s.apartments_total)} hint={`${s.apartments_published} publié${s.apartments_published > 1 ? "s" : ""}`} icon={<Building2 className="size-4" />} href="/admin/appartements" />
        <StatCard label="Disponibles aujourd'hui" value={num(s.available_today)} hint={s.blocked_today ? `${s.blocked_today} bloqué(s)` : "parmi les publiés"} icon={<DoorOpen className="size-4" />} href="/admin/calendrier" />
        <StatCard label="Occupés aujourd'hui" value={num(s.occupied_today)} hint="séjours en cours" icon={<CheckCircle2 className="size-4" />} href="/admin/calendrier" />
        <StatCard label="Réservations en attente" value={num(s.pending_total)} hint="à traiter" tone={s.pending_total ? "warning" : undefined} icon={<Clock className="size-4" />} href="/admin/reservations?statut=pending" />
        <StatCard label={`Réservations (${periodLabel})`} value={num(s.reservations_period)} delta={deltaPct(s.reservations_period, s.reservations_prev)} hint="arrivées confirmées" icon={<CalendarCheck className="size-4" />} href="/admin/reservations" />
        <StatCard label={`Revenus encaissés (${periodLabel})`} value={fcfa(s.revenue_collected)} delta={deltaPct(s.revenue_collected, s.revenue_collected_prev)} hint={`${fcfa(s.revenue_booked)} réservés`} icon={<Wallet className="size-4" />} />
        <StatCard label="Taux d'occupation" value={pct(s.occupancy_rate)} delta={deltaPct(s.occupancy_rate, s.occupancy_prev)} hint={periodLabel} icon={<Percent className="size-4" />} />
        <StatCard label="Clients" value={num(s.customers_total)} hint={`+${s.customers_new} sur la période`} icon={<Users className="size-4" />} href="/admin/clients" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Évolution des revenus" description="Paiements enregistrés (FCFA)" />
          <CardBody><TrendChart data={chartData} x="label" series={[{ key: "revenue", label: "Revenus" }]} unit="FCFA" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Évolution des réservations" description="Arrivées de séjours confirmés" />
          <CardBody><Bars data={chartData} x="label" series={[{ key: "reservations", label: "Réservations" }]} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Comparaison des revenus" description={`Période actuelle vs ${dateFr(s.period.prev_from)} – ${dateFr(s.period.prev_to)}`} />
          <CardBody><Bars data={compare} x="label" series={[{ key: "current", label: "Période actuelle" }, { key: "previous", label: "Période précédente" }]} unit="FCFA" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Taux d'occupation" description="Nuits occupées / nuits disponibles (%)" />
          <CardBody><TrendChart kind="line" data={chartData} x="label" series={[{ key: "occupancy", label: "Occupation" }]} unit="%" /></CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Demandes en attente" actions={<Link href="/admin/reservations?statut=pending" className="text-[13px] font-medium text-brand-600 hover:underline">Tout voir</Link>} />
          <div className="mt-2">
            {(pendingList.data ?? []).length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Aucune demande en attente.</p> :
              (pendingList.data as unknown as J[]).map((r) => (
                <Link key={r.id} href={`/admin/reservations/${r.id}`} className="flex items-center gap-3 border-t border-line px-5 py-3 text-sm hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.customer?.full_name}</div>
                    <div className="truncate text-xs text-muted">{r.apartment?.name} · {dateFr(r.check_in, { day: "numeric", month: "short" })} → {dateFr(r.check_out)}</div>
                  </div>
                  <span className="tabular-nums text-[13px] font-medium">{fcfa(r.total_amount)}</span>
                </Link>
              ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Arrivées et séjours (14 prochains jours)" actions={<Link href="/admin/calendrier" className="text-[13px] font-medium text-brand-600 hover:underline">Calendrier</Link>} />
          <div className="mt-2">
            {(upcoming.data ?? []).length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Aucun séjour prévu.</p> :
              (upcoming.data as unknown as J[]).map((r) => (
                <Link key={r.id} href={`/admin/reservations/${r.id}`} className="flex items-center gap-3 border-t border-line px-5 py-3 text-sm hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.apartment?.name}</div>
                    <div className="truncate text-xs text-muted">{r.customer?.full_name} · {dateFr(r.check_in, { day: "numeric", month: "short" })} → {dateFr(r.check_out)}</div>
                  </div>
                  <ResStatus s={r.status} />
                </Link>
              ))}
          </div>
        </Card>
      </div>
      {s.balance_due > 0 && (
        <p className="mt-4 text-[13px] text-muted">Reste à encaisser sur les séjours confirmés : <strong className="text-ink">{fcfa(s.balance_due)}</strong></p>
      )}
    </>
  );
}
