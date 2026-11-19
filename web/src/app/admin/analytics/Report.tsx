"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkTabs } from "@/components/ui/Tabs";
import { Bars, TrendChart } from "@/components/charts/Charts";
import { CHANNEL_LABELS } from "@/lib/analytics/classify";
import { countryFlag, countryName, dateFr, durationFr, num, pct } from "@/lib/format";

export type ReportData = {
  hourly: boolean;
  totals: { visitors: number; sessions: number; pageviews: number; avg_duration_sec: number; engagement_rate: number; new_visitors: number; pages_per_session: number };
  series: { t: string; visitors: number; sessions: number; pageviews: number }[];
  apartments: { id: string; name: string; slug: string; status: string; views: number; unique_visitors: number; pricing_views: number; whatsapp_clicks: number; phone_clicks: number; booking_starts: number; booking_requests: number; confirmed: number }[];
  countries: { country: string; visitors: number; sessions: number; pct: number }[];
  cities: { country: string; city: string; visitors: number }[];
  channels: { channel: string; sessions: number; visitors: number; engaged: number }[];
  referrers: { domain: string; sessions: number }[];
  campaigns: { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null; utm_term: string | null; sessions: number; visitors: number; whatsapp_clicks: number; booking_requests: number }[];
  devices: { device: string; sessions: number }[];
  funnel: { visitors: number; apartment_viewers: number; whatsapp_clicks: number; whatsapp_clickers: number; phone_clicks: number; booking_starts: number; booking_requests: number; confirmed: number };
};

const rate = (a: number, b: number) => (b ? (100 * a) / b : 0);

export function Report({ data, periods, active, from, to }: { data: ReportData; periods: { key: string; label: string }[]; active: string; from: string; to: string }) {
  const router = useRouter();
  const [custom, setCustom] = useState({ du: from, au: to });
  const t = data.totals;
  const series = data.series.map((s) => ({
    label: data.hourly ? new Date(s.t).toLocaleString("fr-FR", { timeZone: "Africa/Lome", day: "numeric", hour: "2-digit" }) + "h" : dateFr(s.t.slice(0, 10), { day: "numeric", month: "short" }),
    visitors: s.visitors, sessions: s.sessions, pageviews: s.pageviews,
  }));
  const apts = data.apartments.filter((a) => a.views || a.whatsapp_clicks || a.booking_requests || a.confirmed || a.status === "published");
  const f = data.funnel;
  const funnel = [
    { l: "Visiteurs", v: f.visitors, base: f.visitors },
    { l: "Ont consulté un appartement", v: f.apartment_viewers, base: f.visitors },
    { l: "Clics WhatsApp", v: f.whatsapp_clicks, base: f.visitors, hint: `${f.whatsapp_clickers} visiteur(s) distinct(s)` },
    { l: "Demandes de réservation initiées", v: f.booking_starts, base: f.visitors, hint: "sélection de dates" },
    { l: "Demandes envoyées (formulaire)", v: f.booking_requests, base: f.visitors },
    { l: "Réservations confirmées (système)", v: f.confirmed, base: f.visitors },
  ];
  const channels = data.channels.map((c) => ({ ...c, label: CHANNEL_LABELS[c.channel] ?? c.channel }));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <LinkTabs active={active} items={periods.filter((p) => p.key !== "custom").map((p) => ({ key: p.key, label: p.label, href: `/admin/analytics?periode=${p.key}` }))} />
        <form className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px]" onSubmit={(e) => { e.preventDefault(); router.push(`/admin/analytics?periode=custom&du=${custom.du}&au=${custom.au}`); }}>
          <input type="date" className="input h-8 w-auto py-1" value={custom.du} onChange={(e) => setCustom({ ...custom, du: e.target.value })} aria-label="Du" />
          <span className="text-muted">→</span>
          <input type="date" className="input h-8 w-auto py-1" value={custom.au} onChange={(e) => setCustom({ ...custom, au: e.target.value })} aria-label="Au" />
          <button className={`h-8 rounded-lg px-3 font-medium ${active === "custom" ? "bg-white shadow-sm ring-1 ring-line" : "text-muted hover:bg-white/60"}`}>Période personnalisée</button>
        </form>
      </div>
      <p className="-mt-2 mb-4 text-xs text-muted">Du {dateFr(from)} au {dateFr(to)} (heure de Lomé)</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { l: "Visiteurs uniques", v: num(t.visitors) },
          { l: "Nouveaux visiteurs", v: num(t.new_visitors) },
          { l: "Sessions", v: num(t.sessions) },
          { l: "Pages vues", v: num(t.pageviews) },
          { l: "Durée moy. de session", v: durationFr(t.avg_duration_sec) },
          { l: "Taux d'engagement", v: pct(t.engagement_rate), h: "≥ 10 s, 2 pages ou une action" },
        ].map((x) => (
          <div key={x.l} className="card p-4">
            <div className="text-[13px] text-muted">{x.l}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{x.v}</div>
            {x.h && <div className="text-[11px] text-muted">{x.h}</div>}
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="Évolution du trafic" description={data.hourly ? "Par heure" : "Par jour"} />
        <CardBody><TrendChart data={series} x="label" series={[{ key: "visitors", label: "Visiteurs" }, { key: "sessions", label: "Sessions" }, { key: "pageviews", label: "Pages vues" }]} kind="line" height={260} /></CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Appartements les plus consultés" description="Un clic WhatsApp n'est pas une réservation : les réservations confirmées sont comptées séparément." />
        <div className="mt-3 overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Appartement</th><th className="text-right">Consultations</th><th className="text-right">Visiteurs uniques</th><th className="text-right">Clics WhatsApp</th><th className="text-right">Appels</th><th className="text-right">Demandes initiées</th><th className="text-right">Demandes envoyées</th><th className="text-right">Confirmées</th><th className="text-right">Conversion</th></tr></thead>
            <tbody>
              {apts.length === 0 && <tr><td colSpan={9} className="text-center text-muted">Aucune donnée sur la période.</td></tr>}
              {apts.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/appartements/${a.id}`} className="font-medium hover:underline">{a.name}</Link></td>
                  <td className="text-right tabular-nums">{num(a.views)}</td><td className="text-right tabular-nums">{num(a.unique_visitors)}</td>
                  <td className="text-right font-semibold tabular-nums text-emerald-700">{num(a.whatsapp_clicks)}</td><td className="text-right tabular-nums">{num(a.phone_clicks)}</td>
                  <td className="text-right tabular-nums">{num(a.booking_starts)}</td><td className="text-right tabular-nums">{num(a.booking_requests)}</td>
                  <td className="text-right font-semibold tabular-nums">{num(a.confirmed)}</td>
                  <td className="text-right tabular-nums">{a.unique_visitors ? pct(rate(a.confirmed, a.unique_visitors)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {apts.some((a) => a.views) && (
          <CardBody><Bars data={apts.slice(0, 10).map((a) => ({ name: a.name.length > 22 ? a.name.slice(0, 21) + "…" : a.name, views: a.views, wa: a.whatsapp_clicks }))} x="name" layout="vertical" height={Math.max(160, apts.slice(0, 10).length * 44)}
            series={[{ key: "views", label: "Consultations" }, { key: "wa", label: "Clics WhatsApp" }]} /></CardBody>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Taux de conversion" description="Entonnoir du visiteur à la réservation confirmée" />
          <CardBody className="space-y-2.5">
            {funnel.map((s) => (
              <div key={s.l}>
                <div className="flex justify-between text-[13px]"><span>{s.l}{s.hint && <span className="text-muted"> · {s.hint}</span>}</span><span className="font-semibold tabular-nums">{num(s.v)} <span className="font-normal text-muted">({pct(rate(s.v, s.base))})</span></span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#2a78d6]" style={{ width: `${Math.min(100, rate(s.v, s.base))}%` }} /></div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sources de trafic" description="Paramètres UTM, clics publicitaires (fbclid, gclid, ttclid) et sites référents" />
          <CardBody>
            {channels.length === 0 ? <p className="text-sm text-muted">Aucune donnée.</p> : (
              <>
                <Bars data={channels} x="label" series={[{ key: "sessions", label: "Sessions" }]} layout="vertical" height={Math.max(140, channels.length * 36)} />
                <table className="table-base mt-2">
                  <thead><tr><th>Source</th><th className="text-right">Sessions</th><th className="text-right">Visiteurs</th><th className="text-right">Engagées</th></tr></thead>
                  <tbody>{channels.map((c) => <tr key={c.channel}><td>{c.label}</td><td className="text-right tabular-nums">{c.sessions}</td><td className="text-right tabular-nums">{c.visitors}</td><td className="text-right tabular-nums">{pct(rate(c.engaged, c.sessions))}</td></tr>)}</tbody>
                </table>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Localisation des visiteurs" description="Pays détecté par l'hébergeur ; « Inconnu » si l'information n'est pas fournie." />
          <CardBody>
            {data.countries.length === 0 ? <p className="text-sm text-muted">Aucune donnée.</p> : (
              <>
                <Bars data={data.countries.slice(0, 10).map((c) => ({ name: countryName(c.country), visitors: c.visitors }))} x="name" series={[{ key: "visitors", label: "Visiteurs" }]} layout="vertical" height={Math.max(140, Math.min(10, data.countries.length) * 34)} />
                <table className="table-base mt-2">
                  <thead><tr><th>Pays</th><th className="text-right">Visiteurs</th><th className="text-right">% du trafic</th></tr></thead>
                  <tbody>{data.countries.slice(0, 10).map((c) => <tr key={c.country}><td>{countryFlag(c.country)} {countryName(c.country)}</td><td className="text-right tabular-nums">{c.visitors}</td><td className="text-right tabular-nums">{pct(c.pct)}</td></tr>)}</tbody>
                </table>
              </>
            )}
            {data.cities.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-semibold text-muted">Villes (lorsque disponible)</div>
                <ul className="grid gap-1 text-[13px] sm:grid-cols-2">{data.cities.map((c) => <li key={c.country + c.city} className="flex justify-between gap-2"><span className="truncate">{countryFlag(c.country)} {c.city}</span><span className="tabular-nums">{c.visitors}</span></li>)}</ul>
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Campagnes publicitaires (UTM)" description="utm_source · utm_medium · utm_campaign · utm_content · utm_term" />
          <div className="mt-3 overflow-x-auto">
            {data.campaigns.length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Aucune visite avec paramètres UTM. Utilisez le générateur de liens ci-dessous pour vos publicités.</p> : (
              <table className="table-base">
                <thead><tr><th>Source / Support</th><th>Campagne</th><th className="text-right">Sessions</th><th className="text-right">WhatsApp</th><th className="text-right">Demandes</th></tr></thead>
                <tbody>{data.campaigns.map((c, i) => (
                  <tr key={i}>
                    <td>{c.utm_source ?? "—"}<div className="text-xs text-muted">{c.utm_medium ?? ""}</div></td>
                    <td>{c.utm_campaign ?? "—"}{(c.utm_content || c.utm_term) && <div className="text-xs text-muted">{[c.utm_content, c.utm_term].filter(Boolean).join(" · ")}</div>}</td>
                    <td className="text-right tabular-nums">{c.sessions}</td><td className="text-right tabular-nums">{c.whatsapp_clicks}</td><td className="text-right tabular-nums">{c.booking_requests}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
          {data.referrers.length > 0 && (
            <CardBody>
              <div className="mb-1 text-xs font-semibold text-muted">Sites référents</div>
              <ul className="space-y-1 text-[13px]">{data.referrers.map((r) => <li key={r.domain} className="flex justify-between"><span>{r.domain}</span><span className="tabular-nums">{r.sessions}</span></li>)}</ul>
            </CardBody>
          )}
          {data.devices.length > 0 && (
            <CardBody>
              <div className="mb-1 text-xs font-semibold text-muted">Appareils</div>
              <div className="flex flex-wrap gap-3 text-[13px]">{data.devices.map((d) => <span key={d.device} className="rounded-lg bg-slate-50 px-3 py-1.5">{{ mobile: "Mobile", tablet: "Tablette", desktop: "Ordinateur" }[d.device] ?? "Inconnu"} : <strong className="tabular-nums">{pct(rate(d.sessions, t.sessions))}</strong></span>)}</div>
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
