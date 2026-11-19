import type { Pricing } from "./types";
import { addDays, diffDays } from "./dates";

export type Quote = {
  nights: number;
  guests: number;
  baseTotal: number;        // nuits au tarif standard (sans promo ni dégressif)
  stayTotal: number;        // hébergement après promo / tarifs semaine-mois
  savings: number;          // baseTotal - stayTotal
  fees: { label: string; amount: number }[];
  feesTotal: number;
  total: number;
  avgPerNight: number;
  usesWeekly: boolean;
  usesMonthly: boolean;
  promoNights: number;
  belowMinimum: boolean;
};

export function promoActiveOn(p: Pricing, day: string): boolean {
  if (!p.promo_night || p.promo_night <= 0) return false;
  if (p.promo_start && day < p.promo_start) return false;
  if (p.promo_end && day > p.promo_end) return false;
  return true;
}

/** Tarif d'une nuit donnée (promotion si active ce jour-là). */
export function nightlyRate(p: Pricing, day: string): number {
  return promoActiveOn(p, day) ? Math.min(p.promo_night!, p.night) : p.night;
}

/** Prix "à partir de" affiché sur les cartes (promo active aujourd'hui incluse). */
export function displayNightPrice(p: Pricing, today: string): { price: number; original: number | null } {
  const r = nightlyRate(p, today);
  return { price: r, original: r < p.night ? p.night : null };
}

/**
 * Calcule le prix d'un séjour. Le moteur choisit automatiquement la combinaison
 * la plus avantageuse pour le client entre nuits, semaines (7 nuits) et mois (30 nuits).
 */
export function quoteStay(p: Pricing, checkIn: string, checkOut: string, guests = 1): Quote {
  const n = Math.max(0, diffDays(checkIn, checkOut));
  const rates: number[] = [];
  for (let i = 0; i < n; i++) rates.push(nightlyRate(p, addDays(checkIn, i)));

  const cost: number[] = [0];
  const choice: ("n" | "w" | "m")[] = [];
  for (let i = 1; i <= n; i++) {
    let best = cost[i - 1]! + rates[i - 1]!;
    let c: "n" | "w" | "m" = "n";
    if (p.week && p.week > 0 && i >= 7 && cost[i - 7]! + p.week < best) { best = cost[i - 7]! + p.week; c = "w"; }
    if (p.month && p.month > 0 && i >= 30 && cost[i - 30]! + p.month < best) { best = cost[i - 30]! + p.month; c = "m"; }
    cost[i] = best;
    choice[i] = c;
  }
  let usesWeekly = false, usesMonthly = false;
  for (let i = n; i > 0; ) {
    const c = choice[i];
    if (c === "m") { usesMonthly = true; i -= 30; } else if (c === "w") { usesWeekly = true; i -= 7; } else i -= 1;
  }

  const stayTotal = cost[n] ?? 0;
  const baseTotal = n * p.night;
  const fees = (p.extra_fees ?? [])
    .filter((f) => f && f.label && Number(f.amount) > 0)
    .map((f) => ({
      label: f.label + (f.per === "night" ? ` (${n} nuit${n > 1 ? "s" : ""})` : f.per === "guest" ? ` (${guests} pers.)` : ""),
      amount: Math.round(Number(f.amount) * (f.per === "night" ? n : f.per === "guest" ? guests : 1)),
    }));
  const feesTotal = fees.reduce((s, f) => s + f.amount, 0);

  return {
    nights: n,
    guests,
    baseTotal,
    stayTotal,
    savings: Math.max(0, baseTotal - stayTotal),
    fees,
    feesTotal,
    total: stayTotal + feesTotal,
    avgPerNight: n ? Math.round(stayTotal / n) : 0,
    usesWeekly,
    usesMonthly,
    promoNights: rates.filter((r) => r < p.night).length,
    belowMinimum: n < (p.min_nights || 1),
  };
}

export function pricingFromRow(a: {
  price_night: number; price_week: number | null; price_month: number | null; promo_price_night: number | null;
  promo_label: string | null; promo_start: string | null; promo_end: string | null; extra_fees: unknown; min_nights: number; pricing_conditions: string;
}): Pricing {
  return {
    night: a.price_night,
    week: a.price_week,
    month: a.price_month,
    promo_night: a.promo_price_night,
    promo_label: a.promo_label,
    promo_start: a.promo_start,
    promo_end: a.promo_end,
    extra_fees: Array.isArray(a.extra_fees) ? (a.extra_fees as Pricing["extra_fees"]) : [],
    min_nights: a.min_nights,
    conditions: a.pricing_conditions,
  };
}
