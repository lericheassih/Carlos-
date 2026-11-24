/* Moteur d'animation image par image (déterministe) pour les publicités LUMO.
   Chaque concept appelle scene(...) ; render(t) recalcule toute l'image pour l'instant t (en secondes). */
(() => {
  const P = new URLSearchParams(location.search);
  const W = 1080, H = +(P.get("h") || 1920);
  const R = (window.R = { W, H, fmt: H > 1500 ? "9x16" : "4x5", scenes: [], always: [], caps: [] });
  document.documentElement.style.setProperty("--W", W + "px");
  document.documentElement.style.setProperty("--H", H + "px");
  // Zones de sécurité Meta : 9:16 → haut 14 %, bas 22 % ; 4:5 → haut/bas 7 %
  R.safeTop = R.fmt === "9x16" ? 270 : 90;
  R.safeBottom = R.fmt === "9x16" ? 420 : 100;

  /* ---------- Courbes d'animation ---------- */
  const E = (R.E = {
    lin: (x) => x,
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    inOutExpo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
  });
  const clamp = (R.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)));
  const lerp = (R.lerp = (a, b, x) => a + (b - a) * x);
  R.p = (t, a, b, ease = E.lin) => ease(clamp((t - a) / (b - a)));
  // enveloppe : monte de a à a+i, reste, redescend sur o avant b
  R.env = (t, a, b, i = 0.4, o = 0.4, ei = E.outCubic, eo = E.inCubic) =>
    t < a || t > b ? 0 : Math.min(ei(clamp((t - a) / i)), 1 - eo(clamp((t - (b - o)) / o)));

  /* ---------- Construction ---------- */
  const stage = document.getElementById("stage");
  R.stage = stage;
  R.el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    (parent || stage).appendChild(e);
    return e;
  };
  // Photo plein cadre avec calque intérieur pour les mouvements de caméra
  R.photo = (src, parent, cls = "") => {
    const box = R.el("div", "ph " + cls, parent);
    const img = R.el("img", "", box);
    img.src = "img/" + src;
    box.img = img;
    return box;
  };
  // Mouvement de caméra : de {s,x,y,r} à {s,x,y,r} (x,y en % de la taille)
  R.cam = (box, k, a, b, { ease = E.inOutSine } = {}) => {
    const s = lerp(a.s ?? 1.1, b.s ?? 1.1, ease(k));
    const x = lerp(a.x ?? 0, b.x ?? 0, ease(k));
    const y = lerp(a.y ?? 0, b.y ?? 0, ease(k));
    const r = lerp(a.r ?? 0, b.r ?? 0, ease(k));
    box.img.style.transform = `translate(${x}%, ${y}%) scale(${s}) rotate(${r}deg)`;
  };
  // Texte découpé en mots / lettres pour les animations typographiques
  R.split = (el, text, mode = "words") => {
    el.innerHTML = "";
    const parts = [];
    const words = text.split(" ");
    words.forEach((w, wi) => {
      const ws = document.createElement("span");
      ws.className = "w";
      if (mode === "chars") {
        [...w].forEach((ch) => { const c = document.createElement("span"); c.className = "c"; c.textContent = ch; ws.appendChild(c); parts.push(c); });
      } else { ws.textContent = w; parts.push(ws); }
      el.appendChild(ws);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return parts;
  };
  // Révélation échelonnée : style "up" (montée), "blur" (net), "mask" (sortie de masque), "pop"
  R.reveal = (parts, t, start, { stagger = 0.06, dur = 0.6, style = "up", out = null, outDur = 0.35, dist = 60 } = {}) => {
    parts.forEach((p, i) => {
      const k = R.p(t, start + i * stagger, start + i * stagger + dur, style === "pop" ? E.outBack : E.outExpo);
      let o = clamp(k * 1.6);
      let tr = "";
      if (style === "up") tr = `translateY(${(1 - k) * dist}px)`;
      if (style === "mask") tr = `translateY(${(1 - k) * 110}%)`;
      if (style === "pop") tr = `scale(${lerp(0.4, 1, k)})`;
      if (style === "blur") { p.style.filter = `blur(${(1 - k) * 18}px)`; tr = `scale(${lerp(1.08, 1, k)})`; }
      if (out !== null) {
        const ko = R.p(t, out + i * stagger * 0.5, out + i * stagger * 0.5 + outDur, E.inCubic);
        o *= 1 - ko;
        tr += ` translateY(${-ko * dist * 0.6}px)`;
      }
      p.style.opacity = o;
      p.style.transform = tr;
    });
  };
  R.show = (el, o) => { el.style.opacity = o; el.style.visibility = o <= 0.001 ? "hidden" : "visible"; };

  /* ---------- Scènes ---------- */
  // scene(début, fin, construire(conteneur) -> mise à jour(tLocal, tGlobal))
  R.scene = (a, b, build, z = 1) => {
    const root = R.el("div", "scene");
    root.style.zIndex = z;
    const update = build(root, a, b);
    R.scenes.push({ a, b, root, update });
  };
  R.every = (update) => R.always.push(update);

  /* ---------- Finitions cinéma ---------- */
  R.finish = ({ grain = 0.06, vignette = 0.45, tint = null, leak = null } = {}) => {
    if (tint) { const t = R.el("div", "fx tint"); t.style.background = tint; t.style.zIndex = 900; }
    const v = R.el("div", "fx vignette"); v.style.opacity = vignette; v.style.zIndex = 901;
    const g = R.el("canvas", "fx grain"); g.width = 540; g.height = Math.round(H / 2); g.style.zIndex = 902; g.style.opacity = grain;
    const gctx = g.getContext("2d");
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    R.every((t) => {
      seed = 1 + Math.floor(t * 30) * 7919;
      const im = gctx.createImageData(g.width, g.height);
      for (let i = 0; i < im.data.length; i += 4) { const n = rnd() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255; }
      gctx.putImageData(im, 0, 0);
    });
  };
  // Halo lumineux qui traverse l'image (mélange "screen")
  R.leak = (parent, t, a, b, { color = "255,190,120", x0 = -30, x1 = 130, y = 40, size = 900, max = 0.55 } = {}) => {
    let l = parent.querySelector(":scope > .leak");
    if (!l) { l = R.el("div", "leak", parent); }
    const k = R.p(t, a, b, E.inOutSine);
    const o = Math.sin(Math.PI * k) * max;
    l.style.opacity = o;
    l.style.background = `radial-gradient(${size}px ${size * 0.7}px at ${lerp(x0, x1, k)}% ${y}%, rgba(${color},0.95), rgba(${color},0) 70%)`;
  };

  /* ---------- Sous-titres de la voix off ---------- */
  R.captions = (style = "dark") => {
    const box = R.el("div", "caps caps-" + style);
    box.style.zIndex = 950;
    box.style.bottom = R.safeBottom + 30 + "px";
    const span = R.el("span", "", box);
    let last = null;
    R.every((t) => {
      const c = R.caps.find((x) => t >= x.start - 0.05 && t <= x.end + 0.35 && !R.hideCaps?.(t));
      if (!c) { box.style.opacity = 0; return; }
      if (last !== c) { span.textContent = c.text; last = c; }
      const k = Math.min(R.p(t, c.start - 0.05, c.start + 0.2, E.outCubic), 1 - R.p(t, c.end + 0.15, c.end + 0.35));
      box.style.opacity = k;
      box.style.transform = `translateX(-50%) translateY(${(1 - k) * 14}px)`;
    });
  };

  /* ---------- Rendu ---------- */
  window.render = (t) => {
    for (const s of R.scenes) {
      const on = t >= s.a && t < s.b;
      s.root.style.display = on ? "block" : "none";
      if (on) s.update(t - s.a, t);
    }
    for (const f of R.always) f(t);
  };
  window.ready = async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    return { dur: R.dur, fmt: R.fmt };
  };
})();
