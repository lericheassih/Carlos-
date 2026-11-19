import Link from "next/link";
import { Bath, BedDouble, Clock, MapPin, Sofa, Star, Users } from "lucide-react";
import type { ApartmentSnapshot } from "@/lib/types";
import type { SiteSettings } from "@/lib/site-settings";
import type { PublicReview } from "@/lib/public-data";
import { displayNightPrice, quoteStay } from "@/lib/pricing";
import { addDays, todayIso } from "@/lib/dates";
import { countryName, dateFr, fcfa } from "@/lib/format";
import { AmenityIcon } from "@/components/AmenityIcon";
import { Gallery } from "./Gallery";
import { BookingWidget } from "./BookingWidget";
import { TrackOnView } from "./Tracker";
import { PhoneLink } from "./ContactLinks";

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</>;
}

export function ApartmentView({ a, s, reviews, preview, initial }: {
  a: ApartmentSnapshot; s: SiteSettings; reviews: PublicReview[]; preview?: boolean; initial?: { arrivee?: string; depart?: string; voyageurs?: string };
}) {
  const today = todayIso();
  const price = displayNightPrice(a.pricing, today);
  const images = a.media.filter((m) => m.kind === "image");
  const videos = a.media.filter((m) => m.kind === "video");
  const avg = reviews.length ? Math.round((reviews.reduce((x, r) => x + r.rating, 0) / reviews.length) * 10) / 10 : null;
  const week = a.pricing.week ? quoteStay(a.pricing, today, addDays(today, 7)) : null;
  const month = a.pricing.month ? quoteStay(a.pricing, today, addDays(today, 30)) : null;
  const conditions = a.booking_conditions || s.booking_conditions;
  const rules = a.house_rules.split("\n").map((x) => x.trim()).filter(Boolean);
  const groups = new Map<string, typeof a.amenities>();
  a.amenities.forEach((x) => groups.set(x.category, [...(groups.get(x.category) ?? []), x]));
  const mapQuery = a.latitude !== null && a.longitude !== null ? `${a.latitude},${a.longitude}` : [a.neighborhood, a.city].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      {!preview && <TrackOnView type="apartment_view" apartmentId={a.id} />}
      <Link href="/appartements" className="mb-4 inline-block text-sm font-medium text-slate-600 hover:text-slate-900">← Tous les appartements</Link>
      <Gallery images={images} name={a.name} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{a.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
            <span className="flex items-center gap-1"><MapPin className="size-4" />{[a.neighborhood, a.city].filter(Boolean).join(", ")}</span>
            {avg && <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" />{avg} · {reviews.length} avis</span>}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { i: <Users className="size-4" />, t: `${a.max_guests} personne${a.max_guests > 1 ? "s" : ""}` },
              { i: <BedDouble className="size-4" />, t: `${a.bedrooms} chambre${a.bedrooms > 1 ? "s" : ""}` },
              { i: <Sofa className="size-4" />, t: `${a.living_rooms} salon${a.living_rooms > 1 ? "s" : ""}` },
              { i: <Bath className="size-4" />, t: `${a.bathrooms} salle${a.bathrooms > 1 ? "s" : ""} de bain` },
            ].map((x) => <span key={x.t} className="flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm">{x.i}{x.t}</span>)}
          </div>

          {(a.short_description || a.description) && (
            <section className="mt-8 space-y-3 border-t border-slate-200 pt-8 leading-relaxed text-slate-700">
              <h2 className="text-xl font-semibold text-slate-900">À propos de ce logement</h2>
              {a.short_description && <p className="font-medium text-slate-800">{a.short_description}</p>}
              <Paragraphs text={a.description} />
            </section>
          )}

          {a.amenities.length > 0 && (
            <section className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold">Équipements</h2>
              <div className="mt-4 space-y-5">
                {[...groups.entries()].map(([cat, list]) => (
                  <div key={cat}>
                    <h3 className="mb-2 text-sm font-semibold text-slate-500">{cat}</h3>
                    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {list.map((x) => <li key={x.id} className="flex items-center gap-3"><AmenityIcon name={x.icon} className="size-5 text-slate-700" />{x.name}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold">Vidéos</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {videos.map((v) => <video key={v.id} src={v.url} controls preload="metadata" playsInline className="w-full rounded-2xl bg-black" />)}
              </div>
            </section>
          )}

          <section className="mt-8 border-t border-slate-200 pt-8">
            {!preview && <TrackOnView type="pricing_view" apartmentId={a.id} />}
            <h2 className="text-xl font-semibold">Tarifs</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Par nuit</div>
                {price.original && <div className="text-xs text-slate-400 line-through">{fcfa(price.original)}</div>}
                <div className="text-xl font-semibold tabular-nums">{fcfa(price.price)}</div>
                {price.original && <div className="text-xs font-medium text-red-600">{a.pricing.promo_label || "Promotion"}{a.pricing.promo_end ? ` jusqu'au ${dateFr(a.pricing.promo_end)}` : ""}</div>}
              </div>
              {week && <div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Par semaine</div><div className="text-xl font-semibold tabular-nums">{fcfa(a.pricing.week)}</div><div className="text-xs text-emerald-700">soit {fcfa(Math.round(a.pricing.week! / 7))} / nuit</div></div>}
              {month && <div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Par mois</div><div className="text-xl font-semibold tabular-nums">{fcfa(a.pricing.month)}</div><div className="text-xs text-emerald-700">soit {fcfa(Math.round(a.pricing.month! / 30))} / nuit</div></div>}
            </div>
            {a.pricing.extra_fees.length > 0 && (
              <ul className="mt-3 text-sm text-slate-600">
                {a.pricing.extra_fees.map((f) => <li key={f.label}>+ {f.label} : {fcfa(f.amount)} {f.per === "night" ? "par nuit" : f.per === "guest" ? "par personne" : "par séjour"}</li>)}
              </ul>
            )}
            {a.pricing.min_nights > 1 && <p className="mt-2 text-sm text-slate-600">Séjour minimum : {a.pricing.min_nights} nuits.</p>}
            {a.pricing.conditions && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{a.pricing.conditions}</p>}
          </section>

          <section className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold">Localisation</h2>
            <p className="mt-2 text-slate-600">{[a.neighborhood, a.city].filter(Boolean).join(", ")}. L&apos;adresse exacte vous est communiquée à la confirmation de la réservation.</p>
            {mapQuery && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"><MapPin className="size-4" /> Voir sur Google Maps</a>
            )}
          </section>

          <section className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold">Bon à savoir</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 font-semibold"><Clock className="size-4" /> Horaires</h3>
                <p className="mt-1 text-sm text-slate-600">Arrivée à partir de {a.check_in_time} · Départ avant {a.check_out_time}</p>
              </div>
              {rules.length > 0 && (
                <div>
                  <h3 className="font-semibold">Règlement intérieur</h3>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600">{rules.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              )}
              {conditions && (
                <div className="sm:col-span-2">
                  <h3 className="font-semibold">Conditions de réservation</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{conditions}</p>
                </div>
              )}
              {s.cancellation_policy && (
                <div className="sm:col-span-2">
                  <h3 className="font-semibold">Annulation</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{s.cancellation_policy}</p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold">Avis des voyageurs</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-slate-600">Pas encore d&apos;avis publié pour ce logement.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <figure key={r.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div>
                    {r.comment && <blockquote className="mt-2 text-sm leading-relaxed text-slate-700">« {r.comment} »</blockquote>}
                    <figcaption className="mt-2 text-xs text-slate-500">{r.author_name}{r.author_country ? ` · ${r.author_country.length === 2 ? countryName(r.author_country) : r.author_country}` : ""}{r.stay_date ? ` · ${dateFr(r.stay_date, { month: "long", year: "numeric" })}` : ""}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div id="reserver" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="mb-4">
              {price.original && <span className="mr-2 text-sm text-slate-400 line-through">{fcfa(price.original)}</span>}
              <span className="text-2xl font-semibold tabular-nums">{fcfa(price.price)}</span> <span className="text-slate-500">/ nuit</span>
            </div>
            <BookingWidget apartment={{ id: a.id, name: a.name, pricing: a.pricing, max_guests: a.max_guests }} whatsapp={s.whatsapp} companyName={s.company_name} preview={preview} initial={initial} />
            {s.phone && (
              <p className="mt-3 text-center text-sm text-slate-600">ou appelez-nous : <PhoneLink phone={s.phone} apartmentId={a.id} placement="apartment" className="font-medium text-slate-900 underline">{s.phone}</PhoneLink></p>
            )}
          </div>
        </aside>
      </div>

      {/* Barre de réservation mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 pr-24 lg:hidden">
        <div><span className="font-semibold tabular-nums">{fcfa(price.price)}</span> <span className="text-sm text-slate-500">/ nuit</span></div>
        <a href="#reserver" className="rounded-xl bg-[var(--site-primary)] px-5 py-2.5 text-sm font-semibold text-white">Réserver</a>
      </div>
    </div>
  );
}
