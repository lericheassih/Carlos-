"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/** Champ de recherche synchronisé avec l'URL (?q=) */
export function SearchBox({ placeholder = "Rechercher…", param = "q" }: { placeholder?: string; param?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [v, setV] = useState(sp.get(param) ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get(param) ?? "") === v) return;
      const next = new URLSearchParams(sp.toString());
      if (v) next.set(param, v); else next.delete(param);
      next.delete("page");
      router.replace(`${path}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [v, sp, param, path, router]);
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input name={param} className="input pl-9" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
    </label>
  );
}
