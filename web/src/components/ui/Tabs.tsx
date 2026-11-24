import Link from "next/link";
import { cn } from "@/lib/cn";

export function LinkTabs({ items, active }: { items: { key: string; label: React.ReactNode; href: string }[]; active: string }) {
  return (
    <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((t) => (
        <Link key={t.key} href={t.href} scroll={false}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
            t.key === active ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-white/60 hover:text-ink")}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
