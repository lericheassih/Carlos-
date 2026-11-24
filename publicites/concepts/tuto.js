/* Boîte à outils commune aux vidéos pédagogiques (c5, c6), dans l'esthétique du concept 4 :
   fond blanc, rose #FF385C, Figtree, téléphone qui affiche le vrai site LUMO. */
window.TUTO = () => {
  const { E, p, env, el, split, reveal, scene, H, W, clamp, lerp } = R;
  const nine = R.fmt === "9x16";
  const Y = (f) => Math.round(H * f) + "px";
  const SW = nine ? 470 : 330, SH = Math.round(SW * 2532 / 1170), BZ = 16;
  const PX = W - SW - BZ * 2 - (nine ? 58 : 110), PY = nine ? 300 : 250;
  const COLW = PX - (nine ? 80 : 120), COLX = nine ? 56 : 80;
  const css = document.createElement("style");
  css.textContent = `
    .tb { position:absolute; inset:0; background:#fff; color:#222; font-family:"Figtree", sans-serif; }
    .phone { position:absolute; width:${SW + BZ * 2}px; height:${SH + BZ * 2}px; border-radius:${nine ? 76 : 56}px; background:#111; padding:${BZ}px;
             box-shadow: 0 50px 100px rgba(0,0,0,.28), 0 0 0 2px #2a2a2a inset; }
    .screen { position:relative; width:100%; height:100%; border-radius:${nine ? 60 : 42}px; overflow:hidden; background:#fff; }
    .screen > img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .island { position:absolute; top:${BZ + 12}px; left:50%; width:${SW * 0.3}px; height:${nine ? 34 : 26}px; border-radius:20px; background:#000; transform:translateX(-50%); z-index:5; }
    .hl { position:absolute; border:${nine ? 5 : 4}px solid #FF385C; border-radius:${nine ? 18 : 14}px; z-index:40; }
    .hlab { position:absolute; z-index:41; background:#FF385C; color:#fff; border-radius:999px; padding:${nine ? "10px 18px" : "7px 13px"};
            font: 800 ${nine ? 23 : 17}px/1 "Figtree"; white-space:nowrap; box-shadow:0 8px 18px rgba(255,56,92,.35); }
    .step { color:#222; position:absolute; left:${COLX}px; width:${COLW}px; }
    .step .kick { font: 800 ${nine ? 26 : 22}px/1 "Figtree"; letter-spacing:.14em; color:#FF385C; margin-bottom:${nine ? 18 : 12}px; }
    .step .num { font: 900 ${nine ? 220 : 170}px/0.8 "Figtree"; color:#FF385C; letter-spacing:-.06em; }
    .step .lab { font: 800 ${nine ? 58 : 48}px/1.04 "Figtree"; letter-spacing:-.03em; margin-top:18px; }
    .step .sub { font: 500 ${nine ? 32 : 28}px/1.3 "Figtree"; color:#6A6A6A; margin-top:14px; }
    .chip { color:#222; position:absolute; left:${COLX}px; display:flex; align-items:center; gap:14px; background:#fff; border:2px solid #EBEBEB; border-radius:999px;
            padding:${nine ? "16px 24px" : "13px 20px"}; font: 700 ${nine ? 32 : 27}px/1 "Figtree"; box-shadow:0 10px 24px rgba(0,0,0,.08); white-space:nowrap; }
    .chip i { width:14px; height:14px; border-radius:50%; background:#FF385C; display:block; flex:none; }
    .bubble { position:absolute; left:${COLX}px; background:#222; color:#fff; border-radius:28px; padding:${nine ? "26px 32px" : "20px 26px"}; box-shadow:0 20px 40px rgba(0,0,0,.25); }
    .bubble .a { font: 600 ${nine ? 28 : 24}px/1 "Figtree"; opacity:.75; }
    .bubble .b { font: 900 ${nine ? 58 : 48}px/1 "Figtree"; letter-spacing:-.03em; margin-top:10px; }
    .bubble .c { font: 600 ${nine ? 26 : 22}px/1 "Figtree"; color:#FF8FA3; margin-top:10px; }
    .pcard { position:absolute; left:${COLX}px; width:${COLW}px; display:flex; align-items:center; gap:${nine ? 18 : 14}px; background:#fff; border:2px solid #EBEBEB;
             border-radius:${nine ? 24 : 20}px; padding:${nine ? 12 : 10}px; box-shadow:0 12px 26px rgba(0,0,0,.08); color:#222; }
    .pcard img { width:${nine ? 104 : 80}px; height:${nine ? 104 : 80}px; border-radius:${nine ? 16 : 12}px; object-fit:cover; flex:none; }
    .pcard .n { font: 800 ${nine ? 32 : 27}px/1.05 "Figtree"; letter-spacing:-.02em; }
    .pcard .v { font: 600 ${nine ? 27 : 23}px/1 "Figtree"; color:#6A6A6A; margin-top:8px; }
    .pcard .v b { color:#FF385C; font-weight:800; }
    .tap { position:absolute; width:110px; height:110px; border-radius:50%; background:rgba(255,56,92,.25); border:5px solid #FF385C; z-index:60; }
    .ctabg { position:absolute; inset:0; background: radial-gradient(circle at 50% 40%, #FF385C, #E31C5F 55%, #C4045C); }
    .ct4 { position:absolute; left:70px; right:70px; text-align:center; font: 900 ${nine ? 96 : 80}px/0.98 "Figtree"; letter-spacing:-.04em; color:#fff; }
    .cs4 { position:absolute; left:90px; right:90px; text-align:center; font: 500 ${nine ? 42 : 36}px/1.3 "Figtree"; color:rgba(255,255,255,.92); }
    .recap { position:absolute; left:60px; right:60px; display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
    .recap span { background:rgba(255,255,255,.18); color:#fff; border-radius:999px; padding:13px 22px; font: 700 ${nine ? 30 : 26}px/1 "Figtree"; display:inline-block; }
    .btn4 { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; padding:${nine ? "36px 60px" : "28px 48px"}; border-radius:999px; background:#fff; color:#E31C5F;
            font: 900 ${nine ? 40 : 34}px/1 "Figtree"; letter-spacing:.02em; box-shadow:0 20px 40px rgba(80,0,30,.3); }
    .brand4 { position:absolute; left:0; right:0; display:flex; justify-content:center; align-items:center; gap:18px; font: 700 32px/1.2 "Figtree"; color:#fff; }
    .brand4 img { width:78px; height:78px; border-radius:18px; background:#fff; object-fit:contain; }
    .brand4 small { display:block; font-weight:500; font-size:27px; opacity:.9; }
  `;
  document.head.appendChild(css);
  const POS = window.TUTO_POS || {};

  // Fond blanc + vignettes de vraies photos LUMO qui flottent derrière le téléphone
  const background = (D, imgs, a, b) => scene(0, D, (root) => {
    const bg = el("div", "tb", root);
    const fl = imgs.map((s, i) => {
      const f = el("div", "", bg);
      f.style.cssText = `position:absolute;width:${nine ? 260 : 200}px;height:${nine ? 320 : 240}px;border-radius:26px;overflow:hidden;opacity:0;left:${i ? (nine ? 560 : 640) : (nine ? 690 : 760)}px;top:${Y(i ? (nine ? 0.66 : 0.7) : (nine ? 0.05 : 0.04))};box-shadow:0 20px 40px rgba(0,0,0,.15)`;
      const im = el("img", "", f); im.src = "img/" + s; im.style.cssText = "width:100%;height:100%;object-fit:cover";
      return f;
    });
    return (t) => fl.forEach((f, i) => {
      f.style.opacity = env(t, a + i * 0.3, b, 0.8, 0.5);
      f.style.transform = `translateY(${Math.sin(t * 0.6 + i) * 18 - t * (5 + i * 2)}px) rotate(${(i % 2 ? 6 : -6) + Math.sin(t * 0.4 + i) * 2}deg)`;
    });
  }, 1);

  // Boîte d'annotation (coordonnées en fraction de l'écran du téléphone)
  const box = (k) => (typeof k === "string" ? POS[k] : k);

  /* Téléphone. screens : [{src, at, dir:'left'|'up'|'fade'}] ; taps : [{at, k | x,y}] ;
     marks : [{k, a, b, label}] encadré rose + projecteur + étiquette */
  const phone = (a, b, { screens, taps = [], marks = [] }) => scene(a, b, (root) => {
    const ph = el("div", "phone", root); ph.style.left = PX + "px"; ph.style.top = PY + "px";
    el("div", "island", ph);
    const sc = el("div", "screen", ph);
    const imgs = screens.map((s) => { const i = el("img", "", sc); i.src = "ui/" + s.src + ".png"; return i; });
    const mk = marks.map((m) => {
      const r = box(m.k), pad = nine ? 7 : 5;
      const h = Math.min(r.h, 0.975 - r.y);
      const d = el("div", "hl", sc);
      Object.assign(d.style, { left: SW * r.x - pad + "px", top: SH * r.y - pad + "px", width: SW * r.w + pad * 2 + "px", height: SH * h + pad * 2 + "px" });
      let lab = null;
      if (m.label) {
        lab = el("div", "hlab", sc, m.label);
        const below = r.y + h < 0.82;
        lab.style.top = below ? SH * (r.y + h) + pad + (nine ? 14 : 10) + "px" : SH * r.y - pad - (nine ? 58 : 44) + "px";
        lab.style.left = Math.max(10, Math.min(SW * (r.x + r.w / 2), SW - 10)) + "px";
        lab.dataset.below = below ? 1 : 0;
      }
      return { m, d, lab };
    });
    const tap = el("div", "tap", root);
    return (t, T) => {
      const k = p(T, a, a + 1, E.outExpo);
      ph.style.transform = `translateY(${(1 - k) * 900}px) rotate(${(1 - k) * 10}deg)`;
      screens.forEach((s, i) => {
        const img = imgs[i], nx = screens[i + 1], st = i === 0 ? -1e9 : s.at;
        const on = T >= st && (!nx || T < nx.at + 0.45);
        img.style.display = on ? "block" : "none";
        if (!on) return;
        const vin = i === 0 ? 1 : p(T, s.at, s.at + 0.45, E.inOutCubic);
        const vout = nx ? p(T, nx.at, nx.at + 0.45, E.inOutCubic) : 0, od = nx ? nx.dir || "left" : "left";
        const ind = s.dir || "left";
        let tx = 0, ty = 0, op = 1;
        if (ind === "left") tx += (1 - vin) * 100; else if (ind === "up") ty += (1 - vin) * 100; else op = vin;
        if (od === "left") tx -= vout * 30; else if (od === "up") ty -= vout * 25;
        img.style.transform = `translate(${tx}%, ${ty}%)`; img.style.opacity = op;
        img.style.zIndex = i; img.style.filter = `brightness(${1 - (od === "fade" ? 0 : vout * 0.3)})`;
      });
      mk.forEach(({ m, d, lab }) => {
        const v = env(T, m.a, m.b, 0.35, 0.3);
        const on = v > 0.001;
        d.style.display = on ? "block" : "none"; if (lab) lab.style.display = on ? "block" : "none";
        if (!on) return;
        const pop = p(T, m.a, m.a + 0.5, E.outBack), pulse = Math.sin((T - m.a) * 6) * 0.5 + 0.5;
        d.style.opacity = v;
        d.style.transform = `scale(${lerp(1.25, 1, pop)})`;
        d.style.boxShadow = `0 0 0 2400px rgba(17,17,17,${0.42 * v}), 0 0 0 ${6 + pulse * 8}px rgba(255,56,92,${0.28 * v})`;
        if (lab) { const w = lab.offsetWidth, cx = parseFloat(lab.dataset.cx ??= lab.style.left); lab.style.left = Math.max(w / 2 + 8, Math.min(cx, SW - w / 2 - 8)) + "px"; lab.style.opacity = p(T, m.a + 0.15, m.a + 0.45) * v; lab.style.transform = `translate(-50%, ${(1 - p(T, m.a + 0.15, m.a + 0.55, E.outBack)) * (lab.dataset.below === "1" ? -16 : 16)}px)`; }
      });
      const cur = taps.find((x) => T >= x.at - 0.1 && T < x.at + 0.6);
      if (cur) {
        const r = cur.k ? box(cur.k) : null;
        const fx = r ? r.x + r.w / 2 : cur.x, fy = r ? r.y + Math.min(r.h, 0.975 - r.y) / 2 : cur.y;
        const q = p(T, cur.at, cur.at + 0.5, E.outCubic);
        tap.style.display = "block";
        tap.style.left = PX + BZ + SW * fx - 55 + "px"; tap.style.top = PY + BZ + SH * fy - 55 + "px";
        tap.style.opacity = 1 - q; tap.style.transform = `scale(${0.6 + q * 0.9})`;
      } else tap.style.display = "none";
      ph.style.opacity = 1 - p(T, b - 0.6, b, E.inCubic);
    };
  }, 10);

  /* Colonne de gauche. steps : [{a, b, kick, n, lab, sub, extras:[{html, cls, at (local), dy, pop, hot:[a,b]}]}] */
  const steps = (list) => list.forEach((s) => scene(s.a, s.b, (root) => {
    const st = el("div", "step", root, `${s.kick ? `<div class="kick">${s.kick}</div>` : ""}<div class="num">${s.n}</div><div class="lab">${s.lab}</div><div class="sub">${s.sub || ""}</div>`);
    st.style.top = PY + (nine ? 10 : 0) + "px";
    const kids = [...st.children], [kick] = s.kick ? kids : [null], [num, lab, sub] = kids.slice(s.kick ? 1 : 0);
    const base = PY + (s.extraTop ?? (nine ? 650 : 470));
    const ex = (s.extras || []).map((x) => { const d = el("div", x.cls || "chip", root, x.cls ? x.html : `<i${x.dot ? ` style="background:${x.dot}"` : ""}></i>${x.html}`); d.style.top = base + x.dy + "px"; return { ...x, d }; });
    const D = s.b - s.a;
    return (t) => {
      const k = p(t, 0, 0.6, E.outBack), out = p(t, D - 0.4, D, E.inCubic);
      if (kick) { kick.style.opacity = p(t, 0, 0.4) * (1 - out); }
      num.style.transform = `scale(${k * (1 - out * 0.4)})`; num.style.opacity = clamp(k * 2) * (1 - out); num.style.transformOrigin = "left bottom";
      lab.style.opacity = p(t, 0.25, 0.7) * (1 - out); lab.style.transform = `translateY(${(1 - p(t, 0.25, 0.9, E.outExpo)) * 40}px)`;
      sub.style.opacity = p(t, 0.6, 1.1) * (1 - out);
      ex.forEach((x) => {
        const q = p(t, x.at, x.at + 0.45, E.outBack);
        x.d.style.opacity = clamp(q * 2) * (1 - out);
        let sc = x.pop ? q : 0.8 + q * 0.2;
        if (x.hot) { const h = env(t, x.hot[0], x.hot[1], 0.3, 0.3); sc *= 1 + 0.06 * h; x.d.style.borderColor = h > 0.5 ? "#FF385C" : "#EBEBEB"; }
        x.d.style.transform = x.pop ? `scale(${sc})` : `translateX(${(1 - q) * -60}px) scale(${sc})`;
        x.d.style.transformOrigin = "left center";
      });
    };
  }, 12));

  // Appel à l'action : cercle rose qui s'étend depuis le téléphone
  const cta = (a, b, { recap, title, sub, btn }) => scene(a, b, (root) => {
    const bg = el("div", "ctabg", root);
    const rc = el("div", "recap", bg, recap.map((r) => `<span>${r}</span>`).join("")); rc.style.top = Y(nine ? 0.17 : 0.085);
    const t1 = el("div", "ct4", bg); t1.style.top = Y(nine ? 0.29 : 0.25);
    const parts = split(t1, title);
    const s1 = el("div", "cs4", bg, sub); s1.style.top = Y(nine ? 0.485 : 0.53);
    const bt = el("div", "btn4", bg, btn); bt.style.top = Y(nine ? 0.57 : 0.645);
    const br = el("div", "brand4", bg, `<img src="img/logo.jpg"><div>LUMO Immobilier<small>WhatsApp +228 70 39 05 05</small></div>`); br.style.top = Y(nine ? 0.675 : 0.8);
    return (t) => {
      const k = p(t, 0, 0.7, E.inOutCubic);
      bg.style.clipPath = `circle(${k * 140}% at ${((PX + 260) / W) * 100}% ${((PY + 520) / H) * 100}%)`;
      [...rc.children].forEach((c, i) => { const q = p(t, 0.5 + i * 0.1, 0.9 + i * 0.1, E.outBack); c.style.opacity = clamp(q * 2); c.style.transform = `scale(${q})`; });
      reveal(parts, t, 0.8, { style: "up", stagger: 0.06, dur: 0.6, dist: 60 });
      s1.style.opacity = p(t, 1.6, 2.1);
      const q = p(t, 2.0, 2.5, E.outBack);
      const pulse = 1 + Math.sin(Math.max(0, t - 2.7) * 4.5) * 0.025 * p(t, 2.7, 3.1);
      bt.style.opacity = clamp(q * 2); bt.style.transform = `translateX(-50%) scale(${lerp(0.5, 1, q) * pulse})`;
      br.style.opacity = p(t, 2.5, 3.0);
    };
  }, 30);

  return { nine, Y, SW, SH, BZ, PX, PY, COLW, COLX, background, phone, steps, cta };
};
