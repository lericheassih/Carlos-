import { TZ } from "./format";

/** Date du jour à Lomé au format YYYY-MM-DD */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}
export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}
export function diffDays(a: string, b: string): number {
  return Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86400000);
}
export function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseIso(s).getTime());
}
export function startOfMonth(s: string): string {
  return s.slice(0, 8) + "01";
}
export function endOfMonth(s: string): string {
  const d = parseIso(startOfMonth(s));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return toIso(d);
}
/** Lundi de la semaine */
export function startOfWeek(s: string): string {
  const d = parseIso(s);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(s, -dow);
}

export type PeriodKey = "today" | "week" | "month" | "quarter" | "year";
export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "quarter", label: "Ce trimestre" },
  { key: "year", label: "Cette année" },
];

export function periodRange(key: PeriodKey, today = todayIso()): { from: string; to: string; bucket: "day" | "week" | "month" } {
  const y = today.slice(0, 4);
  switch (key) {
    case "today":
      return { from: today, to: today, bucket: "day" };
    case "week":
      return { from: startOfWeek(today), to: addDays(startOfWeek(today), 6), bucket: "day" };
    case "quarter": {
      const m = Number(today.slice(5, 7));
      const qm = Math.floor((m - 1) / 3) * 3 + 1;
      const from = `${y}-${String(qm).padStart(2, "0")}-01`;
      const to = endOfMonth(`${y}-${String(qm + 2).padStart(2, "0")}-01`);
      return { from, to, bucket: "week" };
    }
    case "year":
      return { from: `${y}-01-01`, to: `${y}-12-31`, bucket: "month" };
    case "month":
    default:
      return { from: startOfMonth(today), to: endOfMonth(today), bucket: "day" };
  }
}

/** Chevauchement de deux plages [a1,a2) et [b1,b2) */
export function overlaps(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 < b2 && b1 < a2;
}
