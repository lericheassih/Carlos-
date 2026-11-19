import Image from "next/image";
import Link from "next/link";
import { Home, Star } from "lucide-react";
import type { PublicApartment } from "@/lib/public-data";
import { displayNightPrice } from "@/lib/pricing";
import { fcfa } from "@/lib/format";
import { todayIso } from "@/lib/dates";

const TYPE: Record<string, string> = { villa: "Villa", studio: "Studio", maison: "Maison", chambre: "Chambre", duplex: "Duplex", penthouse: "Penthouse" };

export function ApartmentCard({ a, priority, query = "" }: { a: PublicApartment; priority?: boolean; query?: string }) {
  const price = displayNightPrice(a.pricing, todayIso());
  const amen = a.amenities.filter((x) => x.included !== false).slice(0, 3).map((x) => x.name).join(" · ");
  return (
    <Link href={`/appartements/${a.slug}${query}`} className="group block">
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-slate-100">
        {a.cover_url ? (
          <Image src={a.cover_url} alt={a.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={priority}
            className="object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : <div className="grid size-full place-items-center text-slate-300"><Home className="size-10" /></div>}
        {(a.featured || price.original) && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[13px] font-semibold shadow-sm">{price.original ? a.pricing.promo_label || "Promotion" : "Coup de cœur voyageurs"}</span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold">{TYPE[a.property_type] ?? "Appartement"} · {a.neighborhood || a.city}</h3>
        <span className="flex shrink-0 items-center gap-1 text-[15px]"><Star className="size-3.5 fill-slate-900" />{a.review_count && a.avg_rating ? String(a.avg_rating).replace(".", ",") : "Nouveau"}</span>
      </div>
      <p className="text-[15px] text-slate-500">{a.name}</p>
      <p className="text-[15px] text-slate-500">{a.bedrooms} chambre{a.bedrooms > 1 ? "s" : ""} · {a.max_guests} voyageurs{amen ? ` · ${amen}` : ""}</p>
      <p className="mt-1.5 text-[15px]">
        {price.original && <span className="mr-1 text-slate-500 line-through">{fcfa(price.original)}</span>}
        <span className="font-semibold tabular-nums">{fcfa(price.price)}</span> par nuit
      </p>
    </Link>
  );
}
