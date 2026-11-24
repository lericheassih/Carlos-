import Link from "next/link";
import type { PublicApartment } from "@/lib/public-data";
import { ApartmentCard } from "./ApartmentCard";
import { ScrollRow } from "./ScrollRow";

/** Section « D'autres logements » en bas d'une fiche. Ne s'affiche pas s'il n'y a rien à proposer. */
export function OtherApartments({ list, datesFiltered, query = "" }: { list: PublicApartment[]; datesFiltered: boolean; query?: string }) {
  if (!list.length) return null;
  return (
    <section id="autres-logements" className="scroll-mt-24 border-t border-slate-200 py-10">
      <ScrollRow label="Autres logements" header={<>
        <h2 className="text-[22px] font-semibold">D&apos;autres logements qui pourraient vous plaire</h2>
        <p className="mt-1 text-base text-slate-500">{datesFiltered ? "Libres aux mêmes dates que votre recherche." : "D'autres appartements meublés à Lomé."}</p>
      </>}>
          {list.map((x) => (
            <div key={x.id} role="listitem" className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
              <ApartmentCard a={x} query={query} />
            </div>
          ))}
      </ScrollRow>
      <Link href={`/appartements${query}`} className="mt-8 inline-flex items-center rounded-lg border border-slate-900 px-5 py-3 text-base font-semibold hover:bg-slate-50">
        Voir tous les logements
      </Link>
    </section>
  );
}
