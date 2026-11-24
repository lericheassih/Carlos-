"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type T = { id: number; kind: "success" | "error"; text: string };
const EVT = "app:toast";

export function toast(text: string, kind: T["kind"] = "success") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: { text, kind } }));
}
toast.error = (text: string) => toast(text, "error");

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<T, "id">;
      const id = ++n;
      setItems((l) => [...l, { ...d, id }]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), d.kind === "error" ? 7000 : 3500);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex max-w-md animate-slide-up items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg ${t.kind === "error" ? "bg-red-600 text-white" : "bg-ink text-white"}`}>
          {t.kind === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span>{t.text}</span>
          <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="ml-1 opacity-70 hover:opacity-100" aria-label="Fermer"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  );
}
