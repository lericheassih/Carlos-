import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildSnapshot } from "@/lib/snapshot";
import { PageHeader } from "@/components/ui/PageHeader";
import { AptStatus } from "@/components/admin/StatusBadges";
import { ApartmentEditor } from "../ApartmentEditor";
import { loadEditorData } from "../data";

/** Comparaison stable de deux objets JSON (ordre des clés ignoré) */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${k}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

export default async function EditApartment({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const built = await buildSnapshot(supabase, id);
  if (!built) notFound();
  const d = await loadEditorData(id);
  const unpublished = built.row.status === "published" && stable(built.snapshot) !== stable(built.row.published);
  return (
    <>
      <PageHeader title={built.row.name} back="/admin/appartements" badge={<AptStatus s={built.row.status} />} description={built.row.reference} />
      <ApartmentEditor key={built.row.updated_at} apartment={built.row} amenities={d.amenities} selectedAmenities={d.selected} media={d.media}
        hasUnpublishedChanges={unpublished} defaultMinNights={d.defaultMinNights} />
    </>
  );
}
