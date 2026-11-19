"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";

type Img = { url: string; alt?: string };

/**
 * Visionneuse plein écran : double-tap / double-clic ou boutons pour zoomer,
 * pincement à deux doigts, glisser pour se déplacer, balayer pour changer de photo.
 */
export function ZoomViewer({ images, index, onClose }: { images: Img[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [s, setS] = useState(1);
  const [t, setT] = useState({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const g = useRef<{ dist: number; scale: number; start: { x: number; y: number }; t: { x: number; y: number }; moved: boolean; lastTap: number }>({ dist: 0, scale: 1, start: { x: 0, y: 0 }, t: { x: 0, y: 0 }, moved: false, lastTap: 0 });
  const n = images.length;

  const reset = () => { setS(1); setT({ x: 0, y: 0 }); };
  const go = useCallback((d: number) => { setI((v) => (v + d + n) % n); setS(1); setT({ x: 0, y: 0 }); }, [n]);
  const clampT = (x: number, y: number, sc: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return { x, y };
    const mx = (r.width * (sc - 1)) / 2, my = (r.height * (sc - 1)) / 2;
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };
  const zoomAt = (cx: number, cy: number, sc: number) => {
    const r = box.current!.getBoundingClientRect();
    const ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    setS(sc);
    setT(sc === 1 ? { x: 0, y: 0 } : clampT(-ox * (sc - 1), -oy * (sc - 1), sc));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [go, onClose]);

  function down(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.current.values()];
    g.current.moved = false;
    if (p.length === 2) { g.current.dist = Math.hypot(p[0]!.x - p[1]!.x, p[0]!.y - p[1]!.y); g.current.scale = s; }
    else { g.current.start = { x: e.clientX, y: e.clientY }; g.current.t = t; }
  }
  function move(e: React.PointerEvent) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.current.values()];
    if (p.length === 2) {
      const d = Math.hypot(p[0]!.x - p[1]!.x, p[0]!.y - p[1]!.y);
      const sc = Math.max(1, Math.min(4, (g.current.scale * d) / (g.current.dist || d)));
      setS(sc); setT((v) => clampT(v.x, v.y, sc)); g.current.moved = true;
      return;
    }
    const dx = e.clientX - g.current.start.x, dy = e.clientY - g.current.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.current.moved = true;
    if (s > 1) setT(clampT(g.current.t.x + dx, g.current.t.y + dy, s));
  }
  function up(e: React.PointerEvent) {
    const wasPinch = pts.current.size === 2;
    pts.current.delete(e.pointerId);
    if (wasPinch) { if (s < 1.05) reset(); return; }
    const dx = e.clientX - g.current.start.x;
    if (s === 1 && g.current.moved && Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); return; }
    if (!g.current.moved) {
      const now = Date.now();
      if (now - g.current.lastTap < 300) { zoomAt(e.clientX, e.clientY, s > 1 ? 1 : 2.5); g.current.lastTap = 0; }
      else g.current.lastTap = now;
    }
  }

  const img = images[i]!;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Photo agrandie">
      <div className="flex items-center justify-between px-3 py-3">
        <button onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Fermer"><X className="size-6" /></button>
        <span className="text-sm tabular-nums">{i + 1} / {n}</span>
        <div className="flex gap-1">
          <button onClick={() => { const r = box.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, Math.max(1, s - 1)); }} disabled={s <= 1} className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30" aria-label="Dézoomer"><Minus className="size-5" /></button>
          <button onClick={() => { const r = box.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, Math.min(4, s + 1)); }} disabled={s >= 4} className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30" aria-label="Zoomer"><Plus className="size-5" /></button>
        </div>
      </div>
      <div ref={box} className="relative flex-1 touch-none select-none overflow-hidden" style={{ cursor: s > 1 ? "grab" : "zoom-in" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onWheel={(e) => zoomAt(e.clientX, e.clientY, Math.max(1, Math.min(4, s * (e.deltaY < 0 ? 1.25 : 0.8))))}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={img.alt ?? ""} draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${s})`, transition: pts.current.size ? "none" : "transform .2s ease-out" }} />
        {n > 1 && s === 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25 sm:grid" aria-label="Précédente"><ChevronLeft /></button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25 sm:grid" aria-label="Suivante"><ChevronRight /></button>
          </>
        )}
      </div>
      <p className="py-3 text-center text-xs text-white/60">{s > 1 ? "Glissez pour vous déplacer · double-tap pour revenir" : "Double-tap ou pincez pour zoomer · balayez pour changer de photo"}</p>
    </div>
  );
}
