import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";
import { ConsentControls } from "@/components/public/ConsentControls";

export const metadata: Metadata = { title: "Confidentialité" };
export const dynamic = "force-dynamic";

export default async function Privacy() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Confidentialité et mesure d&apos;audience</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-slate-700">
        <p><strong>{s.company_name}</strong> mesure l&apos;audience de ce site pour comprendre quels logements intéressent les visiteurs et d&apos;où ils viennent.</p>
        <h2 className="pt-2 text-xl font-semibold text-slate-900">Ce qui est collecté</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Un identifiant aléatoire et anonyme stocké dans votre navigateur (aucun lien avec votre identité).</li>
          <li>Les pages consultées, la source de visite (ex. Facebook, Google, campagne publicitaire) et le type d&apos;appareil.</li>
          <li>Le pays et la ville approximatifs déduits par notre hébergeur au moment de la visite. <strong>Votre adresse IP n&apos;est pas enregistrée.</strong></li>
          <li>Les clics sur les boutons WhatsApp et téléphone.</li>
        </ul>
        <h2 className="pt-2 text-xl font-semibold text-slate-900">Demandes de réservation</h2>
        <p>Les coordonnées saisies dans le formulaire (nom, téléphone, e-mail) servent uniquement au traitement de votre réservation et ne sont jamais revendues.</p>
        <h2 className="pt-2 text-xl font-semibold text-slate-900">Vos choix</h2>
        <ConsentControls />
        <p>Pour toute demande d&apos;accès ou de suppression de vos données, contactez-nous{s.email ? ` à ${s.email}` : ""}{s.phone ? ` ou au ${s.phone}` : ""}.</p>
      </div>
    </div>
  );
}
