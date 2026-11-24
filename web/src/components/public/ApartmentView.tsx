import Image from "next/image";
import Link from "next/link";
import { Briefcase, Car, ChevronLeft, DoorOpen, KeyRound, MapPin, Snowflake, Star, Waves } from "lucide-react";
import { MobileBookBar } from "./MobileStay";
import type { ApartmentSnapshot } from "@/lib/types";
import type { SiteSettings } from "@/lib/site-settings";
import type { PublicReview } from "@/lib/public-data";
import { displayNightPrice } from "@/lib/pricing";
import { todayIso } from "@/lib/dates";
import { countryName, dateFr, fcfa, initials, waLink } from "@/lib/format";
import { BookingWidget } from "./BookingWidget";
import { TrackOnView } from "./Tracker";
import { PhoneLink } from "./ContactLinks";
import { AmenitiesBlock, GoodToKnow, PhotoGallery } from "./StayDetails";
import { OtherApartments } from "./OtherApartments";
import type { PublicApartment } from "@/lib/public-data";

const plural = (n: number, s: string, p = s + "s") => `${n} ${n > 1 ? p : s}`;

export function ApartmentView({ a, s, reviews, preview, initial, others }: {
  a: ApartmentSnapshot; s: SiteSettings; reviews: PublicReview[]; preview?: boolean; initial?: { arrivee?: string; depart?: string; voyageurs?: string };
  others?: { list: PublicApartment[]; datesFiltered: boolean };
}) {
  const today = todayIso();
  const price = displayNightPrice(a.pricing, today);
  const images = a.media.filter((m) => m.kind === "image");
  const videos = a.media.filter((m) => m.kind === "video");
  const avg = reviews.length ? Math.round((reviews.reduce((x, r) => x + r.rating, 0) / reviews.length) * 100) / 100 : null;
  const rules = a.house_rules.split("\n").map((x) => x.trim()).filter(Boolean);
  const where = [a.neighborhood, a.city].filter(Boolean).join(", ");
  const bedrooms = [...new Map(images.filter((m) => /^Chambre/.test(m.room ?? "")).map((m) => [m.room!, m])).values()];
  const typeLabel = a.property_type === "villa" ? "Villa entière" : a.property_type === "studio" ? "Studio entier" : a.property_type === "maison" ? "Maison entière" : "Logement entier";
  const has = (n: string) => a.amenities.some((x) => x.name === n && x.included !== false);
  const highlights = [
    has("Arrivée autonome") || has("Boîte à clé sécurisée") ? { icon: KeyRound, title: "Arrivée autonome", text: "Accédez au logement grâce à la boîte à clé sécurisée." } : null,
    has("Stationnement gratuit sur place") ? { icon: Car, title: "Stationnez gratuitement", text: "Ce logement dispose d'un stationnement gratuit sur place." } : null,
    has("Espace de travail dédié") ? { icon: Briefcase, title: "Espace de travail dédié", text: "Un coin bureau avec Wifi, idéal pour les séjours professionnels." } : null,
    has("Balcon") ? { icon: DoorOpen, title: "Balcon privatif", text: "Profitez de l'air extérieur depuis votre balcon." } : null,
    has("Piscine") ? { icon: Waves, title: "Piscine", text: "Accès à la piscine pendant votre séjour." } : null,
    has("Climatisation") ? { icon: Snowflake, title: "Climatisation", text: "Logement climatisé pour un séjour au frais." } : null,
  ].filter(Boolean).slice(0, 3) as { icon: typeof KeyRound; title: string; text: string }[];
  const mapQuery = a.latitude !== null && a.longitude !== null ? `${a.latitude},${a.longitude}` : `${where}, Togo`;

  return (
    <div className="apt-page mx-auto max-w-[1120px] px-4 pb-40 pt-0 sm:px-6 sm:pt-6 lg:pb-24">
      {!preview && <TrackOnView type="apartment_view" apartmentId={a.id} />}
      <Link href="/appartements" className="mb-3 hidden items-center gap-1 sm:inline-flex text-sm font-semibold underline-offset-2 hover:underline"><ChevronLeft className="size-4" /> Tous les logements</Link>
      <h1 className="mb-4 hidden text-[26px] font-semibold sm:block">{a.name}</h1>
      <PhotoGallery images={images} name={a.name} aptId={a.id} />

      <div className="relative z-10 -mx-4 -mt-7 grid gap-12 rounded-t-[28px] bg-white px-6 pt-7 sm:mx-0 sm:mt-6 sm:rounded-none sm:px-0 sm:pt-0 lg:grid-cols-[1fr_372px] lg:gap-24">
        <div className="min-w-0">
          <div className="pb-7 text-center sm:pb-8 sm:text-left">
            <h1 className="text-[28px] font-semibold leading-tight sm:hidden">{a.name}</h1>
            <p className="mt-3 text-base text-slate-500 sm:mt-0 sm:text-[22px] sm:font-semibold sm:text-slate-900">{typeLabel} · {where}, Togo</p>
            <p className="mt-1 text-base text-slate-500 sm:text-slate-900">
              {plural(a.max_guests, "voyageur")} · {plural(a.bedrooms, "chambre")} · {plural(a.living_rooms, "salon")} · {plural(a.bathrooms, "salle de bain", "salles de bain")}
            </p>
            <p className="mt-4 flex items-center justify-center gap-1 text-base font-semibold sm:mt-2 sm:justify-start">
              <Star className="size-4 fill-slate-900" />
              {avg ? <>{avg.toFixed(2).replace(".", ",")} · <span className="underline">{plural(reviews.length, "commentaire")}</span></> : "Nouveau"}
            </p>
          </div>

          <div className="flex items-center gap-5 border-t border-slate-200 py-6">
            <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
              {s.logo_url ? <Image src={s.logo_url} alt="" fill sizes="48px" className="bg-white object-contain" /> : initials(s.company_name)}
            </span>
            <div>
              <div className="text-base font-semibold">Séjournez chez {s.company_name}</div>
              <div className="text-sm text-slate-500">Hôte professionnel · Réponse rapide sur WhatsApp</div>
            </div>
          </div>

          {highlights.length > 0 && (
            <section className="space-y-6 border-t border-slate-200 py-8">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-start gap-6">
                  <h.icon className="mt-0.5 size-7 shrink-0" strokeWidth={1.4} />
                  <div><div className="text-base font-semibold">{h.title}</div><div className="mt-0.5 text-base text-slate-500">{h.text}</div></div>
                </div>
              ))}
            </section>
          )}

          {(a.short_description || a.description) && (
            <section className="border-t border-slate-200 py-8 text-base leading-relaxed">
              {a.short_description && <p className="mb-4">{a.short_description}</p>}
              {a.description.split(/\n{2,}/).map((p, i) => <p key={i} className="mb-3 whitespace-pre-line">{p}</p>)}
            </section>
          )}

          {bedrooms.length > 0 && (
            <section className="border-t border-slate-200 py-10">
              <h2 className="text-[22px] font-semibold">Où vous dormirez</h2>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
                {bedrooms.map((m) => (
                  <div key={m.room} className="w-[220px] shrink-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><Image src={m.url} alt={m.room!} fill sizes="220px" className="object-cover" /></div>
                    <div className="mt-3 text-base font-semibold">{m.room}</div>
                    <div className="text-sm text-slate-500">1 lit</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <AmenitiesBlock amenities={a.amenities} />

          {videos.length > 0 && (
            <section className="border-t border-slate-200 py-10">
              <h2 className="text-[22px] font-semibold">Vidéos</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {videos.map((v) => <video key={v.id} src={v.url} controls preload="metadata" playsInline className="w-full rounded-xl bg-black" />)}
              </div>
            </section>
          )}

          <section className="border-t border-slate-200 py-10">
            {!preview && <TrackOnView type="pricing_view" apartmentId={a.id} />}
            <h2 className="text-[22px] font-semibold">Tarifs</h2>
            <p className="mt-1 text-slate-500">Plus vous restez longtemps, moins la nuit coûte cher.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-slate-500">1 nuit</div>
                {price.original && <div className="text-sm text-slate-400 line-through">{fcfa(price.original)}</div>}
                <div className="text-lg font-semibold tabular-nums">{fcfa(price.price)}</div>
                {price.original && <div className="text-xs font-semibold text-[var(--site-primary)]">{a.pricing.promo_label || "Promotion"}</div>}
              </div>
              {a.pricing.week ? <div className="rounded-xl border border-slate-200 p-4"><div className="text-slate-500">1 semaine</div><div className="text-lg font-semibold tabular-nums">{fcfa(a.pricing.week)}</div><div className="text-sm text-slate-500">soit {fcfa(Math.round(a.pricing.week / 7))} / nuit</div></div> : null}
              {a.pricing.week2 ? <div className="rounded-xl border border-slate-200 p-4"><div className="text-slate-500">2 semaines</div><div className="text-lg font-semibold tabular-nums">{fcfa(a.pricing.week2)}</div><div className="text-sm text-slate-500">soit {fcfa(Math.round(a.pricing.week2 / 14))} / nuit</div></div> : null}
              {a.pricing.week3 ? <div className="rounded-xl border border-slate-200 p-4"><div className="text-slate-500">3 semaines</div><div className="text-lg font-semibold tabular-nums">{fcfa(a.pricing.week3)}</div><div className="text-sm text-slate-500">soit {fcfa(Math.round(a.pricing.week3 / 21))} / nuit</div></div> : null}
              {a.pricing.month ? <div className="rounded-xl border-2 border-slate-900 p-4"><div className="text-slate-500">1 mois</div><div className="text-lg font-semibold tabular-nums">{fcfa(a.pricing.month)}</div><div className="text-sm text-slate-500">soit {fcfa(Math.round(a.pricing.month / 30))} / nuit</div></div> : null}
            </div>
            {a.pricing.extra_fees.length > 0 && <ul className="mt-3 text-sm text-slate-500">{a.pricing.extra_fees.map((f) => <li key={f.label}>+ {f.label} : {fcfa(f.amount)} {f.per === "night" ? "par nuit" : f.per === "guest" ? "par personne" : "par séjour"}</li>)}</ul>}
            {a.pricing.conditions && <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{a.pricing.conditions}</p>}
          </section>

          <section className="border-t border-slate-200 py-10">
            <h2 className="text-[22px] font-semibold">{reviews.length ? <span className="flex items-center gap-2"><Star className="size-5 fill-slate-900" />{avg!.toFixed(2).replace(".", ",")} · {plural(reviews.length, "commentaire")}</span> : "Avis des voyageurs"}</h2>
            {reviews.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-5"><div className="font-semibold">Nouveau · Aucun commentaire pour l&apos;instant</div><p className="mt-1 text-slate-500">Les avis de nos voyageurs s&apos;afficheront ici après leur séjour.</p></div>
            ) : (
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {reviews.map((r) => (
                  <figure key={r.id}>
                    <figcaption className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">{initials(r.author_name)}</span>
                      <span><span className="block font-semibold">{r.author_name}</span><span className="block text-sm text-slate-500">{r.author_country ? (r.author_country.length === 2 ? countryName(r.author_country) : r.author_country) : ""}</span></span>
                    </figcaption>
                    <div className="mt-3 flex items-center gap-1 text-sm">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3 ${i < r.rating ? "fill-slate-900" : "text-slate-300"}`} />)}{r.stay_date && <span className="ml-1 font-semibold">· {dateFr(r.stay_date, { month: "long", year: "numeric" })}</span>}</div>
                    {r.comment && <blockquote className="mt-2 text-base leading-relaxed">{r.comment}</blockquote>}
                  </figure>
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-slate-200 py-10">
            <h2 className="text-[22px] font-semibold">Où se situe le logement</h2>
            <p className="mt-4 text-base">{where}, Région maritime, Togo</p>
            <p className="mt-1 text-slate-500">L&apos;adresse exacte vous est communiquée après la confirmation de la réservation.</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-900 px-5 py-3 text-base font-semibold hover:bg-slate-50"><MapPin className="size-4" /> Voir le quartier sur Google Maps</a>
          </section>

          <GoodToKnow checkIn={a.check_in_time} checkOut={a.check_out_time} rules={rules} amenities={a.amenities}
            conditions={a.booking_conditions || s.booking_conditions} cancellation={s.cancellation_policy}
            whatsappLink={s.whatsapp ? waLink(s.whatsapp, `Bonjour ${s.company_name}, quelles sont les conditions d'annulation pour « ${a.name} » ?`) : null} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div id="reserver" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
            <div className="mb-5">
              {price.original && <span className="mr-2 text-slate-400 line-through">{fcfa(price.original)}</span>}
              <span className="text-[22px] font-semibold tabular-nums">{fcfa(price.price)}</span> <span className="text-base">par nuit</span>
            </div>
            <BookingWidget apartment={{ id: a.id, name: a.name, pricing: a.pricing, max_guests: a.max_guests }} whatsapp={s.whatsapp} companyName={s.company_name} preview={preview} initial={initial} />
            {s.phone && <p className="mt-4 text-center text-sm text-slate-500">ou appelez-nous : <PhoneLink phone={s.phone} apartmentId={a.id} placement="apartment" className="font-semibold text-slate-900 underline">{s.phone}</PhoneLink></p>}
          </div>
        </aside>
      </div>

      {others && <OtherApartments list={others.list} datesFiltered={others.datesFiltered} query={(() => {
        const q = new URLSearchParams(Object.entries(initial ?? {}).filter(([, v]) => v) as [string, string][]).toString();
        return q ? `?${q}` : "";
      })()} />}

      <MobileBookBar aptId={a.id} nightPrice={price.price} minNights={a.pricing.min_nights} />
    </div>
  );
}
