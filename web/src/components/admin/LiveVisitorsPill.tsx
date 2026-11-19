"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Nombre de visiteurs actifs (activité dans la dernière minute), actualisé toutes les 15 s. */
export function LiveVisitorsPill() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    const load = async () => {
      const { data } = await supabase.rpc("analytics_realtime");
      if (alive && data) setN((data as { active_now: number }).active_now);
    };
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (n === null) return null;
  return (
    <Link href="/admin/analytics" className="hidden h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-slate-200 hover:bg-white/10 sm:flex" title="Visiteurs actifs sur le site (dernière minute)">
      <span className="relative flex size-2">
        {n > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex size-2 rounded-full ${n > 0 ? "bg-emerald-400" : "bg-slate-500"}`} />
      </span>
      <span className="tabular-nums">{n}</span> en ligne
    </Link>
  );
}
