import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApartmentEditor } from "../ApartmentEditor";
import { loadEditorData } from "../data";

export default async function NewApartment() {
  await requireAdmin();
  const d = await loadEditorData(null);
  return (
    <>
      <PageHeader title="Ajouter un appartement" back="/admin/appartements" />
      <ApartmentEditor apartment={null} amenities={d.amenities} selectedAmenities={[]} media={[]} hasUnpublishedChanges={false} defaultMinNights={d.defaultMinNights} />
    </>
  );
}
