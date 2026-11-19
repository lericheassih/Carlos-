import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { quoteStay } from "@/lib/pricing";
import { isIsoDate } from "@/lib/dates";
import type { ApartmentSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  apartment_id: z.string().uuid(),
  check_in: z.string().refine(isIsoDate),
  check_out: z.string().refine(isIsoDate),
  guests: z.number().int().min(1).max(50),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().max(1500).optional(),
  website: z.string().max(0).optional(), // pot de miel anti-robots
});

// Limitation simple par instance (complétée par les contraintes en base)
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(key, list);
  return list.length > 5;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Veuillez vérifier les informations saisies (nom, téléphone, dates)." }, { status: 400 });
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Trop de demandes. Réessayez dans quelques minutes ou contactez-nous sur WhatsApp." }, { status: 429 });

  const supabase = createServiceClient();
  const { data: settings } = await supabase.from("app_settings").select("booking").eq("id", 1).maybeSingle();
  if (settings?.booking?.accept_website_requests === false) {
    return NextResponse.json({ error: "Les demandes en ligne sont momentanément fermées. Contactez-nous sur WhatsApp." }, { status: 403 });
  }

  // Le prix est recalculé côté serveur à partir des tarifs publiés (jamais repris du navigateur)
  const { data: apt } = await supabase.from("public_apartments").select("published").eq("id", body.apartment_id).maybeSingle();
  if (!apt?.published) return NextResponse.json({ error: "Cet appartement n'est plus disponible." }, { status: 404 });
  const snap = apt.published as ApartmentSnapshot;
  const q = quoteStay(snap.pricing, body.check_in, body.check_out, body.guests);

  const { data, error } = await supabase.rpc("submit_booking_request", {
    p_apartment: body.apartment_id,
    p_check_in: body.check_in,
    p_check_out: body.check_out,
    p_guests: body.guests,
    p_full_name: body.full_name,
    p_phone: body.phone,
    p_email: body.email || null,
    p_message: body.message ?? "",
    p_price_per_night: q.avgPerNight,
    p_extra_fees: q.feesTotal,
    p_total: q.total,
  });
  if (error) {
    const msg = error.code === "P0001" ? error.message : "Impossible d'enregistrer la demande pour le moment.";
    if (error.code !== "P0001") console.error("[booking-request]", error);
    return NextResponse.json({ error: msg }, { status: 409 });
  }
  revalidatePath("/admin", "layout");
  return NextResponse.json({ ok: true, reference: (data as { reference: string }).reference, total: q.total });
}
