export const TZ = "Africa/Lome";

export function fcfa(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0));
  return new Intl.NumberFormat("fr-FR").format(v).replace(/[  ]/g, " ") + " FCFA";
}

export function num(n: number | null | undefined, digits = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number(n ?? 0)).replace(/[  ]/g, " ");
}

export function pct(n: number | null | undefined): string {
  return `${num(n, 1)} %`;
}

/** Date ISO (YYYY-MM-DD) -> "12 déc. 2026" */
export function dateFr(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00Z") : new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: TZ }).format(d);
}

export function dateTimeFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function durationFr(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, "0")} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

const REGION = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
export function countryName(code: string | null | undefined): string {
  if (!code || code === "??" || code === "XX") return "Inconnu";
  try {
    return REGION?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2 || code === "??") return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "appartement";
}

export function waNumber(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[^0-9]/g, "");
}
export function waLink(number: string | null | undefined, message: string): string {
  return `https://wa.me/${waNumber(number)}?text=${encodeURIComponent(message)}`;
}
