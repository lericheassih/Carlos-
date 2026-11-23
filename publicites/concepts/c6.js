/* CONCEPT 6 — « Mode d'emploi » : tutoriel pas à pas du site LUMO, annotations sur les vrais boutons (esthétique du concept 4). */
(() => {
  const { E, p, el, split, reveal, scene, clamp } = R;
  R.dur = 45.4;
  const T = TUTO(), { nine, Y } = T, POS = window.TUTO_POS;
  const css = document.createElement("style");
  css.textContent = `
    .h6k { position:absolute; left:50%; transform:translateX(-50%); background:#FF385C; color:#fff; border-radius:999px; padding:${nine ? "16px 30px" : "13px 24px"};
           font: 800 ${nine ? 32 : 27}px/1 "Figtree"; letter-spacing:.14em; white-space:nowrap; }
    .h6t { position:absolute; left:60px; right:60px; text-align:center; color:#222; font: 900 ${nine ? 100 : 84}px/0.98 "Figtree"; letter-spacing:-.04em; }
    .h6s { position:absolute; left:80px; right:80px; text-align:center; font: 500 ${nine ? 44 : 38}px/1.25 "Figtree"; color:#6A6A6A; }
    .prog { position:absolute; left:0; right:0; display:flex; justify-content:center; gap:${nine ? 14 : 12}px; }
    .prog span { width:${nine ? 70 : 58}px; height:${nine ? 70 : 58}px; border-radius:50%; background:#F7F7F7; border:3px solid #EBEBEB; color:#222; display:grid; place-items:center; font: 900 ${nine ? 30 : 25}px/1 "Figtree"; }
  `;
  document.head.appendChild(css);

  T.background(R.dur, ["a-salle-a-manger.jpg", "a-chambre-2.jpg"], 4.0, 39.4);

  // ---------- Accroche (0 → 3,8 s) ----------
  scene(0, 3.9, (root) => {
    const k6 = el("div", "h6k", root, "MODE D'EMPLOI"); k6.style.top = Y(nine ? 0.21 : 0.12);
    const t1 = el("div", "h6t", root); t1.style.top = Y(nine ? 0.29 : 0.24);
    const ww = split(t1, "Comment réserver sur le site LUMO ?");
    const s1 = el("div", "h6s", root, "Suivez le guide, étape par étape."); s1.style.top = Y(nine ? 0.5 : 0.565);
    const pr = el("div", "prog", root, [1, 2, 3, 4, 5, 6, 7].map((d) => `<span>${d}</span>`).join("")); pr.style.top = Y(nine ? 0.575 : 0.665);
    return (t) => {
      const k = p(t, 0.05, 0.5, E.outBack);
      k6.style.opacity = clamp(k * 2); k6.style.transform = `translateX(-50%) scale(${k})`;
      reveal(ww, t, 0.3, { style: "up", stagger: 0.07, dur: 0.55, dist: 50 });
      s1.style.opacity = p(t, 1.6, 2.0);
      [...pr.children].forEach((d, i) => {
        const q = p(t, 2.0 + i * 0.1, 2.35 + i * 0.1, E.outBack), on = t > 2.9 + i * 0.05;
        d.style.opacity = clamp(q * 2); d.style.transform = `scale(${q})`;
        d.style.background = on ? "#FF385C" : "#F7F7F7"; d.style.color = on ? "#fff" : "#222"; d.style.borderColor = on ? "#FF385C" : "#EBEBEB";
      });
      const out = p(t, 3.2, 3.8, E.inExpo);
      root.style.transform = `translateY(${-out * 200}px)`; root.style.opacity = 1 - out;
    };
  }, 5);

  // ---------- Téléphone : parcours réel sur le site ----------
  T.phone(3.3, 39.6, {
    screens: [
      { src: "s-accueil" }, { src: "s-filtres", at: 7.4, dir: "left" }, { src: "s-resultats", at: 12.7, dir: "left" }, { src: "s-favori", at: 15.95, dir: "fade" },
      { src: "s-fiche", at: 17.5, dir: "left" }, { src: "s-visite", at: 19.6, dir: "left" }, { src: "s-visite2", at: 20.6, dir: "up" }, { src: "s-zoom", at: 21.8, dir: "fade" },
      { src: "s-equipements", at: 23.3, dir: "left" }, { src: "s-asavoir", at: 25.6, dir: "up" },
      { src: "s-dates", at: 27.7, dir: "up" }, { src: "s-total", at: 29.9, dir: "up" },
      { src: "s-formulaire", at: 35.5, dir: "fade" }, { src: "s-envoyee", at: 36.9, dir: "fade" },
    ],
    marks: [
      { k: "acc_decouvrir", a: 4.6, b: 7.3, label: "Découvrir les appartements" },
      { k: { ...POS.f_dates, h: POS.f_dates.h + 0.094 }, a: 8.2, b: 9.3, label: "Dates" },
      { k: { ...POS.f_quartier, y: POS.f_quartier.y - 0.097 }, a: 9.3, b: 10.1, label: "Voyageurs" },
      { k: "f_quartier", a: 10.1, b: 11.1, label: "Quartier" },
      { k: "f_btn", a: 11.1, b: 12.6, label: "Rechercher" },
      { k: "r_carte", a: 13.4, b: 15.2, label: "Photos, prix, équipements" },
      { k: "r_coeur", a: 15.3, b: 17.3, label: "Favori" },
      { k: "fi_visite", a: 18.2, b: 19.6, label: "Visite photo" },
      { k: "eq_btn", a: 24.0, b: 25.5, label: "Tous les équipements" },
      { k: "as_regles", a: 26.1, b: 27.6, label: "Règles et conditions" },
      { k: "d_cal", a: 28.2, b: 29.8, label: "Arrivée et départ" },
      { k: "t_total", a: 30.4, b: 32.4, label: "Prix total" },
      { k: "t_wa", a: 33.2, b: 34.4, label: "Réserver sur WhatsApp" },
      { k: "t_demande", a: 34.4, b: 35.5, label: "Ou envoyer une demande" },
      { k: "fo_btn", a: 35.9, b: 36.9 },
      { k: { x: 0.08, y: 0.4, w: 0.84, h: 0.2 }, a: 37.3, b: 39.2, label: "C'est envoyé !" },
    ],
    taps: [
      { at: 6.8, k: "acc_decouvrir" }, { at: 12.1, k: "f_btn" }, { at: 15.75, k: "r_coeur" }, { at: 19.1, k: "fi_visite" },
      { at: 21.4, x: 0.5, y: 0.5 }, { at: 25.0, k: "eq_btn" }, { at: 28.6, x: 0.713, y: 0.265 }, { at: 29.2, x: 0.282, y: 0.318 },
      { at: 35.1, k: "t_demande" }, { at: 36.5, k: "fo_btn" },
    ],
  });

  // ---------- 7 étapes ----------
  const K = "MODE D'EMPLOI", cs = nine ? 90 : 72;
  T.steps([
    { a: 3.7, b: 7.7, kick: K, n: "1", lab: "Ouvrez le site", sub: "Touchez « Découvrir les appartements »." },
    { a: 7.7, b: 13.0, kick: K, n: "2", lab: "Filtrez votre recherche", sub: "Dates, voyageurs et quartier." },
    { a: 13.0, b: 17.6, kick: K, n: "3", lab: "Comparez les logements", sub: "Photos, prix et équipements en un coup d'œil.",
      extras: [{ html: "Gardez vos favoris", at: 2.5, dy: 0 }] },
    { a: 17.6, b: 23.4, kick: K, n: "4", lab: "Visitez en photos", sub: "Pièce par pièce, avec zoom.",
      extras: [{ html: "Visite photo", at: 2.0, dy: 0 }, { html: "Zoom sur chaque photo", at: 3.9, dy: cs }] },
    { a: 23.4, b: 27.8, kick: K, n: "5", lab: "Lisez les détails", sub: "Équipements et « À savoir » : horaires, règles, annulation." },
    { a: 27.8, b: 32.6, kick: K, n: "6", lab: "Choisissez vos dates", sub: "Le prix total s'affiche aussitôt." },
    { a: 32.6, b: 39.4, kick: K, n: "7", lab: "Réservez", sub: "Sur WhatsApp ou par demande en ligne.",
      extras: [{ html: "Message déjà rédigé", at: 0.9, dy: 0, dot: "#25D366" }, { html: "Pas de compte à créer", at: 2.4, dy: cs }, { html: "On vous recontacte", at: 4.4, dy: cs * 2 }] },
  ]);

  // ---------- Appel à l'action ----------
  T.cta(39.3, R.dur, {
    recap: ["1 · Filtrer", "2 · Comparer", "3 · Visiter", "4 · Réserver"],
    title: "Trouvez votre appartement meublé à Lomé.",
    sub: "Tout se fait depuis votre téléphone.",
    btn: "DÉCOUVRIR LES APPARTEMENTS",
  });

  R.hideCaps = (t) => t < 3.7 || t > 39.3;
  R.captions("light");
  R.finish({ grain: 0.025, vignette: 0.12 });
})();
