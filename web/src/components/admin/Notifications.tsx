"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dateTimeFr } from "@/lib/format";

type N = { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string };

export function Notifications({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(15);
    const list = (data ?? []) as N[];
    setItems(list);
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    setUnread(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    const ch = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }
  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    await load();
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative grid size-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Notifications">
        <Bell className="size-[18px]" />
        {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] animate-fade-in overflow-hidden rounded-xl border border-line bg-white text-ink shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:underline">Tout marquer comme lu</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Aucune notification pour le moment.</p>}
              {items.map((n) => (
                <Link key={n.id} href={n.link ?? "/admin"} onClick={async () => { setOpen(false); if (!n.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id); }}
                  className={`flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-slate-50 ${n.read_at ? "" : "bg-brand-50/50"}`}>
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><CalendarCheck className="size-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{dateTimeFr(n.created_at)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
