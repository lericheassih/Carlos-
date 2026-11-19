import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Conditions de réservation" };
export const dynamic = "force-dynamic";

export default async function Conditions() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Conditions de réservation</h1>
      <div className="mt-6 space-y-6 leading-relaxed text-slate-700">
        {s.booking_conditions ? <p className="whitespace-pre-line">{s.booking_conditions}</p> : <p>Les conditions de réservation vous sont communiquées lors de votre demande. Contactez-nous pour toute question.</p>}
        {s.cancellation_policy && (<><h2 className="text-xl font-semibold text-slate-900">Annulation</h2><p className="whitespace-pre-line">{s.cancellation_policy}</p></>)}
        <p className="text-sm text-slate-500">Les conditions propres à chaque logement figurent sur sa page.</p>
      </div>
    </div>
  );
}
