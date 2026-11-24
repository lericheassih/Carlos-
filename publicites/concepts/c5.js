/* CONCEPT 5 — « Ce que LUMO vous propose » : présentation des services en 5 chapitres (esthétique du concept 4). */
(() => {
  const { E, p, el, split, reveal, scene, clamp, lerp } = R;
  R.dur = 41.8;
  const T = TUTO(), { nine, Y } = T;
  const css = document.createElement("style");
  css.textContent = `
    .h5logo { position:absolute; left:50%; width:${nine ? 150 : 120}px; height:${nine ? 150 : 120}px; margin-left:${nine ? -75 : -60}px; border-radius:34px; background:#fff; object-fit:contain;
              box-shadow:0 24px 50px rgba(0,0,0,.14); }
    .h5t { position:absolute; left:60px; right:60px; text-align:center; color:#222; font: 900 ${nine ? 104 : 86}px/0.98 "Figtree"; letter-spacing:-.04em; }
    .h5t .w:nth-last-child(-n+2) { color:#FF385C; }
    .h5s { position:absolute; left:80px; right:80px; text-align:center; font: 500 ${nine ? 44 : 38}px/1.25 "Figtree"; color:#6A6A6A; }
    .dots { position:absolute; left:0; right:0; display:flex; justify-content:center; gap:${nine ? 18 : 14}px; }
    .dots span { width:${nine ? 84 : 70}px; height:${nine ? 84 : 70}px; border-radius:50%; border:3px solid #FF385C; color:#FF385C; display:grid; place-items:center; font: 900 ${nine ? 30 : 26}px/1 "Figtree"; }
  `;
  document.head.appendChild(css);

  T.background(R.dur, ["a-salon-baie.jpg", "a-balcon.jpg"], 4.8, 35.6);

  // ---------- Accroche (0 → 4,8 s) ----------
  scene(0, 4.9, (root) => {
    const lg = el("img", "h5logo", root); lg.src = "img/logo.jpg"; lg.style.top = Y(nine ? 0.2 : 0.1);
    const t1 = el("div", "h5t", root); t1.style.top = Y(nine ? 0.32 : 0.29);
    const ww = split(t1, "Ce que LUMO vous propose.");
    const s1 = el("div", "h5s", root, "Appartements meublés à Lomé"); s1.style.top = Y(nine ? 0.5 : 0.56);
    const dots = el("div", "dots", root, ["01", "02", "03", "04", "05"].map((d) => `<span>${d}</span>`).join("")); dots.style.top = Y(nine ? 0.575 : 0.67);
    return (t) => {
      const k = p(t, 0.05, 0.6, E.outBack);
      lg.style.transform = `scale(${k}) rotate(${(1 - k) * -14}deg)`; lg.style.opacity = clamp(k * 2);
      reveal(ww, t, 0.45, { style: "up", stagger: 0.1, dur: 0.6, dist: 50 });
      s1.style.opacity = p(t, 1.3, 1.8);
      [...dots.children].forEach((d, i) => { const q = p(t, 2.4 + i * 0.14, 2.8 + i * 0.14, E.outBack); d.style.opacity = clamp(q * 2); d.style.transform = `scale(${q})`; });
      const out = p(t, 3.9, 4.5, E.inExpo);
      root.style.transform = `translateY(${-out * 200}px)`; root.style.opacity = 1 - out;
    };
  }, 5);

  // ---------- Téléphone : le vrai site ----------
  T.phone(4.0, 35.9, {
    screens: [
      { src: "s-fiche" }, { src: "s-equipements", at: 6.6, dir: "up" }, { src: "s-equipements-liste", at: 8.7, dir: "left" },
      { src: "1-catalogue", at: 10.7, dir: "left" }, { src: "s-filtres", at: 14.1, dir: "fade" },
      { src: "s-tarifs", at: 17.1, dir: "left" },
      { src: "s-visite", at: 23.3, dir: "left" }, { src: "s-visite2", at: 25.3, dir: "up" }, { src: "s-zoom", at: 27.2, dir: "fade" },
      { src: "s-total", at: 29.5, dir: "left" },
    ],
    taps: [{ at: 8.3, k: "eq_btn" }, { at: 26.8, x: 0.5, y: 0.5 }, { at: 34.4, k: "t_wa" }],
    marks: [
      { k: "f_quartier", a: 14.6, b: 16.8, label: "Filtrez par quartier" },
      { k: { x: 0.04, y: 0.135, w: 0.92, h: 0.41 }, a: 19.9, b: 22.8, label: "Plus vous restez, moins vous payez" },
      { k: "t_total", a: 32.0, b: 33.5, label: "Prix total" },
      { k: "t_wa", a: 33.5, b: 35.2, label: "Réserver sur WhatsApp" },
    ],
  });

  // ---------- 5 chapitres ----------
  const K = "LUMO VOUS PROPOSE";
  const cs = nine ? 90 : 72, pc = nine ? 146 : 114;
  const card = (img, n, v) => `<img src="img/${img}"><div><div class="n">${n}</div><div class="v">${v}</div></div>`;
  T.steps([
    { a: 4.6, b: 10.7, kick: K, n: "01", lab: "Des logements meublés et équipés", sub: "Prêts à vivre dès votre arrivée.",
      extras: [{ html: "Wi-Fi", at: 3.0, dy: 0 }, { html: "Climatisation", at: 3.5, dy: cs }, { html: "Cuisine équipée", at: 4.0, dy: cs * 2 }] },
    { a: 10.7, b: 17.1, kick: K, n: "02", lab: "Plusieurs quartiers de Lomé", sub: "Et de nouveaux logements régulièrement.", extraTop: nine ? 620 : 450,
      extras: [
        { cls: "pcard", html: card("a-salon-baie.jpg", "Agoè 2 Lions", "<b>50 000 F</b> / nuit"), at: 1.0, dy: 0, pop: true },
        { cls: "pcard", html: card("b-salon1.jpg", "Hedzranawoé", "dès <b>40 000 F</b> / nuit"), at: 1.4, dy: pc, pop: true, hot: [3.7, 6.0] },
        { cls: "pcard", html: card("t-salon.jpg", "Totsi", "<b>75 000 F</b> / nuit"), at: 1.8, dy: pc * 2, pop: true },
      ] },
    { a: 17.1, b: 23.3, kick: K, n: "03", lab: "De 2 nuits à plusieurs mois", sub: "Tarifs à la semaine et au mois.",
      extras: [
        { html: "1 semaine · 500 000 F", at: 1.6, dy: 0 },
        { cls: "bubble", html: '<div class="a">1 mois à Totsi</div><div class="b">800 000 F</div><div class="c">soit 26 667 F / nuit</div>', at: 3.0, dy: cs + (nine ? 10 : 6), pop: true },
      ] },
    { a: 23.3, b: 29.5, kick: K, n: "04", lab: "De vraies photos, pièce par pièce", sub: "Les photos de nos propres logements.",
      extras: [{ html: "Visite photo", at: 2.2, dy: 0 }, { html: "Zoom sur chaque photo", at: 3.9, dy: cs }] },
    { a: 29.5, b: 35.8, kick: K, n: "05", lab: "Une réservation simple", sub: "Sans compte, depuis votre téléphone.",
      extras: [{ html: "Prix total affiché", at: 2.5, dy: 0 }, { html: "Réservation WhatsApp", at: 4.0, dy: cs, dot: "#25D366" }, { html: "ou demande en ligne", at: 4.6, dy: cs * 2 }] },
  ]);

  // ---------- Appel à l'action ----------
  T.cta(35.7, R.dur, {
    recap: ["Meublé et équipé", "Plusieurs quartiers", "Nuit · semaine · mois", "Photos réelles", "WhatsApp"],
    title: "Votre appartement meublé à Lomé.",
    sub: "Découvrez nos logements et réservez en quelques clics.",
    btn: "DÉCOUVRIR LES APPARTEMENTS",
  });

  R.hideCaps = (t) => t < 4.6 || t > 35.7;
  R.captions("light");
  R.finish({ grain: 0.025, vignette: 0.12 });
})();
