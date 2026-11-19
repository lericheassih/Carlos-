import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/** Plages indisponibles d'un appartement publié (aucune donnée client). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("apartment") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data, error } = await createPublicClient().rpc("get_unavailable_ranges", { p_apartment: id });
  if (error) return NextResponse.json({ error: "unavailable" }, { status: 500 });
  return NextResponse.json({ ranges: data ?? [] }, { headers: { "cache-control": "no-store" } });
}
