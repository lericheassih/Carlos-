"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { countryFlag, countryName, num } from "@/lib/format";

type RT = {
  active_now: number; active_5min: number; visitors_today: number; new_visitors_today: number; sessions_today: number;
  pageviews_today: number; whatsapp_today: number; active_pages: { path: string; visitors: number }[];
  active_countries: { country: string; visitors: number }[]; server_time: string;
};

/** Visiteurs en temps réel : présence = signal reçu il y a moins de 60 s (battement toutes les 20 s). */
export function LiveVisitors() {
  const [d, setD] = useState<RT | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const supabase = createClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("analytics_realtime");
    if (data) { setD(data as RT); setUpdated(new Date()); }
  }, [supabase]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    // Supabase Realtime : rafraîchissement immédiat à chaque nouvel événement
    const ch = supabase.channel("live-visitors")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_sessions" }, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(load, 800);
      })
      .subscribe();
    return () => { clearInterval(poll); supabase.removeChannel(ch); };
  }, [load, supabase]);

  const tiles = d ? [
    { l: "Actifs (5 dernières min.)", v: d.active_5min },
    { l: "Visiteurs aujourd'hui", v: d.visitors_today },
    { l: "Nouveaux visiteurs", v: d.new_visitors_today },
    { l: "Sessions aujourd'hui", v: d.sessions_today },
    { l: "Pages vues aujourd'hui", v: d.pageviews_today },
    { l: "Clics WhatsApp aujourd'hui", v: d.whatsapp_today },
  ] : [];

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col justify-center gap-1 bg-[#1a1c1f] p-6 text-white">
          <span className="flex items-center gap-2 text-[13px] text-slate-300">
            <span className="relative flex size-2.5">{(d?.active_now ?? 0) > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}<span className={`relative inline-flex size-2.5 rounded-full ${(d?.active_now ?? 0) > 0 ? "bg-emerald-400" : "bg-slate-500"}`} /></span>
            Visiteurs actuellement en ligne
          </span>
          <span className="text-6xl font-semibold tabular-nums tracking-tight">{d ? num(d.active_now) : "–"}</span>
          <span className="text-xs text-slate-400">Activité dans la dernière minute{updated ? ` · actualisé à ${updated.toLocaleTimeString("fr-FR")}` : ""}</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((t) => (
              <div key={t.l} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="text-xs text-muted">{t.l}</div>
                <div className="text-xl font-semibold tabular-nums">{num(t.v)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted"><Activity className="size-3.5" /> Pages consultées en ce moment</div>
              {(d?.active_pages ?? []).length === 0 ? <p className="text-[13px] text-muted">Personne pour l&apos;instant.</p> : (
                <ul className="space-y-1 text-[13px]">{d!.active_pages.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="truncate font-mono text-xs">{p.path}</span><span className="tabular-nums">{p.visitors}</span></li>)}</ul>
              )}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted">Pays des visiteurs actifs</div>
              {(d?.active_countries ?? []).length === 0 ? <p className="text-[13px] text-muted">—</p> : (
                <ul className="space-y-1 text-[13px]">{d!.active_countries.map((c) => <li key={c.country} className="flex justify-between"><span>{countryFlag(c.country)} {countryName(c.country)}</span><span className="tabular-nums">{c.visitors}</span></li>)}</ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
