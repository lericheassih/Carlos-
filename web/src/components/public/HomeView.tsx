import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, Search, Sparkles, Star } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";
import type { PublicApartment, PublicReview } from "@/lib/public-data";
import { ApartmentCard } from "./ApartmentCard";
import { PhoneLink, WhatsAppLink } from "./ContactLinks";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { todayIso } from "@/lib/dates";
import { countryName } from "@/lib/format";

export function HomeView({ s, apartments, reviews }: { s: SiteSettings; apartments: PublicApartment[]; reviews: PublicReview[] }) {
  const featured = [...apartments.filter((a) => a.featured), ...apartments.filter((a) => !a.featured)];
  const today = todayIso();
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#222222]">
        <div className="mx-auto flex max-w-6xl flex-col justify-end px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-24">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-white sm:text-6xl">{s.hero_title}</h1>
          {s.hero_subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{s.hero_subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/appartements" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-slate-900 hover:bg-slate-100">
              Découvrir les appartements <ArrowRight className="size-4" />
            </Link>
            <WhatsAppLink number={s.whatsapp} message={`Bonjour ${s.company_name}, j'aimerais réserver un appartement.`} placement="hero"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-semibold text-white hover:brightness-95">
              <WhatsAppIcon /> Réserver sur WhatsApp
            </WhatsAppLink>
          </div>
          {/* Recherche rapide */}
          <form action="/appartements" className="mt-10 grid max-w-3xl gap-1 rounded-[28px] bg-white p-2 shadow-2xl sm:grid-cols-[1fr_1fr_120px_auto] sm:rounded-full">
            <label className="rounded-xl px-3 py-2 hover:bg-slate-50"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Arrivée</span>
              <input type="date" name="arrivee" min={today} className="block min-h-6 w-full appearance-none bg-transparent text-sm outline-none [&::-webkit-date-and-time-value]:text-left" /></label>
            <label className="rounded-xl px-3 py-2 hover:bg-slate-50"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Départ</span>
              <input type="date" name="depart" min={today} className="block min-h-6 w-full appearance-none bg-transparent text-sm outline-none [&::-webkit-date-and-time-value]:text-left" /></label>
            <label className="rounded-xl px-3 py-2 hover:bg-slate-50"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Personnes</span>
              <input type="number" name="voyageurs" min={1} max={30} placeholder="2" className="block min-h-6 w-full appearance-none bg-transparent text-sm outline-none [&::-webkit-date-and-time-value]:text-left" /></label>
            <button className="btn-brand flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"><Search className="size-4" strokeWidth={3} /> Rechercher</button>
          </form>
        </div>
      </section>

      {/* Sélection */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold sm:text-[26px]">Nos logements à Lomé</h2>
            <p className="mt-1 text-slate-500">Tous nos appartements meublés, prêts à réserver.</p>
          </div>
          {apartments.length > 0 && <Link href="/appartements" className="inline-flex items-center gap-1 font-semibold text-[var(--site-primary)] hover:underline">Rechercher par dates et quartier <ArrowRight className="size-4" /></Link>}
        </div>
        {featured.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">Nos appartements seront bientôt en ligne. Contactez-nous sur WhatsApp en attendant.</p>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{featured.map((a, i) => <ApartmentCard key={a.id} a={a} priority={i === 0} />)}</div>
        )}
      </section>

      {/* Services */}
      {s.services.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{s.about_title}</h2>
            {s.about_text && <p className="mt-3 max-w-2xl text-slate-600">{s.about_text}</p>}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {s.services.map((x) => (
                <div key={x.title} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                  <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--site-primary)_10%,white)] text-[var(--site-primary)]"><Sparkles className="size-5" /></span>
                  <h3 className="mt-4 text-lg font-semibold">{x.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{x.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avantages */}
      {s.advantages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Les avantages</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {s.advantages.map((x) => <li key={x} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /><span className="font-medium">{x}</span></li>)}
          </ul>
        </section>
      )}

      {/* Avis (uniquement les avis validés) */}
      {reviews.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ils ont séjourné chez nous</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <figure key={r.id} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div>
                  {r.comment && <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">« {r.comment} »</blockquote>}
                  <figcaption className="mt-3 text-sm font-semibold">{r.author_name}<span className="font-normal text-slate-500">{r.author_country ? ` · ${r.author_country.length === 2 ? countryName(r.author_country) : r.author_country}` : ""}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 overflow-hidden rounded-2xl bg-slate-100 p-8 sm:p-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Contactez-nous</h2>
            {s.contact_text && <p className="mt-3 text-slate-600">{s.contact_text}</p>}
            <WhatsAppLink number={s.whatsapp} message={`Bonjour ${s.company_name} !`} placement="contact"
              className="btn-brand mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-semibold">
              <WhatsAppIcon className="size-5" /> Écrire sur WhatsApp
            </WhatsAppLink>
          </div>
          <ul className="space-y-4 self-center text-slate-900">
            {s.phone && <li><PhoneLink phone={s.phone} placement="contact" className="flex items-center gap-3 hover:underline"><Phone className="size-5" /> {s.phone}</PhoneLink></li>}
            {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-3 hover:underline"><Mail className="size-5" /> {s.email}</a></li>}
            {s.address && <li className="flex items-center gap-3"><MapPin className="size-5" /> {s.address}</li>}
          </ul>
        </div>
      </section>
    </>
  );
}
