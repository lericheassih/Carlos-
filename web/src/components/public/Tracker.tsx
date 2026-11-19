"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { getConsent, setConsent, setConsentMode, track, trackingAllowed } from "@/lib/analytics/client";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Pages vues, présence en temps réel (battement toutes les 20 s) et engagement. */
export function Tracker({ consentMode }: { consentMode: "notice" | "opt_in" }) {
  setConsentMode(consentMode);
  const path = usePathname();
  const last = useRef<string | null>(null);
  const [consent, setC] = useState<"granted" | "denied" | null | "unknown">("unknown");

  useEffect(() => {
    setC(getConsent());
    const on = (e: Event) => setC((e as CustomEvent).detail);
    window.addEventListener("lm:consent", on);
    return () => window.removeEventListener("lm:consent", on);
  }, []);

  useEffect(() => {
    if (last.current === path) return;
    last.current = path;
    track("page_view");
  }, [path, consent]);

  useEffect(() => {
    let visibleMs = 0, lastTick = Date.now(), engagedSent = false;
    const beat = setInterval(() => {
      if (document.visibilityState === "visible") track("heartbeat");
    }, 20000);
    const tick = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible") visibleMs += now - lastTick;
      lastTick = now;
      if (!engagedSent && visibleMs >= 10000) { engagedSent = true; track("engaged"); }
    }, 1000);
    const onVis = () => { if (document.visibilityState === "visible") track("heartbeat"); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(beat); clearInterval(tick); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const showBanner = consent === null;
  const gaAllowed = !!GA_ID && consent === "granted" && trackingAllowed();

  return (
    <>
      {gaAllowed && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {showBanner && (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-xl sm:bottom-5" role="dialog" aria-label="Mesure d'audience">
          <p className="text-slate-700">
            Nous mesurons l&apos;audience de ce site de façon anonyme (pages consultées, provenance) pour améliorer nos services.
            Aucune donnée personnelle n&apos;est collectée. <a href="/confidentialite" className="underline">En savoir plus</a>
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setConsent("denied")} className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100">Refuser</button>
            <button onClick={() => setConsent("granted")} className="rounded-lg bg-[var(--site-primary)] px-4 py-2 font-medium text-white">Accepter</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Déclenche un événement à l'affichage (ex. consultation d'un appartement). */
export function TrackOnView({ type, apartmentId }: { type: "apartment_view" | "pricing_view"; apartmentId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (type === "apartment_view") { track(type, { apartment_id: apartmentId }); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { track(type, { apartment_id: apartmentId }); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [type, apartmentId]);
  return <div ref={ref} aria-hidden />;
}
