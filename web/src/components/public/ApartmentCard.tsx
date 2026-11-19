import Image from "next/image";
import Link from "next/link";
import { BedDouble, Home, MapPin, Star, Users } from "lucide-react";
import type { PublicApartment } from "@/lib/public-data";
import { displayNightPrice } from "@/lib/pricing";
import { fcfa } from "@/lib/format";
import { todayIso } from "@/lib/dates";
import { AmenityIcon } from "@/components/AmenityIcon";

export function ApartmentCard({ a, priority, query = "" }: { a: PublicApartment; priority?: boolean; query?: string }) {
  const price = displayNightPrice(a.pricing, todayIso());
  return (
    <Link href={`/appartements/${a.slug}${query}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {a.cover_url ? (
          <Image src={a.cover_url} alt={a.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={priority}
            className="object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : <div className="grid size-full place-items-center text-slate-300"><Home className="size-10" /></div>}
        {price.original && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-600 shadow-sm">{a.pricing.promo_label || "Promotion"}</span>
        )}
        {a.review_count > 0 && a.avg_rating && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold shadow-sm"><Star className="size-3.5 fill-amber-400 text-amber-400" />{a.avg_rating}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-slate-900">{a.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" />{[a.neighborhood, a.city].filter(Boolean).join(", ")}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
          <span className="flex items-center gap-1.5"><BedDouble className="size-4" /> {a.bedrooms} chambre{a.bedrooms > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1.5"><Users className="size-4" /> {a.max_guests} pers.</span>
        </div>
        {a.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.amenities.slice(0, 4).map((am) => (
              <span key={am.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600"><AmenityIcon name={am.icon} className="size-3" />{am.name}</span>
            ))}
            {a.amenities.length > 4 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600">+{a.amenities.length - 4}</span>}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {price.original && <div className="text-xs text-slate-400 line-through">{fcfa(price.original)}</div>}
            <div className="text-[17px] font-semibold tabular-nums text-slate-900">{fcfa(price.price)} <span className="text-sm font-normal text-slate-500">/ nuit</span></div>
          </div>
          <span className="rounded-full bg-[var(--site-primary)] px-3.5 py-2 text-[13px] font-semibold text-white">Voir l&apos;appartement</span>
        </div>
      </div>
    </Link>
  );
}
