import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-slate-500">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-slate-600">Ce logement n&apos;est peut-être plus disponible.</p>
        <Link href="/appartements" className="mt-5 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Voir les appartements</Link>
      </div>
    </div>
  );
}
