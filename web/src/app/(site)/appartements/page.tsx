import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getApartments, getAvailableIds } from "@/lib/public-data";
import { ApartmentCard } from "@/components/public/ApartmentCard";
import { displayNightPrice } from "@/lib/pricing";
import { isIsoDate, todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Nos appartements meublés", alternates: { canonical: "/appartements" } };

type SP = { prix_min?: string; prix_max?: string; quartier?: string; chambres?: string; arrivee?: string; depart?: string; voyageurs?: string; eq?: string | string[]; tri?: string };

export default async function Catalog({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await getApartments();
  const today = todayIso();
  const eq = (Array.isArray(sp.eq) ? sp.eq : sp.eq ? [sp.eq] : []).filter(Boolean);
  const min = Number(sp.prix_min) || 0, max = Number(sp.prix_max) || 0;
  const rooms = Number(sp.chambres) || 0, guests = Number(sp.voyageurs) || 0;
  const hasDates = isIsoDate(sp.arrivee) && isIsoDate(sp.depart) && sp.depart! > sp.arrivee! && sp.arrivee! >= today;
  const free = hasDates ? await getAvailableIds(sp.arrivee!, sp.depart!) : null;

  let list = all.filter((a) => {
    const p = displayNightPrice(a.pricing, today).price;
    if (min && p < min) return false;
    if (max && p > max) return false;
    if (sp.quartier && a.neighborhood !== sp.quartier) return false;
    if (rooms && a.bedrooms < rooms) return false;
    if (guests && a.max_guests < guests) return false;
    if (eq.length && !eq.every((id) => a.amenities.some((x) => x.id === id && x.included !== false))) return false;
    if (free && !free.has(a.id)) return false;
    return true;
  });
  if (sp.tri === "prix") list = [...list].sort((x, y) => displayNightPrice(x.pricing, today).price - displayNightPrice(y.pricing, today).price);
  if (sp.tri === "prix_desc") list = [...list].sort((x, y) => displayNightPrice(y.pricing, today).price - displayNightPrice(x.pricing, today).price);

  const neighborhoods = [...new Set(all.map((a) => a.neighborhood).filter(Boolean))].sort();
  const amenities = [...new Map(all.flatMap((a) => a.amenities.filter((x) => x.included !== false)).map((x) => [x.id, x])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const active = Boolean(min || max || sp.quartier || rooms || guests || eq.length || hasDates);
  const q = new URLSearchParams();
  if (hasDates) { q.set("arrivee", sp.arrivee!); q.set("depart", sp.depart!); }
  if (guests) q.set("voyageurs", String(guests));
  const carry = q.toString() ? `?${q.toString()}` : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Nos appartements meublés</h1>
      <p className="mt-2 text-slate-600">{list.length} logement{list.length > 1 ? "s" : ""}{hasDates ? " disponibles sur vos dates" : ""}</p>

      <form method="get" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm"><span className="mb-1 block font-medium text-slate-700">Arrivée</span>
            <input type="date" name="arrivee" min={today} defaultValue={sp.arrivee} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
          <label className="text-sm"><span className="mb-1 block font-medium text-slate-700">Départ</span>
            <input type="date" name="depart" min={today} defaultValue={sp.depart} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
          <label className="text-sm"><span className="mb-1 block font-medium text-slate-700">Voyageurs</span>
            <input type="number" name="voyageurs" min={1} max={30} defaultValue={sp.voyageurs} placeholder="2" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
          <label className="text-sm"><span className="mb-1 block font-medium text-slate-700">Quartier</span>
            <select name="quartier" defaultValue={sp.quartier ?? ""} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3">
              <option value="">Tous</option>
              {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
            </select></label>
          <div className="flex items-end gap-2">
            <button className="btn-brand h-11 flex-1 rounded-lg px-4 text-sm font-semibold">Rechercher</button>
          </div>
        </div>
        <details className="mt-3 group" open={Boolean(min || max || rooms || eq.length)}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-700"><SlidersHorizontal className="size-4" /> Plus de filtres</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm"><span className="mb-1 block text-slate-600">Prix min. / nuit (FCFA)</span>
              <input type="number" name="prix_min" min={0} step={5000} defaultValue={sp.prix_min} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">Prix max. / nuit (FCFA)</span>
              <input type="number" name="prix_max" min={0} step={5000} defaultValue={sp.prix_max} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">Chambres (minimum)</span>
              <select name="chambres" defaultValue={sp.chambres ?? ""} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3">
                <option value="">Indifférent</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">Trier par</span>
              <select name="tri" defaultValue={sp.tri ?? ""} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3">
                <option value="">Recommandés</option><option value="prix">Prix croissant</option><option value="prix_desc">Prix décroissant</option>
              </select></label>
          </div>
          {amenities.length > 0 && (
            <fieldset className="mt-3">
              <legend className="mb-2 text-sm text-slate-600">Équipements</legend>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] has-[:checked]:border-[var(--site-primary)] has-[:checked]:bg-[var(--site-primary)] has-[:checked]:text-white">
                    <input type="checkbox" name="eq" value={a.id} defaultChecked={eq.includes(a.id)} className="sr-only" />{a.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </details>
        {active && <Link href="/appartements" className="mt-3 inline-block text-sm font-medium text-[var(--site-primary)] hover:underline">Effacer les filtres</Link>}
      </form>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="font-medium">{all.length === 0 ? "Nos appartements seront bientôt en ligne." : "Aucun appartement ne correspond à ces critères."}</p>
          {all.length > 0 && <Link href="/appartements" className="mt-2 inline-block text-sm text-[var(--site-primary)] hover:underline">Voir tous les appartements</Link>}
        </div>
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => <ApartmentCard key={a.id} a={a} priority={i < 3} query={carry} />)}
        </div>
      )}
    </div>
  );
}
