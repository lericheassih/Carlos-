import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // protection contre l'injection de formules
    return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\n");
}

/** Export des données (sauvegarde personnelle, ouverture dans Excel). */
export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await getAdmin();
  if (!admin || admin.role === "staff") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { type } = await params;
  const supabase = await createClient();
  let rows: Record<string, unknown>[] = [];
  if (type === "reservations") {
    const { data } = await supabase.from("reservations").select("reference, status, check_in, check_out, nights, guests, price_per_night, extra_fees, discount, total_amount, amount_paid, payment_status, payment_method, source, notes, created_at, apartment:apartments(name), customer:customers(full_name, phone, whatsapp, email)").order("check_in");
    rows = (data ?? []).map((r) => {
      const { apartment, customer, ...rest } = r as unknown as Record<string, unknown> & { apartment: { name: string } | null; customer: Record<string, string> | null };
      return { ...rest, appartement: apartment?.name, client: customer?.full_name, telephone: customer?.phone, whatsapp: customer?.whatsapp, email: customer?.email };
    });
  } else if (type === "clients") {
    const { data } = await supabase.from("customer_stats").select("full_name, phone, whatsapp, email, country, stays, total_spent, last_check_in, notes, created_at").order("full_name");
    rows = data ?? [];
  } else if (type === "paiements") {
    const { data } = await supabase.from("payments").select("paid_at, amount, method, note, reservation:reservations(reference)").order("paid_at");
    rows = (data ?? []).map((p) => { const { reservation, ...rest } = p as unknown as Record<string, unknown> & { reservation: { reference: string } | null }; return { ...rest, reservation: reservation?.reference }; });
  } else if (type === "appartements") {
    const { data } = await supabase.from("apartments").select("reference, name, slug, status, city, neighborhood, address, property_type, bedrooms, living_rooms, bathrooms, max_guests, price_night, price_week, price_2weeks, price_3weeks, price_month, promo_price_night, min_nights, created_at").order("reference");
    rows = data ?? [];
  } else return NextResponse.json({ error: "unknown" }, { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${type}-${date}.csv"` } });
}
