"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen((v) => !v)} className="grid size-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Menu" aria-expanded={open}>
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white px-4 py-3 shadow-lg" onClick={() => setOpen(false)}>
          <Link href="/" className="block rounded-lg px-3 py-3 font-medium hover:bg-slate-50">Accueil</Link>
          <Link href="/appartements" className="block rounded-lg px-3 py-3 font-medium hover:bg-slate-50">Nos appartements</Link>
          <Link href="/#contact" className="block rounded-lg px-3 py-3 font-medium hover:bg-slate-50">Contact</Link>
        </nav>
      )}
    </div>
  );
}
