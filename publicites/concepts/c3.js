/* CONCEPT 3 — « Votre bureau à Lomé » : séjours professionnels. Noir profond, filets dorés, typographie fine, panneaux 3D en parallaxe. */
(() => {
  const { E, p, env, el, photo, cam, split, reveal, show, scene, H, clamp, lerp } = R;
  R.dur = 41;
  const nine = R.fmt === "9x16";
  const Y = (f) => Math.round(H * f) + "px";
  const GOLD = "#C9A86A";
  const css = document.createElement("style");
  css.textContent = `
    .c3 { font-family:"Inter", sans-serif; color:#F1EADF; }
    .hair { position:absolute; left:90px; right:90px; height:2px; background:${GOLD}; transform-origin:left; }
    .city { position:absolute; left:90px; font: 500 30px/1 "Inter"; letter-spacing:.5em; color:${GOLD}; }
    .clock { position:absolute; left:84px; font: 200 ${nine ? 230 : 190}px/1 "Inter"; letter-spacing:-.04em; color:#fff; font-variant-numeric: tabular-nums; }
    .meet { position:absolute; left:90px; right:90px; font: 300 ${nine ? 58 : 50}px/1.2 "Inter"; color:#F1EADF; }
    .caret { display:inline-block; width:3px; height:1em; background:${GOLD}; vertical-align:-0.12em; margin-left:6px; }
    .stage3d { position:absolute; inset:0; perspective:1500px; perspective-origin:50% 45%; }
    .panel { position:absolute; border-radius:18px; overflow:hidden; box-shadow:0 40px 80px rgba(0,0,0,.6); outline:1px solid rgba(201,168,106,.35); }
    .panel img { width:100%; height:100%; object-fit:cover; }
    .lbl { position:absolute; left:90px; right:90px; display:flex; flex-direction:column; gap:16px; }
    .lbl .n { font: 500 26px/1 "Inter"; letter-spacing:.4em; color:${GOLD}; }
    .lbl .t { font: 300 ${nine ? 70 : 58}px/1.1 "Inter"; color:#fff; letter-spacing:-.01em; }
    .lbl .t em { font-family:"Playfair Display"; font-style:italic; color:${GOLD}; font-weight:500; }
    .sheet { position:absolute; left:70px; right:70px; padding:${nine ? "64px 56px" : "44px 46px"}; background:rgba(12,12,14,.78); backdrop-filter: blur(6px); }
    .corner { position:absolute; width:46px; height:46px; border-color:${GOLD}; border-style:solid; }
    .sheet h5 { font: 500 26px/1 "Inter"; letter-spacing:.45em; color:${GOLD}; margin-bottom:${nine ? 34 : 22}px; }
    .row { display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:${nine ? "26px 0" : "17px 0"}; position:relative; }
    .row .k { font: 400 ${nine ? 30 : 26}px/1 "Inter"; letter-spacing:.22em; text-transform:uppercase; color:rgba(241,234,223,.6); }
    .row .v { font: 300 ${nine ? 46 : 38}px/1.1 "Inter"; color:#fff; text-align:right; }
    .row .line { position:absolute; left:0; right:0; bottom:0; height:1px; background:rgba(201,168,106,.45); transform-origin:left; }
    .flare { position:absolute; left:-20%; right:-20%; height:3px; background:linear-gradient(90deg,transparent,rgba(255,226,170,.95),transparent); filter: blur(1px); mix-blend-mode:screen; }
    .flareGlow { position:absolute; width:700px; height:260px; border-radius:50%; background:radial-gradient(closest-side, rgba(255,214,150,.55), rgba(255,214,150,0)); mix-blend-mode:screen; }
    .quote { position:absolute; left:80px; right:80px; text-align:center; font: italic 500 ${nine ? 96 : 80}px/1.08 "Playfair Display", serif; color:#fff; text-shadow:0 8px 40px rgba(0,0,0,.6); }
    .quote span.g { color:${GOLD}; }
    .cta3 { position:absolute; inset:0; background: radial-gradient(ellipse at 50% 35%, #1b1b20 0%, #0a0a0c 70%); }
    .frame { position:absolute; left:56px; right:56px; border:1.5px solid ${GOLD}; }
    .c3t { position:absolute; left:100px; right:100px; text-align:center; font: 300 ${nine ? 72 : 60}px/1.12 "Inter"; letter-spacing:.01em; color:#fff; text-transform:uppercase; }
    .c3t b { font-weight:600; color:${GOLD}; }
    .c3s { position:absolute; left:110px; right:110px; text-align:center; font: 300 ${nine ? 38 : 32}px/1.4 "Inter"; color:rgba(241,234,223,.8); }
    .btn3 { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; padding:${nine ? "32px 58px" : "26px 46px"}; border:2px solid ${GOLD};
            font: 600 ${nine ? 34 : 30}px/1 "Inter"; letter-spacing:.28em; color:${GOLD}; overflow:hidden; }
    .btn3 .fill { position:absolute; inset:0; background:${GOLD}; transform-origin:left; z-index:-1; }
    .brand3 { position:absolute; left:0; right:0; display:flex; justify-content:center; align-items:center; gap:22px; font: 400 30px/1.3 "Inter"; color:rgba(241,234,223,.85); letter-spacing:.06em; }
    .brand3 img { width:80px; height:80px; border-radius:16px; background:#fff; object-fit:contain; }
  `;
  document.head.appendChild(css);

  // ---------- 1. Accroche (0 → 4,6 s) : l'heure tourne, la réunion approche ----------
  scene(0, 4.7, (root) => {
    root.classList.add("c3"); root.style.background = "#000";
    const ph = photo("a-entree-1.jpg", root); ph.img.style.filter = "brightness(.55) saturate(.9) contrast(1.1)";
    const city = el("div", "city", root, "LOMÉ · TOGO"); city.style.top = Y(nine ? 0.25 : 0.1);
    const clock = el("div", "clock", root); clock.style.top = Y(nine ? 0.28 : 0.18);
    const hair = el("div", "hair", root); hair.style.top = Y(nine ? 0.43 : 0.4);
    const meet = el("div", "meet", root); meet.style.top = Y(nine ? 0.455 : 0.43);
    const full = "Votre réunion est à 9 h 30.";
    return (t) => {
      const open = p(t, 2.2, 4.3, E.inOutExpo);
      ph.style.clipPath = `inset(${(1 - open) * 50}% 0 ${(1 - open) * 50}% 0)`;
      cam(ph, p(t, 2.2, 4.7), { s: 1.3 }, { s: 1.12 });
      city.style.opacity = p(t, 0.1, 0.6); city.style.letterSpacing = lerp(0.9, 0.5, p(t, 0.1, 1.2, E.outCubic)) + "em";
      const mins = 44 + Math.min(3, Math.floor(p(t, 0.2, 1.4) * 3.999));
      clock.textContent = `08:${mins}`;
      clock.style.opacity = p(t, 0.2, 0.6);
      hair.style.transform = `scaleX(${p(t, 0.4, 1.6, E.inOutExpo)})`;
      const n = Math.floor(full.length * p(t, 1.5, 3.2));
      meet.innerHTML = full.slice(0, n) + `<span class="caret" style="opacity:${Math.floor(t * 2.2) % 2 ? 1 : 0.15}"></span>`;
      root.style.opacity = 1 - p(t, 4.3, 4.7);
    };
  });

  // ---------- 2. Travailler au calme (4,4 → 12,9 s) : panneaux 3D en parallaxe ----------
  scene(4.4, 12.9, (root) => {
    root.classList.add("c3"); root.style.background = "radial-gradient(ellipse at 50% 40%, #1d1d22 0%, #08080a 75%)";
    const st = el("div", "stage3d", root);
    const pw = nine ? 760 : 620, ph = nine ? 980 : 640;
    const panels = [
      { img: "a-salle-a-manger.jpg", x: 160, y: nine ? 0.27 : 0.22, z: 0, ry: -14, w: pw, h: ph },
      { img: "t-salle-a-manger.jpg", x: -60, y: nine ? 0.2 : 0.16, z: -500, ry: 18, w: 560, h: 380 },
      { img: "a-salon-baie.jpg", x: 520, y: nine ? 0.58 : 0.6, z: -350, ry: -22, w: 420, h: 560 },
    ].map((d) => { const e = el("div", "panel", st); e.style.width = d.w + "px"; e.style.height = d.h + "px"; el("img", "", e).src = "img/" + d.img; return { ...d, e }; });
    const lbl = el("div", "lbl", root); lbl.style.top = (R.safeTop - 30) + "px";
    el("div", "n", lbl, "01 — LE CALME");
    const tt = el("div", "t", lbl, "Travaillez au calme.");
    const lbl2 = el("div", "lbl", root); lbl2.style.top = (R.safeTop - 30) + "px";
    el("div", "n", lbl2, "02 — L'ESSENTIEL");
    el("div", "t", lbl2, "Wi-Fi et vraie <em>table de travail.</em>");
    return (t) => {
      root.style.opacity = p(t, 0, 0.5);
      panels.forEach((d, i) => {
        const k = p(t, 0.1 + i * 0.25, 1.6 + i * 0.25, E.outExpo);
        const drift = t * (i === 0 ? 14 : i === 1 ? 26 : 34);
        d.e.style.left = d.x + "px"; d.e.style.top = Y(d.y);
        d.e.style.transform = `translate3d(${-drift + (1 - k) * 300}px, ${(1 - k) * 120}px, ${d.z - (1 - k) * 600}px) rotateY(${d.ry + Math.sin(t * 0.5) * 3}deg)`;
        d.e.style.opacity = k;
        d.e.style.zIndex = i === 0 ? 3 : 1;
      });
      show(lbl, env(t, 0.6, 4.4, 0.6, 0.4)); lbl.style.transform = `translateY(${(1 - p(t, 0.6, 1.4, E.outExpo)) * 30}px)`;
      show(lbl2, env(t, 4.5, 8.5, 0.6, 0.4)); lbl2.style.transform = `translateY(${(1 - p(t, 4.5, 5.3, E.outExpo)) * 30}px)`;
    };
  }, 2);

  // ---------- 3. Fiche d'essentiels (12,7 → 25,4 s) ----------
  scene(12.7, 25.4, (root) => {
    root.classList.add("c3");
    const bg = photo("a-immeuble.jpg", root); bg.img.style.filter = "brightness(.42) saturate(.8) contrast(1.1)";
    const sweep = el("div", "fx", root);
    const sh = el("div", "sheet", root); sh.style.top = Y(nine ? 0.2 : 0.09);
    [["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].forEach(([v, hh]) => {
      const c = el("div", "corner", sh); c.style[v] = "-2px"; c.style[hh] = "-2px";
      c.style.borderWidth = `${v === "top" ? 2 : 0}px ${hh === "right" ? 2 : 0}px ${v === "bottom" ? 2 : 0}px ${hh === "left" ? 2 : 0}px`;
    });
    el("h5", "", sh, "L'ESSENTIEL");
    const rows = [
      ["Connexion", "Wi-Fi"], ["Confort", "Climatisation"], ["Arrivée", "Autonome*"], ["Durée", "1 nuit → plusieurs mois"],
      ["Tarifs", "dès 40 000 FCFA / nuit"], ["Quartiers", "Agoè · Hedzranawoé · Totsi"],
    ].map(([k, v]) => { const r = el("div", "row", sh, `<span class="k">${k}</span><span class="v">${v}</span><span class="line"></span>`); return r; });
    const foot = el("div", "", sh, "* selon le logement"); foot.style.cssText = "font:300 24px/1 Inter;color:rgba(241,234,223,.5);margin-top:18px";
    return (t) => {
      root.style.opacity = p(t, 0, 0.5);
      cam(bg, t / 12.7, { s: 1.12, y: 3 }, { s: 1.22, y: -3 });
      const sx = p(t, 0.5, 6, E.inOutSine);
      sweep.style.background = `linear-gradient(100deg, transparent ${sx * 120 - 30}%, rgba(255,225,170,.14) ${sx * 120 - 15}%, transparent ${sx * 120}%)`;
      const k = p(t, 0.3, 1.2, E.outExpo);
      sh.style.opacity = k * (1 - p(t, 12.2, 12.7)); sh.style.transform = `translateY(${(1 - k) * 60}px)`;
      rows.forEach((r, i) => {
        const a = 0.9 + i * 0.75;
        const q = p(t, a, a + 0.7, E.outExpo);
        r.style.opacity = q; r.style.transform = `translateY(${(1 - q) * 24}px)`;
        r.querySelector(".line").style.transform = `scaleX(${p(t, a + 0.1, a + 1.0, E.inOutCubic)})`;
      });
      foot.style.opacity = p(t, 5.6, 6.2);
    };
  }, 3);

  // ---------- 4. Le soir (25,2 → 35,3 s) : plans de nuit, reflet anamorphique ----------
  const night = [
    { a: 25.2, b: 28.8, img: "a-chambre-2.jpg", from: { s: 1.06 }, to: { s: 1.2, y: -2 } },
    { a: 28.5, b: 32.0, img: "salon-or.jpg", from: { s: 1.22, x: 2 }, to: { s: 1.08, x: -2 } },
    { a: 31.7, b: 35.4, img: "a-salon-angle.jpg", from: { s: 1.1, y: 2 }, to: { s: 1.24 } },
  ];
  night.forEach((s, i) => scene(s.a, s.b, (root) => {
    const ph = photo(s.img, root); ph.img.style.filter = "brightness(.78) saturate(.92) contrast(1.08)";
    const fl = el("div", "flare", root), gl = el("div", "flareGlow", root);
    const d = s.b - s.a;
    return (t) => {
      cam(ph, t / d, s.from, s.to);
      root.style.opacity = p(t, 0, 0.55, E.inOutSine);
      const fx = p(t, 0.3, d, E.inOutSine);
      const yy = H * (0.3 + i * 0.12);
      fl.style.top = yy + "px"; fl.style.transform = `translateX(${(fx - 0.5) * 60}%)`; fl.style.opacity = Math.sin(Math.PI * fx) * 0.9;
      gl.style.top = yy - 130 + "px"; gl.style.left = `${fx * 100 - 30}%`; gl.style.opacity = Math.sin(Math.PI * fx) * 0.8;
    };
  }, 4 + i));
  scene(25.6, 35.3, (root) => {
    const q = el("div", "quote", root); q.style.top = Y(nine ? 0.3 : 0.26);
    q.innerHTML = "Après la journée,<br><span class='g'>le calme.</span>";
    return (t) => { const k = env(t, 0.6, 9.4, 1.2, 0.8, E.outCubic, E.inCubic); q.style.opacity = k; q.style.filter = `blur(${(1 - p(t, 0.6, 1.8, E.outCubic)) * 14}px)`; q.style.transform = `translateY(${(1 - p(t, 0.6, 2, E.outCubic)) * 30}px)`; };
  }, 20);

  // ---------- 5. Appel à l'action (35,1 → 41 s) ----------
  scene(35.1, 41, (root) => {
    root.classList.add("c3");
    const bg = el("div", "cta3", root);
    const fr = el("div", "frame", bg); fr.style.top = Y(nine ? 0.17 : 0.07); fr.style.bottom = Y(nine ? 0.23 : 0.07);
    const br = el("div", "brand3", bg, `<img src="img/logo.jpg"><span>LUMO IMMOBILIER · LOMÉ</span>`); br.style.top = Y(nine ? 0.21 : 0.12);
    const t1 = el("div", "c3t", bg, "Trouvez votre prochain <b>appartement meublé</b>"); t1.style.top = Y(nine ? 0.31 : 0.27);
    const s1 = el("div", "c3s", bg, "Votre séjour d'affaires à Lomé, en toute sérénité. Découvrez nos logements et réservez en quelques clics."); s1.style.top = Y(nine ? 0.5 : 0.56);
    const btn = el("div", "btn3", bg, `<span class="fill"></span><span class="lab">DÉCOUVRIR LES APPARTEMENTS</span>`); btn.style.top = Y(nine ? 0.625 : 0.74);
    const fill = btn.querySelector(".fill"), lab = btn.querySelector(".lab");
    btn.style.isolation = "isolate";
    const wa = el("div", "brand3", bg, "WhatsApp +228 70 39 05 05"); wa.style.top = Y(nine ? 0.7 : 0.85); wa.style.fontSize = "28px";
    return (t) => {
      bg.style.opacity = p(t, 0, 0.6);
      const fk = p(t, 0.2, 1.4, E.inOutExpo);
      fr.style.clipPath = `inset(0 ${(1 - fk) * 50}% 0 ${(1 - fk) * 50}%)`;
      br.style.opacity = p(t, 0.5, 1.0);
      t1.style.opacity = p(t, 0.7, 1.4); t1.style.letterSpacing = lerp(0.12, 0.01, p(t, 0.7, 2.0, E.outCubic)) + "em";
      s1.style.opacity = p(t, 1.4, 2.0);
      btn.style.opacity = p(t, 1.9, 2.3);
      const f = p(t, 2.7, 3.3, E.inOutCubic);
      fill.style.transform = `scaleX(${f})`; lab.style.color = f > 0.55 ? "#0b0b0d" : GOLD;
      wa.style.opacity = p(t, 2.4, 2.9);
    };
  }, 30);

  R.hideCaps = (t) => t < 4.4 || t > 35.1;
  R.captions("gold");
  R.finish({ grain: 0.06, vignette: 0.55 });
})();
