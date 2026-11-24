/* CONCEPT 2 — « Trouvé. » : dynamique, recherche rapide. Coupes sur le tempo (124 BPM), typographie massive, rose de marque. */
(() => {
  const { E, p, env, el, photo, cam, split, reveal, show, scene, H, clamp, lerp } = R;
  R.dur = 36.6;
  const nine = R.fmt === "9x16";
  const BEAT = 60 / 124;
  const Y = (f) => Math.round(H * f) + "px";
  const css = document.createElement("style");
  css.textContent = `
    .slam { position:absolute; left:0; right:0; text-align:center; font: 900 ${nine ? 200 : 170}px/0.9 "Figtree", sans-serif; letter-spacing:-.045em; color:#fff;
            text-shadow: 0 10px 50px rgba(0,0,0,.45); }
    .slam.pink { color:#FF385C; }
    .flash { position:absolute; inset:0; background:#fff; mix-blend-mode:normal; }
    .tag { position:absolute; left:0; right:0; display:flex; justify-content:center; gap:16px; }
    .tag span { background:#FF385C; color:#fff; font: 800 ${nine ? 40 : 34}px/1 "Figtree", sans-serif; letter-spacing:.06em; padding:16px 26px; border-radius:14px; }
    .tag span.w { background:#fff; color:#222; }
    .grid4 { position:absolute; left:46px; right:46px; display:grid; grid-template-columns:1fr 1fr; gap:${nine ? 26 : 20}px; }
    .apt { position:relative; border-radius:28px; overflow:hidden; height:${nine ? 520 : 360}px; background:#111; box-shadow:0 20px 40px rgba(0,0,0,.4); }
    .apt img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .apt .info { position:absolute; left:0; right:0; bottom:0; padding:22px 24px; background:linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0)); }
    .apt .q { font: 600 ${nine ? 30 : 26}px/1.15 "Figtree", sans-serif; color:#fff; }
    .apt .pr { font: 900 ${nine ? 46 : 38}px/1.05 "Figtree", sans-serif; color:#fff; margin-top:6px; }
    .apt .pr small { font-size:.55em; font-weight:600; opacity:.85; }
    .bigprice { position:absolute; left:0; right:0; text-align:center; color:#fff; }
    .bigprice .a { font: 700 ${nine ? 48 : 40}px/1 "Figtree", sans-serif; letter-spacing:.02em; opacity:.9; }
    .bigprice .n { font: 900 ${nine ? 210 : 170}px/0.95 "Figtree", sans-serif; letter-spacing:-.05em; color:#FF385C; }
    .bigprice .u { font: 800 ${nine ? 56 : 46}px/1 "Figtree", sans-serif; }
    .rows { position:absolute; inset:-30%; transform: rotate(-12deg); display:flex; flex-direction:column; gap:22px; justify-content:center; }
    .rowp { display:flex; gap:22px; }
    .rowp img { width:420px; height:300px; object-fit:cover; border-radius:22px; flex:none; }
    .dark { position:absolute; inset:0; background:rgba(10,10,12,.72); }
    .checks { position:absolute; left:70px; right:70px; display:flex; flex-direction:column; gap:${nine ? 30 : 20}px; }
    .chk { display:flex; align-items:center; gap:28px; font: 900 ${nine ? 104 : 80}px/1 "Figtree", sans-serif; letter-spacing:-.035em; color:#fff; }
    .chk b { flex:none; width:${nine ? 92 : 76}px; height:${nine ? 92 : 76}px; border-radius:50%; background:#FF385C; display:grid; place-items:center; }
    .chk b svg { width:56%; height:56%; stroke:#fff; stroke-width:3.2; fill:none; stroke-linecap:round; stroke-linejoin:round; }
    .tiers { position:absolute; left:60px; right:60px; display:flex; flex-direction:column; gap:22px; }
    .tiers h4 { font: 800 ${nine ? 58 : 48}px/1.05 "Figtree", sans-serif; color:#fff; letter-spacing:-.02em; margin-bottom:10px; }
    .tiers h4 em { font-style:normal; color:#FF385C; }
    .tier { display:flex; justify-content:space-between; align-items:center; background:#fff; color:#222; border-radius:22px; padding:${nine ? "30px 36px" : "22px 30px"}; }
    .tier span { font: 600 ${nine ? 40 : 34}px/1 "Figtree", sans-serif; }
    .tier strong { font: 900 ${nine ? 52 : 44}px/1 "Figtree", sans-serif; letter-spacing:-.02em; }
    .tier.best { background:#FF385C; color:#fff; }
    .note { font: 500 26px/1.3 "Figtree", sans-serif; color:rgba(255,255,255,.7); text-align:center; margin-top:6px; }
    .ctab { position:absolute; inset:0; background: linear-gradient(160deg,#FF385C 0%,#E31C5F 55%,#C4045C 100%); }
    .ctat2 { position:absolute; left:64px; right:64px; font: 900 ${nine ? 118 : 96}px/0.95 "Figtree", sans-serif; letter-spacing:-.045em; color:#fff; }
    .ctas2 { position:absolute; left:64px; right:64px; font: 500 ${nine ? 42 : 36}px/1.3 "Figtree", sans-serif; color:rgba(255,255,255,.92); }
    .btn2 { position:absolute; left:64px; padding:${nine ? "36px 56px" : "28px 46px"}; border-radius:999px; background:#fff; color:#E31C5F; white-space:nowrap;
            font: 900 ${nine ? 42 : 36}px/1 "Figtree", sans-serif; letter-spacing:.02em; box-shadow:0 20px 40px rgba(80,0,30,.35); display:flex; gap:18px; align-items:center; }
    .ripple { position:absolute; width:120px; height:120px; border-radius:50%; border:6px solid #fff; }
    .brand2 { position:absolute; left:64px; display:flex; align-items:center; gap:20px; font: 700 34px/1.2 "Figtree", sans-serif; color:#fff; }
    .brand2 img { width:84px; height:84px; border-radius:20px; background:#fff; object-fit:contain; }
    .brand2 small { display:block; font-weight:500; font-size:28px; opacity:.9; }
  `;
  document.head.appendChild(css);
  const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  // ---------- 1. Accroche (0 → 3,4 s) : images en rafale + mots qui tombent ----------
  scene(0, 3.45, (root) => {
    const imgs = ["a-salon-baie.jpg", "v-salon1.jpg", "a-chambre-1.jpg", "t-salon.jpg", "a-cuisine.jpg", "b-salon1.jpg", "salon-or.jpg"];
    const phs = imgs.map((s) => { const ph = photo(s, root); ph.style.display = "none"; return ph; });
    const dim = el("div", "fx", root); dim.style.background = "rgba(0,0,0,.35)";
    const words = [["MEUBLÉ.", 0.02], ["ÉQUIPÉ.", BEAT * 2], ["DISPO.", BEAT * 4], ["À LOMÉ.", BEAT * 5.6]];
    const ws = words.map(([w, a], i) => { const d = el("div", "slam" + (i === 3 ? " pink" : ""), root, w); d.style.top = Y(0.42); return { d, a }; });
    const fl = el("div", "flash", root);
    return (t) => {
      const i = Math.min(imgs.length - 1, Math.floor(t / BEAT));
      phs.forEach((ph, j) => (ph.style.display = j === i ? "block" : "none"));
      const lt = (t % BEAT) / BEAT;
      cam(phs[i], lt, { s: 1.28, r: i % 2 ? 1.5 : -1.5 }, { s: 1.08, r: 0 }, { ease: E.outExpo });
      fl.style.opacity = (1 - clamp(lt * 5)) * 0.5;
      ws.forEach((w, k) => {
        const nxt = k < ws.length - 1 ? ws[k + 1].a : 9;
        const kk = p(t, w.a, w.a + 0.2, E.outExpo);
        const vis = t >= w.a && t < nxt;
        w.d.style.opacity = vis ? kk : 0;
        w.d.style.transform = `scale(${lerp(1.9, 1, kk)})`;
        w.d.style.filter = `blur(${(1 - kk) * 10}px)`;
      });
      if (t > BEAT * 5.6) { const s = p(t, 3.1, 3.45, E.inExpo); root.style.transform = `scale(${1 + s * 0.4})`; root.style.opacity = 1 - s; } else { root.style.transform = ""; root.style.opacity = 1; }
    };
  });

  // ---------- 2. L'offre (3,35 → 12,3 s) : 4 logements réels, 3 quartiers, dès 40 000 FCFA ----------
  scene(3.35, 12.3, (root) => {
    root.style.background = "#121214";
    const tag = el("div", "tag", root, '<span>4 LOGEMENTS</span><span class="w">3 QUARTIERS</span>'); tag.style.top = (R.safeTop + 10) + "px";
    const g = el("div", "grid4", root); g.style.top = (R.safeTop + (nine ? 150 : 100)) + "px";
    const apts = [["a-salon-baie.jpg", "Agoè 2 Lions", 50000], ["b-salon1.jpg", "Hedzranawoé", 40000], ["v-salon1.jpg", "Villa · Hedzranawoé", 60000], ["t-salon.jpg", "Totsi · 3 chambres", 75000]]
      .map(([img, q, pr]) => { const c = el("div", "apt", g, `<img src="img/${img}"><div class="info"><div class="q">${q}</div><div class="pr"><span>0</span> <small>FCFA / nuit</small></div></div>`); return { c, pr, n: c.querySelector(".pr span"), img: c.querySelector("img") }; });
    const bp = el("div", "bigprice", root, '<div class="a">À PARTIR DE</div><div class="n">40 000</div><div class="u">FCFA / NUIT</div>'); bp.style.top = Y(nine ? 0.36 : 0.32);
    const bn = bp.querySelector(".n");
    const fmt = (x) => Math.round(x).toLocaleString("fr-FR").replace(/[  ]/g, " ");
    return (t) => {
      const tk = p(t, 0.05, 0.4, E.outBack);
      tag.style.transform = `scale(${tk})`; tag.style.opacity = clamp(tk) * (1 - p(t, 3.6, 3.9));
      apts.forEach((a, i) => {
        const st = 0.1 + i * BEAT;
        const k = p(t, st, st + 0.45, E.outExpo);
        const dir = i % 2 ? 1 : -1;
        const out = p(t, 3.6 + i * 0.05, 4.0 + i * 0.05, E.inExpo);
        a.c.style.transform = `translateX(${(1 - k) * dir * 600}px) rotate(${(1 - k) * dir * 8}deg) scale(${1 - out * 0.5})`;
        a.c.style.opacity = clamp(k * 2) * (1 - out);
        a.n.textContent = fmt(a.pr * p(t, st + 0.2, st + 1.0, E.outCubic));
        a.img.style.transform = `scale(${1.15 - p(t, st, st + 3) * 0.1})`;
      });
      const kp = p(t, 3.95, 4.45, E.outBack);
      bp.style.opacity = clamp(kp * 2) * (1 - p(t, 8.3, 8.9));
      bp.style.transform = `scale(${lerp(0.5, 1, kp)})`;
      bn.textContent = fmt(40000 * p(t, 3.95, 4.8, E.outCubic));
    };
  }, 2);

  // ---------- 3. Avantages (12,2 → 24,9 s) : coches sur le tempo + tarifs dégressifs ----------
  scene(12.2, 24.9, (root) => {
    const rows = el("div", "rows", root);
    const set = ["a-salon-baie.jpg", "a-chambre-1.jpg", "a-cuisine.jpg", "v-salon2.jpg", "a-salle-de-bain.jpg", "b-chambre.jpg", "t-cuisine.jpg", "a-balcon.jpg"];
    const rr = [0, 1, 2, 3].map((r) => { const d = el("div", "rowp", rows); [...set, ...set].forEach((s, i) => { el("img", "", d).src = "img/" + set[(i + r * 3) % set.length]; }); return d; });
    el("div", "dark", root);
    const ck = el("div", "checks", root); ck.style.top = Y(nine ? 0.3 : 0.22);
    const items = ["WI-FI", "CLIM", "CUISINE ÉQUIPÉE", "MEUBLÉ"].map((x) => el("div", "chk", ck, `<b>${CHECK}</b><span>${x}</span>`));
    const tr = el("div", "tiers", root); tr.style.top = Y(nine ? 0.25 : 0.12);
    tr.innerHTML = `<h4>Restez plus,<br><em>payez moins.</em></h4>
      <div class="tier"><span>1 nuit</span><strong>75 000 F</strong></div>
      <div class="tier"><span>1 semaine</span><strong>500 000 F</strong></div>
      <div class="tier best"><span>1 mois</span><strong>800 000 F</strong></div>
      <div class="note">Exemple : appartement 3 chambres, Totsi</div>`;
    const tiers = [...tr.children];
    return (t) => {
      rr.forEach((d, i) => (d.style.transform = `translateX(${(i % 2 ? -1 : 1) * (t * 60) - (i % 2 ? 0 : 900)}px)`));
      root.style.opacity = p(t, 0, 0.25);
      items.forEach((it, i) => {
        const a = 0.25 + i * BEAT * 2;
        const k = p(t, a, a + 0.25, E.outExpo);
        const out = p(t, 6.0, 6.4, E.inExpo);
        it.style.opacity = clamp(k * 1.5) * (1 - out);
        it.style.transform = `scale(${lerp(1.6, 1, k)}) translateX(${out * -200}px)`;
        it.querySelector("b").style.transform = `scale(${p(t, a + 0.1, a + 0.4, E.outBack)}) rotate(${(1 - p(t, a + 0.1, a + 0.4, E.outExpo)) * -90}deg)`;
      });
      tiers.forEach((x, i) => {
        const a = 6.5 + i * BEAT;
        const k = p(t, a, a + 0.4, E.outExpo);
        x.style.opacity = k * (1 - p(t, 12.2, 12.7));
        x.style.transform = `translateY(${(1 - k) * 80}px)`;
      });
    };
  }, 3);

  // ---------- 4. Projection (24,8 → 31,1 s) : montage rapide, filés de caméra ----------
  scene(24.8, 31.1, (root) => {
    const list = ["salon-or.jpg", "a-chambre-2.jpg", "v-salon2.jpg", "a-salon-angle.jpg", "a-balcon.jpg", "a-salon-baie.jpg"];
    const phs = list.map((s) => photo(s, root));
    const txt = el("div", "slam", root, "C'EST TOUT."); txt.style.top = Y(0.44); txt.style.fontSize = nine ? "150px" : "128px";
    const seg = BEAT * 2;
    return (t) => {
      const i = Math.min(list.length - 1, Math.floor(t / seg));
      phs.forEach((ph, j) => {
        const lt = t - j * seg;
        const vis = j === i || (j === i + 1 && (t % seg) > seg - 0.14);
        ph.style.display = vis ? "block" : "none";
        if (!vis) return;
        const k = clamp(lt / (j === list.length - 1 ? 6.3 - j * seg : seg));
        cam(ph, k, { s: 1.2, x: 4 }, { s: 1.08, x: -4 });
        const enter = p(lt, -0.14, 0.12, E.inOutCubic);
        ph.style.transform = `translateX(${(1 - enter) * 100}%)`;
        ph.img.style.filter = `blur(${(1 - enter) * 14}px)`;
        ph.style.zIndex = j;
      });
      const k = p(t, 2.35, 2.6, E.outExpo);
      txt.style.opacity = clamp(k * 1.5) * (1 - p(t, 5.6, 6.0)); txt.style.zIndex = 20;
      txt.style.transform = `scale(${lerp(1.8, 1, k)})`;
    };
  }, 4);

  // ---------- 5. Appel à l'action (30,9 → 36,6 s) ----------
  scene(30.9, 36.6, (root) => {
    const bg = el("div", "ctab", root);
    const t1 = el("div", "ctat2", bg); t1.style.top = Y(nine ? 0.21 : 0.12);
    const lines = ["TROUVEZ VOTRE", "PROCHAIN", "APPARTEMENT", "MEUBLÉ."].map((x) => { const m = el("div", "", t1); const s = el("span", "mask", m); const i = el("span", "", s, x); i.style.display = "inline-block"; return i; });
    const s1 = el("div", "ctas2", bg, "Découvrez nos logements et réservez en quelques clics."); s1.style.top = Y(nine ? 0.48 : 0.53);
    const btn = el("div", "btn2", bg, 'DÉCOUVRIR LES APPARTEMENTS <span style="font-size:1.1em">→</span>'); btn.style.top = Y(nine ? 0.57 : 0.66);
    const rip = el("div", "ripple", bg);
    const br = el("div", "brand2", bg, `<img src="img/logo.jpg"><div>LUMO Immobilier<small>WhatsApp +228 70 39 05 05</small></div>`); br.style.top = Y(nine ? 0.68 : 0.81);
    return (t) => {
      const k = p(t, 0, 0.35, E.inOutExpo);
      bg.style.clipPath = `polygon(0 ${100 - k * 140}%, 100% ${140 - k * 140}%, 100% 100%, 0 100%)`;
      lines.forEach((l, i) => { const q = p(t, 0.25 + i * 0.12, 0.7 + i * 0.12, E.outExpo); l.style.transform = `translateY(${(1 - q) * 110}%)`; });
      s1.style.opacity = p(t, 1.0, 1.4); s1.style.transform = `translateY(${(1 - p(t, 1.0, 1.5, E.outExpo)) * 30}px)`;
      const b = p(t, 1.3, 1.75, E.outBack);
      const press = env(t, 3.6, 3.95, 0.12, 0.2);
      btn.style.opacity = clamp(b * 2); btn.style.transform = `scale(${lerp(0.5, 1, b) * (1 - press * 0.06)})`;
      const rk = p(t, 3.62, 4.3, E.outCubic);
      const bb = btn.getBoundingClientRect();
      rip.style.left = bb.left + bb.width * 0.72 - 60 + "px"; rip.style.top = bb.top + bb.height / 2 - 60 + "px";
      rip.style.opacity = t > 3.6 ? (1 - rk) : 0; rip.style.transform = `scale(${0.4 + rk * 1.8})`;
      br.style.opacity = p(t, 1.8, 2.3);
    };
  }, 5);

  R.hideCaps = (t) => t < 3.4 || (t > 12.2 && t < 18.6) || t > 30.9;
  R.captions("dark");
  R.finish({ grain: 0.05, vignette: 0.3 });
})();
