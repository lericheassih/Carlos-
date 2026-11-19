"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { NAV } from "./nav";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { Notifications } from "./Notifications";
import { Toaster } from "@/components/ui/Toaster";
import { LiveVisitorsPill } from "./LiveVisitorsPill";

type Props = {
  children: React.ReactNode;
  user: { email: string; fullName: string | null; role: string };
  companyName: string;
  pending: number;
  unread: number;
  signOut: () => Promise<void>;
};

export function Shell({ children, user, companyName, pending, unread, signOut }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => setOpen(false), [path]);

  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
  const name = user.fullName || user.email;

  const sidebar = (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 py-3">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}
            className={cn("group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition",
              active ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-line" : "text-slate-600 hover:bg-white/70 hover:text-ink")}>
            <Icon className={cn("size-[18px]", active ? "text-brand-600" : "text-slate-500 group-hover:text-slate-700")} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge === "pending" && pending > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold text-amber-800">{pending}</span>
            )}
            {item.live && <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />}
          </Link>
        );
      })}
      <div className="mt-auto pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-600 hover:bg-white/70 hover:text-ink">
          <ExternalLink className="size-4" /> Voir le site public
        </a>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Barre supérieure */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 bg-[#1a1c1f] px-3 text-white sm:px-4">
        <button className="grid size-9 place-items-center rounded-lg hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu className="size-5" />
        </button>
        <Link href="/admin" className="flex min-w-0 items-center gap-2 lg:w-[212px]">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-500 text-[13px] font-bold">{initials(companyName) || "A"}</span>
          <span className="hidden truncate text-sm font-semibold sm:block">{companyName}</span>
        </Link>
        <form className="mx-auto hidden w-full max-w-xl md:block" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/admin/recherche?q=${encodeURIComponent(q.trim())}`); }}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un appartement, une réservation, un client…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-white/30 focus:bg-white/15 focus:outline-none" />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/admin/recherche" className="grid size-9 place-items-center rounded-lg hover:bg-white/10 md:hidden" aria-label="Rechercher"><Search className="size-[18px]" /></Link>
          <LiveVisitorsPill />
          <a href="/" target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-slate-200 hover:bg-white/10 sm:flex">
            <ExternalLink className="size-4" /> Site public
          </a>
          <Notifications initialUnread={unread} />
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="flex h-9 items-center gap-2 rounded-lg pl-1 pr-2 hover:bg-white/10">
              <span className="grid size-7 place-items-center rounded-full bg-emerald-500 text-xs font-semibold">{initials(name)}</span>
              <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-64 animate-fade-in rounded-xl border border-line bg-white p-1.5 text-ink shadow-xl">
                  <div className="px-3 py-2">
                    <div className="truncate text-sm font-semibold">{name}</div>
                    <div className="truncate text-xs text-muted">{user.email} · {user.role === "owner" ? "Propriétaire" : user.role === "admin" ? "Administrateur" : "Équipe"}</div>
                  </div>
                  <Link href="/admin/parametres?onglet=compte" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Mon compte</Link>
                  <form action={signOut}>
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="size-4" /> Se déconnecter</button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar fixe */}
      <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[240px] border-r border-line/70 bg-[#ebedf0] lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] animate-slide-up bg-[#ebedf0] shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-sm font-semibold">{companyName}</span>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-white" aria-label="Fermer"><X className="size-5" /></button>
            </div>
            <div className="h-[calc(100%-3.5rem)]">{sidebar}</div>
          </aside>
        </div>
      )}

      <main className="pt-14 lg:pl-[240px]">
        <div className="mx-auto max-w-[1200px] px-3 py-5 sm:px-6 sm:py-7">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
