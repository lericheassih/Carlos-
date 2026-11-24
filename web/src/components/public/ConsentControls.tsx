"use client";
import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/analytics/client";

export function ConsentControls() {
  const [c, setC] = useState<string | null>(null);
  useEffect(() => setC(getConsent()), []);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm">
      <span>Mesure d&apos;audience : <strong>{c === "denied" ? "refusée" : c === "granted" ? "acceptée" : "non choisie"}</strong></span>
      <button onClick={() => { setConsent("granted"); setC("granted"); }} className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white">Accepter</button>
      <button onClick={() => { setConsent("denied"); setC("denied"); }} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium">Refuser</button>
    </div>
  );
}
