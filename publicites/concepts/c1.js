/* CONCEPT 1 — « Chez vous, ailleurs » : émotion, confort, lumière chaude. Rythme lent, fondus lumineux. */
(() => {
  const { E, p, env, el, photo, cam, split, reveal, show, scene, H, W } = R;
  R.dur = 42.5;
  const nine = R.fmt === "9x16";
  const Y = (f) => Math.round(H * f) + "px";
  const css = document.createElement("style");
  css.textContent = `
    .serif { font-family: "Playfair Display", serif; }
    .hook { position:absolute; left:80px; right:80px; text-align:center; color:#FBF3E6; text-shadow: 0 4px 30px rgba(0,0,0,.45); }
    .hook .l1 { font: 500 ${nine ? 82 : 74}px/1.08 "Playfair Display", serif; letter-spacing:-.01em; }
    .hook .l2 { font: italic 500 ${nine ? 104 : 92}px/1.05 "Playfair Display", serif; color:#F3D9A8; margin-top:10px; }
    .room { position:absolute; left:84px; display:flex; flex-direction:column; gap:14px; }
    .room .k { font: 600 24px/1 "Inter", sans-serif; letter-spacing:.32em; text-transform:uppercase; color:#F3D9A8; }
    .room .n { font: italic 500 ${nine ? 84 : 72}px/1 "Playfair Display", serif; color:#fff; text-shadow:0 6px 30px rgba(0,0,0,.5); }
    .room .rule { height:2px; background:#F3D9A8; transform-origin:left; width:220px; }
    .card { position:absolute; left:70px; right:70px; background:#F6F1EA; color:#222; border-radius:40px; padding:${nine ? "70px 64px" : "48px 56px"};
            box-shadow: 0 40px 90px rgba(0,0,0,.45); }
    .card h3 { font: 500 ${nine ? 92 : 66}px/1.05 "Playfair Display", serif; letter-spacing:-.01em; }
    .card h3 i { color:#B4562B; }
    .card ul { list-style:none; margin-top:${nine ? 44 : 26}px; display:flex; flex-direction:column; gap:${nine ? 40 : 18}px; }
    .card li { display:flex; align-items:center; gap:28px; font: 500 ${nine ? 52 : 40}px/1.15 "Figtree", sans-serif; }
    .card li svg { width:${nine ? 66 : 52}px; height:${nine ? 66 : 52}px; flex:none; stroke:#B4562B; stroke-width:1.6; fill:none; stroke-linecap:round; stroke-linejoin:round; }
    .card .sep { height:1px; background:#E3D8C8; margin-top:${nine ? 44 : 26}px; transform-origin:left; }
    .big { position:absolute; left:70px; right:70px; text-align:center; font: 500 ${nine ? 108 : 92}px/1.05 "Playfair Display", serif; color:#FFF8EE; text-shadow:0 8px 40px rgba(0,0,0,.55); }
    .big i { color:#F3D9A8; }
    .cta { position:absolute; inset:0; background:#F6F1EA; color:#222; }
    .thumbs { position:absolute; left:0; right:0; display:flex; justify-content:center; }
    .thumb { width:${nine ? 250 : 200}px; height:${nine ? 330 : 250}px; border-radius:28px; overflow:hidden; position:relative; box-shadow:0 24px 50px rgba(60,40,20,.28); border:6px solid #fff; margin:0 -18px; }
    .thumb img { width:100%; height:100%; object-fit:cover; }
    .ctat { position:absolute; left:80px; right:80px; text-align:center; font: 500 ${nine ? 86 : 72}px/1.06 "Playfair Display", serif; letter-spacing:-.015em; }
    .ctat i { color:#E31C5F; }
    .ctas { position:absolute; left:110px; right:110px; text-align:center; font: 400 ${nine ? 40 : 34}px/1.35 "Figtree", sans-serif; color:#5b5249; }
    .btn { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; padding:${nine ? "34px 64px" : "28px 54px"}; border-radius:999px; color:#fff;
           font: 800 ${nine ? 40 : 34}px/1 "Figtree", sans-serif; letter-spacing:.04em; overflow:hidden;
           background: linear-gradient(90deg,#E61E4D,#E31C5F 50%,#D70466); box-shadow: 0 18px 40px rgba(227,28,95,.35); }
    .shine { position:absolute; top:0; bottom:0; width:120px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); transform:skewX(-20deg); }
    .brand { position:absolute; left:0; right:0; display:flex; align-items:center; justify-content:center; gap:22px; font: 600 32px/1.2 "Figtree", sans-serif; color:#3d3630; }
    .brand img { width:86px; height:86px; border-radius:22px; background:#fff; box-shadow:0 8px 20px rgba(0,0,0,.12); object-fit:contain; }
    .brand small { display:block; font-weight:400; color:#7a6f64; font-size:28px; }
  `;
  document.head.appendChild(css);
  const ICON = {
    sofa: '<svg viewBox="0 0 24 24"><path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/><path d="M5 18v2M19 18v2"/></svg>',
    snow: '<svg viewBox="0 0 24 24"><path d="M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11"/><path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.3a5 5 0 0 1 7 0"/><circle cx="12" cy="19.6" r=".9"/></svg>',
    chef: '<svg viewBox="0 0 24 24"><path d="M7 4v7a2 2 0 0 0 4 0V4M9 4v16M16 4c-2 2-2 7 0 8v8"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  };

  // ---------- 1. Accroche (0 → 3,6 s) : fente de lumière qui révèle le salon ----------
  scene(0, 3.9, (root) => {
    const ph = photo("salon-or.jpg", root);
    ph.img.style.filter = "saturate(1.08) contrast(1.05) brightness(.92)";
    const h = el("div", "hook", root);
    h.style.top = Y(nine ? 0.33 : 0.3);
    const l1 = el("div", "l1", h), l2 = el("div", "l2", h);
    const w1 = split(l1, "Et si votre prochain séjour"), w2 = split(l2, "commençait ici ?");
    return (t) => {
      const open = p(t, 0.15, 1.7, E.inOutExpo);
      const half = (1 - open) * 50;
      ph.style.clipPath = `inset(${half}% 0 ${half}% 0)`;
      cam(ph, p(t, 0, 3.9), { s: 1.38, y: 2 }, { s: 1.12, y: -1 }, { ease: E.outCubic });
      R.leak(root, t, 0.6, 3.6, { x0: -20, x1: 120, y: 30, max: 0.5 });
      reveal(w1, t, 0.7, { style: "blur", stagger: 0.09, dur: 0.9 });
      reveal(w2, t, 1.35, { style: "blur", stagger: 0.12, dur: 1.0 });
      root.style.opacity = 1 - p(t, 3.4, 3.9, E.inCubic);
    };
  });

  // ---------- 2. L'expérience (3,4 → 12,8 s) : salon, chambre, cuisine ----------
  const shots = [
    { a: 3.4, b: 6.5, img: "a-salon-baie.jpg", k: "Le salon", n: "baigné de lumière", from: { s: 1.22, y: 3 }, to: { s: 1.08, y: -3 } },
    { a: 6.2, b: 9.5, img: "a-chambre-2.jpg", k: "La chambre", n: "un vrai repos", from: { s: 1.1, x: -3 }, to: { s: 1.24, x: 2 } },
    { a: 9.2, b: 12.9, img: "a-cuisine.jpg", k: "La cuisine", n: "prête à l'emploi", from: { s: 1.25, y: -2 }, to: { s: 1.1, y: 2 } },
  ];
  shots.forEach((s, i) => scene(s.a, s.b, (root) => {
    const ph = photo(s.img, root);
    ph.img.style.filter = "saturate(1.06) contrast(1.04)";
    const shade = el("div", "fx", root); shade.style.background = "linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 70%, rgba(0,0,0,.25) 100%)";
    const lab = el("div", "room", root);
    lab.style.top = (R.safeTop + 40) + "px";
    const k = el("div", "k", lab, s.k), n = el("div", "n", lab), rule = el("div", "rule", lab);
    const nw = split(n, s.n);
    const d = s.b - s.a;
    return (t) => {
      cam(ph, t / d, s.from, s.to);
      const fin = p(t, 0, 0.55, E.inOutSine);
      root.style.opacity = i === 0 ? fin : fin;
      ph.img.style.filter = `saturate(1.06) contrast(1.04) brightness(${1 + (1 - fin) * 0.6})`;
      show(k, env(t, 0.35, d - 0.1, 0.5, 0.4));
      k.style.transform = `translateX(${(1 - p(t, 0.35, 1, E.outExpo)) * -30}px)`;
      reveal(nw, t, 0.5, { style: "mask", stagger: 0.08, dur: 0.8, out: d - 0.55 });
      rule.style.transform = `scaleX(${p(t, 0.6, 1.4, E.outExpo) * (1 - p(t, d - 0.5, d - 0.2))})`;
      R.leak(root, t, 0, d, { color: "255,205,150", x0: 110, x1: -10, y: 20, max: 0.25 });
    };
  }, 2 + i));

  // ---------- 3. Les avantages (12,6 → 25,4 s) : carte crème sur fond flouté ----------
  scene(12.6, 25.4, (root) => {
    const bg = photo("a-salon-angle.jpg", root);
    bg.img.style.filter = "blur(14px) brightness(.62) saturate(1.1)";
    const card = el("div", "card", root);
    card.style.top = Y(nine ? 0.19 : 0.09);
    const h3 = el("h3", "", card, "Tout est <i>déjà là.</i>");
    const ul = el("ul", "", card);
    const items = [["sofa", "Entièrement meublé"], ["snow", "Climatisation"], ["wifi", "Wi-Fi"], ["chef", "Cuisine équipée"], ["cal", "Une nuit, une semaine ou un mois"]]
      .map(([ic, tx]) => { const li = el("li", "", ul, ICON[ic] + `<span>${tx}</span>`); return li; });
    const sep = el("div", "sep", card);
    const paths = items.map((li) => [...li.querySelectorAll("path,rect,circle")]);
    paths.flat().forEach((pa) => { const L = pa.getTotalLength ? pa.getTotalLength() : 60; pa.style.strokeDasharray = L; pa.dataset.l = L; });
    return (t) => {
      cam(bg, t / 12.8, { s: 1.15, x: -2 }, { s: 1.25, x: 2 });
      root.style.opacity = p(t, 0, 0.6, E.inOutSine);
      const up = p(t, 0.2, 1.3, E.outExpo), down = p(t, 12.0, 12.8, E.inCubic);
      card.style.transform = `translateY(${(1 - up) * 260 + down * 120}px) scale(${0.96 + up * 0.04})`;
      card.style.opacity = up * (1 - down);
      h3.style.opacity = p(t, 0.6, 1.4);
      items.forEach((li, i) => {
        const a = 1.1 + i * 0.85;
        const k = p(t, a, a + 0.7, E.outExpo);
        li.style.opacity = k; li.style.transform = `translateX(${(1 - k) * 50}px)`;
        paths[i].forEach((pa) => { pa.style.strokeDashoffset = pa.dataset.l * (1 - p(t, a, a + 1.1, E.outCubic)); });
      });
      sep.style.transform = `scaleX(${p(t, 5.5, 6.6, E.outExpo)})`;
    };
  }, 6);

  // ---------- 4. Projection (25,2 → 35,6 s) : se projeter ----------
  const pj = [
    { a: 25.2, b: 28.9, img: "a-chambre-1.jpg", from: { s: 1.08 }, to: { s: 1.22, y: -2 } },
    { a: 28.6, b: 32.2, img: "a-salon-angle.jpg", from: { s: 1.24, x: 3 }, to: { s: 1.1, x: -2 } },
    { a: 31.9, b: 35.7, img: "a-balcon.jpg", from: { s: 1.06, y: 3 }, to: { s: 1.2, y: -3 } },
  ];
  pj.forEach((s, i) => scene(s.a, s.b, (root) => {
    const ph = photo(s.img, root);
    const d = s.b - s.a;
    const dim = el("div", "fx", root); dim.style.background = "rgba(20,12,4,.28)";
    return (t) => {
      cam(ph, t / d, s.from, s.to);
      root.style.opacity = p(t, 0, 0.6, E.inOutSine);
      R.leak(root, t, 0.2, d, { color: "255,180,110", x0: -10, x1: 110, y: 60, max: 0.42 });
    };
  }, 7 + i));
  // Grands mots par-dessus les trois plans
  scene(25.2, 35.7, (root) => {
    const lines = [
      { a: 0.6, b: 3.5, html: "Posez vos valises." },
      { a: 2.7, b: 5.0, html: "<i>Respirez.</i>" },
      { a: 5.1, b: 9.8, html: "Vous êtes <i>chez vous.</i>" },
    ].map((l) => { const d = el("div", "big", root); d.style.top = Y(nine ? (l.html.includes("Respirez") ? 0.5 : 0.36) : (l.html.includes("Respirez") ? 0.52 : 0.34)); d.innerHTML = l.html; return { ...l, d, parts: split(d, d.textContent) }; });
    // restaurer l'italique après découpage
    lines[1].parts.forEach((w) => (w.style.fontStyle = "italic", w.style.color = "#F3D9A8"));
    lines[2].parts.slice(2).forEach((w) => (w.style.fontStyle = "italic", w.style.color = "#F3D9A8"));
    return (t) => lines.forEach((l) => reveal(l.parts, t, l.a, { style: "blur", stagger: 0.14, dur: 1.0, out: l.b - 0.6, outDur: 0.6 }));
  }, 20);

  // ---------- 5. Appel à l'action (35,3 → 42,5 s) ----------
  scene(35.3, 42.5, (root) => {
    const bg = el("div", "cta", root);
    const th = el("div", "thumbs", bg); th.style.top = Y(nine ? 0.15 : 0.08);
    const tb = ["a-salon-baie.jpg", "a-chambre-1.jpg", "a-cuisine.jpg"].map((s, i) => { const d = el("div", "thumb", th); el("img", "", d).src = "img/" + s; return d; });
    const t1 = el("div", "ctat", bg); t1.style.top = Y(nine ? 0.35 : 0.33);
    t1.innerHTML = "Trouvez votre prochain <i>appartement meublé</i>";
    const parts = split(t1, t1.textContent);
    parts.slice(3).forEach((w) => (w.style.fontStyle = "italic", w.style.color = "#E31C5F"));
    const s1 = el("div", "ctas", bg, "Découvrez nos logements et réservez en quelques clics."); s1.style.top = Y(nine ? 0.505 : 0.555);
    const btn = el("div", "btn", bg, "DÉCOUVRIR LES APPARTEMENTS"); btn.style.top = Y(nine ? 0.585 : 0.675);
    const sh = el("div", "shine", btn);
    const br = el("div", "brand", bg, `<img src="img/logo.jpg"><div>LUMO Immobilier<small>Lomé · WhatsApp +228 70 39 05 05</small></div>`);
    br.style.top = Y(nine ? 0.69 : 0.8);
    return (t) => {
      const k = p(t, 0, 0.8, E.inOutCubic);
      bg.style.clipPath = `circle(${k * 130}% at 50% 55%)`;
      tb.forEach((d, i) => {
        const a = 0.4 + i * 0.12, q = p(t, a, a + 0.9, E.outBack);
        const rot = [-8, 0, 8][i];
        d.style.transform = `translateY(${(1 - q) * 160 + (i === 1 ? -20 : 10)}px) rotate(${rot * q}deg) scale(${0.7 + q * 0.3})`;
        d.style.opacity = p(t, a, a + 0.3); d.style.zIndex = i === 1 ? 2 : 1;
      });
      reveal(parts, t, 0.8, { style: "up", stagger: 0.07, dur: 0.8, dist: 70 });
      s1.style.opacity = p(t, 1.6, 2.2); s1.style.transform = `translateY(${(1 - p(t, 1.6, 2.4, E.outExpo)) * 30}px)`;
      const b = p(t, 2.1, 2.9, E.outBack);
      btn.style.opacity = p(t, 2.1, 2.4);
      const pulse = 1 + Math.sin(Math.max(0, t - 3.2) * 4.2) * 0.022 * p(t, 3.2, 3.6);
      btn.style.transform = `translateX(-50%) scale(${(0.6 + b * 0.4) * pulse})`;
      const sx = ((t - 3) % 1.8) / 1.8; sh.style.left = (-30 + sx * 160) + "%"; sh.style.opacity = t > 3 ? 1 : 0;
      br.style.opacity = p(t, 2.8, 3.5);
    };
  }, 30);

  R.hideCaps = (t) => t < 3.4 || (t > 25.4 && t < 35.2) || t > 35.3;
  R.captions("dark");
  R.finish({ grain: 0.07, vignette: 0.42 });
})();
