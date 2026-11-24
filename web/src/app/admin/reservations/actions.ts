"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireManager } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";
import { isIsoDate } from "@/lib/dates";
import { pricingFromRow, quoteStay } from "@/lib/pricing";
import { revalidatePublic } from "@/lib/revalidate";
import type { ReservationStatus } from "@/lib/types";

const METHODS = ["cash", "tmoney", "flooz", "bank_transfer", "card", "other"] as const;
const Customer = z.object({
  full_name: z.string().trim().min(2, "Nom du client requis.").max(160),
  phone: z.string().trim().max(30).default(""),
  whatsapp: z.string().trim().max(30).default(""),
  email: z.string().trim().max(160).default("").refine((v) => !v || z.string().email().safeParse(v).success, "E-mail invalide."),
});
const Input = z.object({
  customer_id: z.string().uuid().nullable(),
  customer: Customer,
  apartment_id: z.string().uuid({ message: "Choisissez un appartement." }),
  check_in: z.string().refine(isIsoDate, "Date d'arrivée invalide."),
  check_out: z.string().refine(isIsoDate, "Date de départ invalide."),
  guests: z.coerce.number().int().min(1).max(100),
  price_per_night: z.coerce.number().int().min(0),
  extra_fees: z.coerce.number().int().min(0),
  discount: z.coerce.number().int().min(0),
  total_amount: z.coerce.number().int().min(0),
  payment_method: z.enum(METHODS).nullable(),
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
  source: z.enum(["admin", "website", "whatsapp", "phone", "other"]),
  notes: z.string().max(4000).default(""),
  initial_payment: z.coerce.number().int().min(0).default(0),
}).refine((v) => v.check_out > v.check_in, { message: "La date de départ doit être après la date d'arrivée.", path: ["check_out"] });

const norm = (p: string) => p.replace(/[^0-9+]/g, "");

export async function saveReservation(id: string | null, raw: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const v = parsed.data;
  const supabase = await createClient();

  // Client : existant ou nouveau (dédoublonné par téléphone)
  let customerId = v.customer_id;
  const c = { full_name: v.customer.full_name, phone: norm(v.customer.phone) || null, whatsapp: norm(v.customer.whatsapp) || null, email: v.customer.email || null };
  if (!customerId && (c.phone || c.whatsapp)) {
    const key = c.whatsapp || c.phone!;
    const { data } = await supabase.from("customers").select("id").or(`phone.eq.${key},whatsapp.eq.${key}`).limit(1).maybeSingle();
    customerId = data?.id ?? null;
  }
  if (customerId) {
    const { error } = await supabase.from("customers").update(c).eq("id", customerId);
    if (error) return { ok: false, error: pgError(error) };
  } else {
    const { data, error } = await supabase.from("customers").insert(c).select("id").single();
    if (error) return { ok: false, error: pgError(error) };
    customerId = data.id;
  }

  const row = {
    apartment_id: v.apartment_id, customer_id: customerId, check_in: v.check_in, check_out: v.check_out, guests: v.guests,
    price_per_night: v.price_per_night, extra_fees: v.extra_fees, discount: v.discount, total_amount: v.total_amount,
    payment_method: v.payment_method, status: v.status, source: v.source, notes: v.notes,
  };
  let resId = id;
  if (resId) {
    const { error } = await supabase.from("reservations").update(row).eq("id", resId);
    if (error) return { ok: false, error: pgError(error) };
  } else {
    const { data, error } = await supabase.from("reservations").insert(row).select("id").single();
    if (error) return { ok: false, error: pgError(error) };
    resId = data.id;
    if (v.initial_payment > 0) {
      const { error: pe } = await supabase.from("payments").insert({ reservation_id: resId, amount: v.initial_payment, method: v.payment_method ?? "cash", note: "Avance" });
      if (pe) return { ok: false, error: pgError(pe) };
    }
  }
  await supabase.rpc("refresh_reservation_statuses");
  revalidateAll(resId!);
  return { ok: true, data: { id: resId! }, message: id ? "Réservation mise à jour." : "Réservation créée." };
}

function revalidateAll(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/reservations/${id}`);
  revalidatePublic();
}

export async function setReservationStatus(id: string, status: ReservationStatus): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  await supabase.rpc("refresh_reservation_statuses");
  revalidateAll(id);
  const msg: Record<ReservationStatus, string> = {
    confirmed: "Réservation confirmée : les dates sont bloquées dans le calendrier.",
    cancelled: "Réservation annulée : les dates sont libérées.",
    pending: "Réservation remise en attente.",
    in_progress: "Séjour marqué en cours.",
    completed: "Séjour marqué comme terminé.",
  };
  return { ok: true, message: msg[status] };
}

export async function addPayment(reservationId: string, p: { amount: number; method: string; paid_at: string; note: string }): Promise<ActionResult> {
  await requireAdmin();
  const amount = Math.round(Number(p.amount));
  if (!amount) return { ok: false, error: "Montant invalide." };
  if (!METHODS.includes(p.method as (typeof METHODS)[number])) return { ok: false, error: "Mode de paiement invalide." };
  if (!isIsoDate(p.paid_at)) return { ok: false, error: "Date invalide." };
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({ reservation_id: reservationId, amount, method: p.method, paid_at: p.paid_at, note: p.note.slice(0, 300) });
  if (error) return { ok: false, error: pgError(error) };
  revalidateAll(reservationId);
  return { ok: true, message: amount > 0 ? "Paiement enregistré." : "Remboursement enregistré." };
}

export async function deletePayment(paymentId: string, reservationId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, error: pgError(error) };
  revalidateAll(reservationId);
  return { ok: true, message: "Paiement supprimé." };
}

export async function deleteReservation(id: string): Promise<ActionResult> {
  await requireManager();
  const supabase = await createClient();
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  revalidateAll();
  return { ok: true, message: "Réservation supprimée." };
}

/** Disponibilité + devis calculé sur les tarifs de l'appartement (aide à la saisie). */
export async function checkStay(apartmentId: string, checkIn: string, checkOut: string, guests: number, excludeId: string | null) {
  await requireAdmin();
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) return null;
  const supabase = await createClient();
  const [{ data: apt }, { data: res }, { data: blocks }] = await Promise.all([
    supabase.from("apartments").select("*").eq("id", apartmentId).maybeSingle(),
    supabase.from("reservations").select("id, reference, status, check_in, check_out, customer:customers(full_name)")
      .eq("apartment_id", apartmentId).in("status", ["pending", "confirmed", "in_progress"]).lt("check_in", checkOut).gt("check_out", checkIn),
    supabase.from("blocked_dates").select("start_date, end_date, reason").eq("apartment_id", apartmentId).lt("start_date", checkOut).gt("end_date", checkIn),
  ]);
  if (!apt) return null;
  const q = quoteStay(pricingFromRow(apt), checkIn, checkOut, guests);
  type R = { id: string; reference: string; status: ReservationStatus; check_in: string; check_out: string; customer: { full_name: string } | null };
  return {
    quote: { nights: q.nights, avgPerNight: q.avgPerNight, stayTotal: q.stayTotal, feesTotal: q.feesTotal, total: q.total },
    maxGuests: apt.max_guests as number,
    minNights: apt.min_nights as number,
    conflicts: ((res ?? []) as unknown as R[]).filter((r) => r.id !== excludeId).map((r) => ({ reference: r.reference, status: r.status, check_in: r.check_in, check_out: r.check_out, name: r.customer?.full_name ?? "" })),
    blocks: (blocks ?? []) as { start_date: string; end_date: string; reason: string }[],
  };
}

export async function searchCustomers(q: string) {
  await requireAdmin();
  const s = q.trim().replace(/[%,()]/g, "");
  if (s.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("id, full_name, phone, whatsapp, email")
    .or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,whatsapp.ilike.%${s}%,email.ilike.%${s}%`).limit(8);
  return data ?? [];
}
