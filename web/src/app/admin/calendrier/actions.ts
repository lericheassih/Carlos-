"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { pgError, type ActionResult } from "@/lib/action-result";
import { isIsoDate } from "@/lib/dates";
import { revalidatePublic } from "@/lib/revalidate";

function refresh() {
  revalidatePath("/admin/calendrier");
  revalidatePath("/admin/tarifs");
  revalidatePublic();
}

export async function blockDates(apartmentIds: string[], start: string, end: string, reason: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isIsoDate(start) || !isIsoDate(end) || end <= start) return { ok: false, error: "Période invalide (la fin est exclue, comme une date de départ)." };
  if (!apartmentIds.length) return { ok: false, error: "Choisissez au moins un appartement." };
  const supabase = await createClient();
  const errors: string[] = [];
  for (const id of apartmentIds) {
    const { error } = await supabase.from("blocked_dates").insert({ apartment_id: id, start_date: start, end_date: end, reason: reason.slice(0, 200) });
    if (error) errors.push(error.code === "23P01" ? "une période bloquée existe déjà sur ces dates" : pgError(error));
  }
  refresh();
  if (errors.length) return { ok: false, error: `Blocage partiel : ${[...new Set(errors)].join(" ; ")}` };
  return { ok: true, message: "Dates bloquées : elles ne sont plus réservables sur le site." };
}

export async function unblock(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  refresh();
  return { ok: true, message: "Dates débloquées." };
}

export async function moveReservation(id: string, checkIn: string, checkOut: string, apartmentId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) return { ok: false, error: "Dates invalides." };
  const supabase = await createClient();
  const { data: r } = await supabase.from("reservations").select("price_per_night, extra_fees, discount, check_in, check_out, total_amount").eq("id", id).maybeSingle();
  if (!r) return { ok: false, error: "Réservation introuvable." };
  const oldNights = (Date.parse(r.check_out) - Date.parse(r.check_in)) / 86400000;
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  // Si la durée change, le total est ajusté au prix moyen par nuit enregistré
  const total = nights === oldNights ? r.total_amount : Math.max(0, r.price_per_night * nights + r.extra_fees - r.discount);
  const { error } = await supabase.from("reservations").update({ check_in: checkIn, check_out: checkOut, apartment_id: apartmentId, total_amount: total }).eq("id", id);
  if (error) return { ok: false, error: pgError(error) };
  await supabase.rpc("refresh_reservation_statuses");
  refresh();
  revalidatePath(`/admin/reservations/${id}`);
  return { ok: true, message: nights === oldNights ? "Dates modifiées." : `Dates modifiées · total recalculé (${nights} nuits).` };
}
