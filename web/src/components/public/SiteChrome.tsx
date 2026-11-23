import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./SocialIcons";
import type { SiteSettings } from "@/lib/site-settings";
import { initials } from "@/lib/format";
import { WhatsAppLink, PhoneLink } from "./ContactLinks";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { MobileNav } from "./MobileNav";

export function Logo({ s }: { s: SiteSettings }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      {s.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.logo_url} alt={s.company_name} className="h-10 w-auto max-w-[140px] rounded-lg object-contain" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--site-primary)] text-sm font-bold text-white">{initials(s.company_name)}</span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[17px] font-semibold text-slate-900">{s.company_name}</span>
        {s.tagline && <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-slate-500">{s.tagline}</span>}
      </span>
    </Link>
  );
}

export function SiteHeader({ s }: { s: SiteSettings }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo s={s} />
        <nav className="ml-auto hidden items-center gap-1 text-sm font-medium text-slate-700 md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-slate-100">Accueil</Link>
          <Link href="/appartements" className="rounded-lg px-3 py-2 hover:bg-slate-100">Nos appartements</Link>
          <Link href="/#contact" className="rounded-lg px-3 py-2 hover:bg-slate-100">Contact</Link>
        </nav>
        <WhatsAppLink number={s.whatsapp} message={`Bonjour ${s.company_name}, j'aimerais des informations sur vos appartements.`} placement="header"
          className="ml-auto hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 sm:flex md:ml-2">
          <WhatsAppIcon className="size-4" /> WhatsApp
        </WhatsAppLink>
        <MobileNav />
      </div>
    </header>
  );
}

export function SiteFooter({ s }: { s: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo s={s} />
          {s.about_text && <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">{s.about_text}</p>}
          <div className="mt-4 flex gap-2">
            {s.social.facebook && <a href={s.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"><FacebookIcon /></a>}
            {s.social.instagram && <a href={s.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"><InstagramIcon /></a>}
            {s.social.tiktok && <a href={s.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="grid size-9 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"><TikTokIcon /></a>}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Navigation</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/appartements" className="hover:text-slate-900">Nos appartements</Link></li>
            <li><Link href="/conditions" className="hover:text-slate-900">Conditions de réservation</Link></li>
            <li><Link href="/confidentialite" className="hover:text-slate-900">Confidentialité</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {s.phone && <li><PhoneLink phone={s.phone} placement="footer" className="flex items-center gap-2 hover:text-slate-900"><Phone className="size-4" /> {s.phone}</PhoneLink></li>}
            {s.whatsapp && <li><WhatsAppLink number={s.whatsapp} message={`Bonjour ${s.company_name} !`} placement="footer" className="flex items-center gap-2 hover:text-slate-900"><WhatsAppIcon className="size-4" /> WhatsApp</WhatsAppLink></li>}
            {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-slate-900"><Mail className="size-4" /> {s.email}</a></li>}
            {s.address && <li className="flex items-center gap-2"><MapPin className="size-4" /> {s.address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">© {year} {s.company_name}</div>
    </footer>
  );
}

export function WhatsAppFab({ s }: { s: SiteSettings }) {
  return (
    <WhatsAppLink number={s.whatsapp} message={`Bonjour ${s.company_name}, j'aimerais réserver un appartement.`} placement="floating"
      id="wa-fab" className="fixed bottom-5 right-4 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition hover:scale-105 sm:right-6">
      <span className="sr-only">Nous écrire sur WhatsApp</span>
      <WhatsAppIcon className="size-7" />
    </WhatsAppLink>
  );
}
