"use client";
/** Suivi d'audience first-party : identifiants anonymes, aucune donnée personnelle. */

export type TrackType = "page_view" | "apartment_view" | "pricing_view" | "whatsapp_click" | "phone_click" | "booking_start" | "booking_request" | "heartbeat" | "engaged";

const SESSION_TIMEOUT = 30 * 60 * 1000;
const LS = { visitor: "lm_vid", session: "lm_sid", sessionTs: "lm_sts", consent: "lm_consent", utm: "lm_utm" };

let consentMode: "notice" | "opt_in" = "notice";
export function setConsentMode(m: "notice" | "opt_in") { consentMode = m; }

function ls(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}
export function getConsent(): "granted" | "denied" | null {
  const v = ls()?.getItem(LS.consent);
  return v === "granted" || v === "denied" ? v : null;
}
export function setConsent(v: "granted" | "denied") {
  try { ls()?.setItem(LS.consent, v); } catch {}
  window.dispatchEvent(new CustomEvent("lm:consent", { detail: v }));
}
export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  const c = getConsent();
  if (c === "denied") return false;
  if (consentMode === "opt_in") return c === "granted";
  return true;
}

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0]! & (15 >> (+c / 4)))).toString(16));
}

let memory: { visitor?: string; session?: string; ts?: number } = {};
function ids(): { visitor: string; session: string; isNew: boolean } {
  const s = ls();
  let visitor = s?.getItem(LS.visitor) ?? memory.visitor;
  if (!visitor) { visitor = uuid(); try { s?.setItem(LS.visitor, visitor); } catch {} memory.visitor = visitor; }
  const now = Date.now();
  let session = s?.getItem(LS.session) ?? memory.session;
  const ts = Number(s?.getItem(LS.sessionTs) ?? memory.ts ?? 0);
  let isNew = false;
  // Nouvelle session après 30 min d'inactivité ou arrivée par une nouvelle campagne
  const hasUtm = /[?&]utm_source=/.test(location.search);
  if (!session || now - ts > SESSION_TIMEOUT || (hasUtm && s?.getItem(LS.utm) !== location.search)) {
    session = uuid();
    isNew = true;
    try { s?.setItem(LS.session, session); if (hasUtm) s?.setItem(LS.utm, location.search); } catch {}
    memory.session = session;
  }
  try { s?.setItem(LS.sessionTs, String(now)); } catch {}
  memory = { ...memory, ts: now };
  return { visitor, session, isNew };
}

let landing: { referrer: string | null; utm: Record<string, string | null>; click_ids: Record<string, boolean> } | null = null;
function attribution() {
  if (!landing) {
    const p = new URLSearchParams(location.search);
    landing = {
      referrer: document.referrer || null,
      utm: { source: p.get("utm_source"), medium: p.get("utm_medium"), campaign: p.get("utm_campaign"), content: p.get("utm_content"), term: p.get("utm_term") },
      click_ids: { fbclid: p.has("fbclid"), gclid: p.has("gclid"), ttclid: p.has("ttclid") },
    };
  }
  return landing;
}

export function track(type: TrackType, opts: { apartment_id?: string | null; metadata?: Record<string, string | number | boolean | null> } = {}) {
  if (!trackingAllowed()) return;
  try {
    const { visitor, session } = ids();
    const a = attribution();
    const body = JSON.stringify({
      event_id: uuid(), session_id: session, visitor_id: visitor, type, path: location.pathname,
      apartment_id: opts.apartment_id ?? null, metadata: opts.metadata ?? {}, referrer: a.referrer, utm: a.utm, click_ids: a.click_ids,
    });
    const urgent = type === "whatsapp_click" || type === "phone_click";
    if (urgent && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    if (w.gtag && type !== "heartbeat" && type !== "engaged" && type !== "page_view") w.gtag("event", type, { apartment_id: opts.apartment_id ?? undefined });
  } catch {
    /* le suivi ne doit jamais casser le site */
  }
}
