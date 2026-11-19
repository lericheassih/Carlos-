import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { browserOf, classifySource, deviceOf, isBot, osOf } from "@/lib/analytics/classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (max: number) => z.string().max(max).optional().nullable();
const Body = z.object({
  event_id: z.string().uuid(),
  session_id: z.string().uuid(),
  visitor_id: z.string().uuid(),
  type: z.enum(["page_view", "apartment_view", "pricing_view", "whatsapp_click", "phone_click", "booking_start", "booking_request", "heartbeat", "engaged"]),
  path: z.string().max(500).optional().nullable(),
  apartment_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).optional(),
  referrer: str(1000),
  utm: z
    .object({ source: str(150), medium: str(150), campaign: str(200), content: str(200), term: str(200) })
    .partial()
    .optional(),
  click_ids: z.object({ fbclid: z.boolean(), gclid: z.boolean(), ttclid: z.boolean() }).partial().optional(),
});

function header(req: NextRequest, name: string): string | null {
  const v = req.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  // Robots, aperçus de liens et préchargements : ignorés
  if (isBot(ua) || req.headers.get("purpose") === "prefetch" || req.headers.get("sec-purpose")?.includes("prefetch")) {
    return new NextResponse(null, { status: 204 });
  }
  // N'accepter que les requêtes émises depuis le site lui-même
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return new NextResponse(null, { status: 204 });
    } catch {
      return new NextResponse(null, { status: 204 });
    }
  }

  let body: z.infer<typeof Body>;
  try {
    const raw = await req.text();
    if (raw.length > 8000) return new NextResponse(null, { status: 413 });
    body = Body.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Géolocalisation fournie par l'hébergeur (Vercel / Cloudflare). Jamais devinée.
  const country = (header(req, "x-vercel-ip-country") ?? header(req, "cf-ipcountry"))?.toUpperCase() ?? null;
  const city = header(req, "x-vercel-ip-city") ?? header(req, "cf-ipcity");

  const src = classifySource({
    referrer: body.referrer,
    host,
    utm_source: body.utm?.source,
    utm_medium: body.utm?.medium,
    click_ids: body.click_ids,
  });

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("ingest_event", {
    p_event_id: body.event_id,
    p_session_id: body.session_id,
    p_visitor_id: body.visitor_id,
    p_type: body.type,
    p_path: body.path ?? null,
    p_apartment: body.apartment_id ?? null,
    p_metadata: body.metadata ?? {},
    p_session: {
      referrer: body.referrer ? body.referrer.slice(0, 500) : null,
      referrer_domain: src.referrer_domain,
      channel: src.channel,
      is_paid: src.is_paid,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      utm_content: body.utm?.content ?? null,
      utm_term: body.utm?.term ?? null,
      country: country && /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null,
      city: city ? city.slice(0, 100) : null,
      device: deviceOf(ua),
      browser: browserOf(ua),
      os: osOf(ua),
    },
  });
  if (error) {
    console.error("[track]", error.message);
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
