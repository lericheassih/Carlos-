"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Rangée horizontale qui défile au doigt (mobile) ou avec des flèches (ordinateur). */
export function ScrollRow({ children, label, header }: { children: ReactNode; label: string; header?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const update = () => {
    const el = ref.current; if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  useEffect(() => { update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, []);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  const btn = "grid size-8 place-items-center rounded-full border border-slate-300 bg-white transition hover:shadow-md disabled:cursor-default disabled:opacity-30 disabled:hover:shadow-none";
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">{header}</div>
        <div className={`hidden shrink-0 gap-2 ${edge.start && edge.end ? "" : "sm:flex"}`}>
        <button type="button" aria-label="Logements précédents" className={btn} disabled={edge.start} onClick={() => go(-1)}><ChevronLeft className="size-4" /></button>
        <button type="button" aria-label="Logements suivants" className={btn} disabled={edge.end} onClick={() => go(1)}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div ref={ref} onScroll={update} role="list" aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}
