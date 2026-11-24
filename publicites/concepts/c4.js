/* CONCEPT 4 — « 3 étapes » : simplicité de réservation. Fond clair, téléphone avec le vrai site, interface animée. */
(() => {
  const { E, p, env, el, photo, cam, split, reveal, show, scene, H, W, clamp, lerp } = R;
  R.dur = 37.6;
  const nine = R.fmt === "9x16";
  const Y = (f) => Math.round(H * f) + "px";
  const SW = nine ? 470 : 330, SH = Math.round(SW * 2532 / 1170), BZ = 16;
  const PX = W - SW - BZ * 2 - (nine ? 58 : 110), PY = nine ? 300 : 250;
  const css = document.createElement("style");
  css.textContent = `
    .c4 { position:absolute; inset:0; background:#fff; color:#222; font-family:"Figtree", sans-serif; }
    .three { position:absolute; left:0; right:0; text-align:center; font: 900 ${nine ? 560 : 420}px/0.8 "Figtree"; color:#FF385C; letter-spacing:-.06em; }
    .h4w { color:#222; position:absolute; left:60px; right:60px; text-align:center; font: 800 ${nine ? 96 : 80}px/1 "Figtree"; letter-spacing:-.035em; }
    .h4s { position:absolute; left:80px; right:80px; text-align:center; font: 500 ${nine ? 46 : 40}px/1.25 "Figtree"; color:#6A6A6A; }
    .phone { position:absolute; width:${SW + BZ * 2}px; height:${SH + BZ * 2}px; border-radius:${nine ? 76 : 56}px; background:#111; padding:${BZ}px;
             box-shadow: 0 50px 100px rgba(0,0,0,.28), 0 0 0 2px #2a2a2a inset; }
    .screen { position:relative; width:100%; height:100%; border-radius:${nine ? 60 : 42}px; overflow:hidden; background:#fff; }
    .screen > img, .screen > .chat { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .island { position:absolute; top:${BZ + 12}px; left:50%; width:${SW * 0.3}px; height:${nine ? 34 : 26}px; border-radius:20px; background:#000; transform:translateX(-50%); z-index:5; }
    .step { color:#222; position:absolute; left:${nine ? 56 : 80}px; width:${PX - (nine ? 80 : 120)}px; }
    .step .num { font: 900 ${nine ? 240 : 190}px/0.8 "Figtree"; color:#FF385C; letter-spacing:-.06em; }
    .step .lab { font: 800 ${nine ? 62 : 52}px/1.02 "Figtree"; letter-spacing:-.03em; margin-top:18px; }
    .step .sub { font: 500 ${nine ? 34 : 30}px/1.3 "Figtree"; color:#6A6A6A; margin-top:16px; }
    .chip { color:#222; position:absolute; left:${nine ? 56 : 80}px; display:flex; align-items:center; gap:14px; background:#fff; border:2px solid #EBEBEB; border-radius:999px;
            padding:16px 26px; font: 700 ${nine ? 34 : 30}px/1 "Figtree"; box-shadow:0 10px 24px rgba(0,0,0,.08); white-space:nowrap; }
    .chip i { width:14px; height:14px; border-radius:50%; background:#FF385C; display:block; }
    .bubble { position:absolute; left:${nine ? 56 : 80}px; background:#222; color:#fff; border-radius:28px; padding:${nine ? "30px 34px" : "24px 28px"}; box-shadow:0 20px 40px rgba(0,0,0,.25); }
    .bubble .a { font: 600 ${nine ? 30 : 26}px/1 "Figtree"; opacity:.75; }
    .bubble .b { font: 900 ${nine ? 64 : 54}px/1 "Figtree"; letter-spacing:-.03em; margin-top:10px; }
    .tap { position:absolute; width:110px; height:110px; border-radius:50%; background:rgba(255,56,92,.25); border:5px solid #FF385C; z-index:6; }
    .chat { background:#ECE5DD; display:flex; flex-direction:column; }
    .chat .bar { background:#1F2C33; color:#fff; padding:${nine ? "64px 22px 20px" : "48px 18px 16px"}; display:flex; align-items:center; gap:14px; font: 700 ${nine ? 26 : 20}px/1.1 "Figtree"; }
    .chat .bar img { width:${nine ? 52 : 40}px; height:${nine ? 52 : 40}px; border-radius:50%; background:#fff; object-fit:contain; }
    .chat .bar small { display:block; font-weight:400; font-size:.75em; opacity:.75; }
    .chat .body { flex:1; padding:22px 16px; display:flex; flex-direction:column; gap:14px; justify-content:flex-end; }
    .msg { color:#111B21; max-width:88%; padding:14px 16px 10px; border-radius:16px; font: 400 ${nine ? 22 : 17}px/1.35 "Figtree"; white-space:pre-wrap; box-shadow:0 1px 1px rgba(0,0,0,.12); }
    .msg.me { align-self:flex-end; background:#D9FDD3; border-top-right-radius:4px; }
    .msg.them { align-self:flex-start; background:#fff; border-top-left-radius:4px; }
    .msg .meta { display:block; text-align:right; font-size:.7em; color:#667781; margin-top:4px; }
    .msg .meta b { color:#53BDEB; font-weight:700; }
    .compose { background:#F0F2F5; padding:14px 14px ${nine ? 30 : 20}px; display:flex; gap:10px; align-items:flex-end; }
    .compose .in { flex:1; background:#fff; border-radius:22px; padding:12px 16px; font: 400 ${nine ? 21 : 16}px/1.35 "Figtree"; min-height:44px; white-space:pre-wrap; color:#222; }
    .compose .send { width:${nine ? 54 : 42}px; height:${nine ? 54 : 42}px; border-radius:50%; background:#25D366; display:grid; place-items:center; flex:none; }
    .compose .send svg { width:55%; height:55%; fill:#fff; }
    .ctabg { position:absolute; inset:0; background: radial-gradient(circle at 50% 40%, #FF385C, #E31C5F 55%, #C4045C); }
    .ct4 { position:absolute; left:70px; right:70px; text-align:center; font: 900 ${nine ? 100 : 84}px/0.98 "Figtree"; letter-spacing:-.04em; color:#fff; }
    .cs4 { position:absolute; left:90px; right:90px; text-align:center; font: 500 ${nine ? 42 : 36}px/1.3 "Figtree"; color:rgba(255,255,255,.92); }
    .recap { position:absolute; left:0; right:0; display:flex; justify-content:center; gap:14px; }
    .recap span { background:rgba(255,255,255,.18); color:#fff; border-radius:999px; padding:14px 24px; font: 700 ${nine ? 32 : 28}px/1 "Figtree"; }
    .btn4 { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; padding:${nine ? "36px 60px" : "28px 48px"}; border-radius:999px; background:#fff; color:#E31C5F;
            font: 900 ${nine ? 40 : 34}px/1 "Figtree"; letter-spacing:.02em; box-shadow:0 20px 40px rgba(80,0,30,.3); }
    .brand4 { position:absolute; left:0; right:0; display:flex; justify-content:center; align-items:center; gap:18px; font: 700 32px/1.2 "Figtree"; color:#fff; }
    .brand4 img { width:78px; height:78px; border-radius:18px; background:#fff; object-fit:contain; }
    .brand4 small { display:block; font-weight:500; font-size:27px; opacity:.9; }
  `;
  document.head.appendChild(css);
  const SEND = '<svg viewBox="0 0 24 24"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg>';
  const MSG = "Bonjour LUMO Immobilier, je souhaite réserver :\n🏠 Appartement 1 chambre salon, Agoè 2 Lions\n📅 Du 5 déc. au 8 déc. (3 nuits)\n👥 2 personnes\n💰 Prix estimé : 150 000 FCFA\nEst-ce disponible ?";

  // Décor commun : fond blanc + vignettes photo qui flottent derrière le téléphone
  scene(0, 37.6, (root) => {
    const bg = el("div", "c4", root);
    const floats = [["a-chambre-1.jpg", 0.55, nine ? 690 : 760, nine ? 0.05 : 0.04], ["a-cuisine.jpg", 0.75, nine ? 560 : 640, nine ? 0.66 : 0.7]]
      .map(([s, d, x, y]) => { const f = el("div", "", bg); f.style.cssText = `position:absolute;width:${nine ? 260 : 200}px;height:${nine ? 320 : 240}px;border-radius:26px;overflow:hidden;opacity:.0;left:${x}px;top:${Y(y)};box-shadow:0 20px 40px rgba(0,0,0,.15)`; el("img", "", f).src = "img/" + s; f.firstChild.style.cssText = "width:100%;height:100%;object-fit:cover"; return { f, d }; });
    return (t) => floats.forEach((o, i) => {
      const vis = env(t, 4.6 + i * 0.3, 30.8, 0.8, 0.5);
      o.f.style.opacity = vis;
      o.f.style.transform = `translateY(${Math.sin(t * 0.6 + i) * 18 - t * (6 + i * 3)}px) rotate(${(i % 2 ? 6 : -6) + Math.sin(t * 0.4 + i) * 2}deg)`;
    });
  }, 1);

  // ---------- 1. Accroche (0 → 4,6 s) ----------
  scene(0, 4.7, (root) => {
    const three = el("div", "three", root, "3"); three.style.top = Y(nine ? 0.17 : 0.08);
    const w = el("div", "h4w", root, "étapes. C'est tout."); w.style.top = Y(nine ? 0.47 : 0.48);
    const ww = split(w, "étapes. C'est tout.");
    const s = el("div", "h4s", root, "Pour réserver votre appartement meublé à Lomé."); s.style.top = Y(nine ? 0.56 : 0.6);
    return (t) => {
      const k = p(t, 0.05, 0.7, E.outBack);
      three.style.transform = `scale(${lerp(0.2, 1, k)}) rotate(${(1 - k) * -20}deg)`; three.style.opacity = clamp(k * 2);
      reveal(ww, t, 0.6, { style: "up", stagger: 0.12, dur: 0.6, dist: 50 });
      s.style.opacity = p(t, 1.3, 1.8);
      const out = p(t, 3.7, 4.4, E.inExpo);
      root.style.transform = `translateY(${-out * 200}px)`; root.style.opacity = 1 - out;
    };
  }, 5);

  // ---------- Téléphone (3,8 → 31,2 s) avec le vrai site puis WhatsApp ----------
  scene(3.8, 31.6, (root) => {
    const ph = el("div", "phone", root); ph.style.left = PX + "px"; ph.style.top = PY + "px";
    el("div", "island", ph);
    const sc = el("div", "screen", ph);
    const shots = ["1-catalogue", "2-fiche", "3-dates", "4-total"].map((n) => { const i = el("img", "", sc); i.src = "ui/" + n + ".png"; return i; });
    const chat = el("div", "chat", sc, `<div class="bar"><img src="img/logo.jpg"><div>LUMO Immobilier<small>en ligne</small></div></div><div class="body"></div><div class="compose"><div class="in"></div><div class="send">${SEND}</div></div>`);
    const body = chat.querySelector(".body"), inp = chat.querySelector(".in");
    const me = el("div", "msg me", body); const them = el("div", "msg them", body, "Bonjour ! Merci pour votre demande 😊 Nous vérifions la disponibilité et revenons vers vous très vite.<span class='meta'>10:42</span>");
    const tap = el("div", "tap", root);
    return (t, T) => {
      // arrivée du téléphone
      const k = p(T, 3.8, 4.8, E.outExpo);
      ph.style.transform = `translateY(${(1 - k) * 900}px) rotate(${(1 - k) * 10}deg)`;
      // écrans : catalogue → fiche → dates → total → WhatsApp
      const showAt = [[3.8, 9.3], [9.3, 13.2], [13.2, 16.3], [16.3, 22.4]];
      shots.forEach((img, i) => {
        const [a, b] = showAt[i];
        const vin = i === 0 ? 1 : p(T, a, a + 0.45, E.inOutCubic);
        const vout = p(T, b, b + 0.45, E.inOutCubic);
        const on = T >= a && T < b + 0.45;
        img.style.display = on ? "block" : "none";
        img.style.transform = `translateX(${(1 - vin) * 100 - vout * 30}%)`;
        img.style.zIndex = i;
        img.style.filter = `brightness(${1 - vout * 0.3})`;
      });
      const ci = p(T, 22.4, 22.85, E.inOutCubic);
      chat.style.display = T >= 22.4 ? "flex" : "none"; chat.style.transform = `translateX(${(1 - ci) * 100}%)`; chat.style.zIndex = 9;
      // saisie du message prérempli puis envoi
      const typed = Math.floor(MSG.length * p(T, 22.9, 24.6));
      const sent = T >= 25.0;
      inp.textContent = sent ? "" : MSG.slice(0, typed);
      me.style.display = sent ? "block" : "none";
      me.innerHTML = MSG + `<span class="meta">10:41 <b>✓✓</b></span>`;
      me.style.transform = `translateY(${(1 - p(T, 25.0, 25.4, E.outExpo)) * 40}px)`; me.style.opacity = p(T, 25.0, 25.25);
      them.style.display = T >= 26.8 ? "block" : "none"; them.style.opacity = p(T, 26.8, 27.1); them.style.transform = `scale(${lerp(0.8, 1, p(T, 26.8, 27.2, E.outBack))})`;
      them.style.transformOrigin = "left bottom";
      // doigt qui touche l'écran
      const taps = [[8.6, 0.5, 0.33], [12.3, 0.5, 0.9], [14.4, 0.36, 0.55], [24.75, 0.92, 0.93]];
      const cur = taps.find(([a]) => T >= a - 0.1 && T < a + 0.6);
      if (cur) {
        const [a, fx, fy] = cur; const q = p(T, a, a + 0.5, E.outCubic);
        tap.style.display = "block";
        tap.style.left = PX + BZ + SW * fx - 55 + "px"; tap.style.top = PY + BZ + SH * fy - 55 + "px";
        tap.style.opacity = 1 - q; tap.style.transform = `scale(${0.6 + q * 0.9})`;
      } else tap.style.display = "none";
      // sortie vers l'écran final
      const o = p(T, 31.0, 31.6, E.inCubic);
      ph.style.opacity = 1 - o;
    };
  }, 10);

  // ---------- Étapes (colonne de gauche) ----------
  const steps = [
    { a: 4.4, b: 12.7, n: "1", lab: "Choisissez votre logement", sub: "Photos réelles, équipements et prix affichés." },
    { a: 12.8, b: 22.2, n: "2", lab: "Sélectionnez vos dates", sub: "Le prix total s'affiche tout de suite." },
    { a: 22.3, b: 31.0, n: "3", lab: "Réservez sur WhatsApp", sub: "Votre message est déjà rédigé." },
  ];
  steps.forEach((s, si) => scene(s.a, s.b, (root) => {
    const st = el("div", "step", root, `<div class="num">${s.n}</div><div class="lab">${s.lab}</div><div class="sub">${s.sub}</div>`); st.style.top = PY + (nine ? 10 : 0) + "px";
    const [num, lab, sub] = st.children;
    const extras = [];
    if (si === 0) ["Wi-Fi", "Climatisation", "Cuisine équipée"].forEach((c, i) => { const d = el("div", "chip", root, `<i></i>${c}`); d.style.top = PY + (nine ? 640 : 470) + i * (nine ? 96 : 78) + "px"; extras.push({ d, a: 3.3 + i * 0.35 }); });
    if (si === 1) { const d = el("div", "bubble", root, '<div class="a">3 nuits · 2 personnes</div><div class="b">150 000 F</div>'); d.style.top = PY + (nine ? 660 : 480) + "px"; extras.push({ d, a: 3.4, pop: true }); }
    if (si === 2) { const d = el("div", "chip", root, '<i style="background:#25D366"></i>Réponse rapide'); d.style.top = PY + (nine ? 660 : 480) + "px"; extras.push({ d, a: 4.6 }); }
    const d = s.b - s.a;
    return (t) => {
      const k = p(t, 0, 0.6, E.outBack), out = p(t, d - 0.4, d, E.inCubic);
      num.style.transform = `scale(${k * (1 - out * 0.4)})`; num.style.opacity = clamp(k * 2) * (1 - out);
      lab.style.opacity = p(t, 0.25, 0.7) * (1 - out); lab.style.transform = `translateY(${(1 - p(t, 0.25, 0.9, E.outExpo)) * 40}px)`;
      sub.style.opacity = p(t, 0.6, 1.1) * (1 - out);
      extras.forEach((x) => {
        const q = p(t, x.a, x.a + 0.45, E.outBack);
        x.d.style.opacity = clamp(q * 2) * (1 - out);
        x.d.style.transform = x.pop ? `scale(${q})` : `translateX(${(1 - q) * -60}px) scale(${0.8 + q * 0.2})`;
        x.d.style.transformOrigin = "left center";
      });
    };
  }, 12));

  // ---------- 5. Appel à l'action (30,9 → 37,6 s) ----------
  scene(30.9, 37.6, (root) => {
    const bg = el("div", "ctabg", root);
    const rc = el("div", "recap", bg, "<span>1 · Choisir</span><span>2 · Dates</span><span>3 · WhatsApp</span>"); rc.style.top = Y(nine ? 0.2 : 0.1);
    const t1 = el("div", "ct4", bg); t1.style.top = Y(nine ? 0.27 : 0.2);
    const parts = split(t1, "Trouvez votre prochain appartement meublé.");
    const s1 = el("div", "cs4", bg, "Découvrez nos logements et réservez en quelques clics."); s1.style.top = Y(nine ? 0.475 : 0.5);
    const btn = el("div", "btn4", bg, "DÉCOUVRIR LES APPARTEMENTS"); btn.style.top = Y(nine ? 0.56 : 0.63);
    const br = el("div", "brand4", bg, `<img src="img/logo.jpg"><div>LUMO Immobilier<small>WhatsApp +228 70 39 05 05</small></div>`); br.style.top = Y(nine ? 0.67 : 0.79);
    return (t) => {
      const k = p(t, 0, 0.7, E.inOutCubic);
      bg.style.clipPath = `circle(${k * 140}% at ${((PX + 260) / W) * 100}% ${((PY + 520) / H) * 100}%)`;
      [...rc.children].forEach((c, i) => { const q = p(t, 0.5 + i * 0.12, 0.9 + i * 0.12, E.outBack); c.style.opacity = clamp(q * 2); c.style.transform = `scale(${q})`; c.style.display = "inline-block"; });
      reveal(parts, t, 0.75, { style: "up", stagger: 0.06, dur: 0.6, dist: 60 });
      s1.style.opacity = p(t, 1.5, 2.0);
      const b = p(t, 1.9, 2.4, E.outBack);
      const pulse = 1 + Math.sin(Math.max(0, t - 2.6) * 4.5) * 0.025 * p(t, 2.6, 3);
      btn.style.opacity = clamp(b * 2); btn.style.transform = `translateX(-50%) scale(${lerp(0.5, 1, b) * pulse})`;
      br.style.opacity = p(t, 2.4, 2.9);
    };
  }, 30);

  R.hideCaps = (t) => t < 4.4 || t > 30.9;
  R.captions("light");
  R.finish({ grain: 0.025, vignette: 0.12 });
})();
