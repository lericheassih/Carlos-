"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

/** Cœur « favori » sur les photos (mémorisé dans le navigateur du visiteur). */
export function FavHeart({ aptId }: { aptId: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn((JSON.parse(localStorage.getItem("lm_fav") || "[]") as string[]).includes(aptId)); } catch {}
  }, [aptId]);
  return (
    <button type="button" aria-label={on ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={on}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        try {
          const l = JSON.parse(localStorage.getItem("lm_fav") || "[]") as string[];
          const next = l.includes(aptId) ? l.filter((x) => x !== aptId) : [...l, aptId];
          localStorage.setItem("lm_fav", JSON.stringify(next));
          setOn(next.includes(aptId));
        } catch { setOn((v) => !v); }
      }}
      className="absolute right-3 top-3 z-10 grid size-8 place-items-center transition active:scale-90">
      <Heart className={`size-6 drop-shadow ${on ? "fill-[var(--site-primary)] text-white" : "fill-black/50 text-white"}`} strokeWidth={2} />
    </button>
  );
}
