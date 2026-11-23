/* LUMO IMMOBILIER — moteur de motion design déterministe.
   Chaque image est calculée par renderFrame(t) : aucune animation CSS, donc rendu image par image exact.
   Formats : 'v' = 1080×1920 (9:16), 'h' = 1920×1080 (16:9). */
'use strict';

const C = {
  blue: '#3FA9F5', sky: '#8FD3FF', ice: '#EAF6FE', white: '#FFFFFF',
  navy: '#071A33', navy2: '#0D2B52', wa: '#25D366', ink: '#0B2440',
};
const E = {
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: x => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const pr = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const svgEl = (tag, attrs, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
function hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

let FMT = 'v', W = 1080, H = 1920, CFG = {};
const V = (v, h) => (FMT === 'v' ? v : h);

/* ------------------------------------------------------------------ typographie animée */
// spec : {t:'Ligne 1|Ligne 2', at, out, style, x, y, align, accent:['mot',...], w}
const TSTYLE = {
  kicker: () => ({ size: V(30, 26), weight: 600, ls: '.32em', upper: true, color: C.sky, lh: 1.3 }),
  h1: () => ({ size: V(92, 86), weight: 600, ls: '-.015em', color: C.white, lh: 1.08 }),
  hero: () => ({ size: V(118, 112), weight: 700, ls: '-.02em', color: C.white, lh: 1.02 }),
  h2: () => ({ size: V(62, 56), weight: 500, ls: '-.01em', color: C.white, lh: 1.15 }),
  body: () => ({ size: V(40, 34), weight: 400, ls: '0', color: 'rgba(255,255,255,.86)', lh: 1.4 }),
  dark1: () => ({ size: V(88, 80), weight: 600, ls: '-.015em', color: C.ink, lh: 1.08 }),
  dark2: () => ({ size: V(46, 40), weight: 400, ls: '0', color: '#35506E', lh: 1.35 }),
  // variantes pour fonds clairs (motion design)
  kickerD: () => ({ size: V(30, 26), weight: 600, ls: '.32em', upper: true, color: '#1F7FD0', lh: 1.3, light: true }),
  heroD: () => ({ size: V(120, 112), weight: 700, ls: '-.02em', color: C.ink, lh: 1.02, light: true }),
  h1D: () => ({ size: V(92, 84), weight: 600, ls: '-.015em', color: C.ink, lh: 1.08, light: true }),
  h2D: () => ({ size: V(60, 52), weight: 500, ls: '-.01em', color: C.ink, lh: 1.15, light: true }),
  bodyD: () => ({ size: V(40, 34), weight: 400, ls: '0', color: '#4A6582', lh: 1.4, light: true }),
};
function buildText(parent, spec) {
  const st = TSTYLE[spec.style || 'h1']();
  const box = el('div', 'tb' + (st.light ? ' onlight' : ''), parent);
  Object.assign(box.style, {
    left: spec.x + 'px', top: spec.y + 'px', fontSize: st.size + 'px', fontWeight: st.weight,
    letterSpacing: st.ls, color: st.color, lineHeight: st.lh, textAlign: spec.align || 'left',
    textTransform: st.upper ? 'uppercase' : 'none', width: (spec.w || (W - 2 * spec.x)) + 'px',
  });
  if (spec.align === 'center') box.style.left = ((W - (spec.w || (W - 2 * spec.x))) / 2) + 'px';
  if (spec.style === 'kicker') { const bar = el('span', 'kbar', box); bar.style.background = C.blue; spec._bar = bar; }
  const words = []; let wi = 0;
  spec.t.split('|').forEach(line => {
    const ln = el('div', 'ln', box);
    line.split(' ').forEach(w => {
      const mask = el('span', 'wm', ln); const sp = el('span', 'w', mask, w);
      if ((spec.accent || []).some(a => w.replace(/[.,?…!]/g, '') === a)) sp.classList.add('acc');
      words.push({ sp, i: wi++ }); ln.appendChild(document.createTextNode(' '));
    });
  });
  spec._box = box; spec._words = words;
}
function updateText(spec, t) {
  const stag = spec.stagger ?? 0.055, dur = spec.dur ?? 0.9, out = spec.out ?? 1e9;
  const pOut = E.inCubic(pr(t, out, out + 0.45));
  spec._box.style.opacity = 1 - pOut;
  spec._box.style.filter = pOut > 0 ? `blur(${pOut * 14}px)` : 'none';
  spec._box.style.transform = `translateY(${-pOut * 40}px)`;
  for (const w of spec._words) {
    const p = E.outExpo(pr(t, spec.at + w.i * stag, spec.at + w.i * stag + dur));
    w.sp.style.transform = `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 4}deg)`;
    w.sp.style.opacity = p > 0 ? 1 : 0;
  }
  if (spec._bar) spec._bar.style.transform = `scaleX(${E.outExpo(pr(t, spec.at - .1, spec.at + .8))})`;
}

/* ------------------------------------------------------------------ couches photo */
function photoLayer(parent, src, opt = {}) {
  const wrap = el('div', 'ph', parent);
  const img = el('div', 'phi', wrap);
  img.style.backgroundImage = `url("${src}")`;
  img.style.backgroundPosition = opt.pos || '50% 50%';
  img.style.filter = opt.filter || 'saturate(1.06) contrast(1.06)';
  return { wrap, img };
}
// mouvement de caméra : from/to = [scale, x%, y%, rotY°, rotX°]
function camera(layer, p, from, to) {
  const s = lerp(from[0], to[0], p), x = lerp(from[1], to[1], p), y = lerp(from[2], to[2], p);
  const ry = lerp(from[3] || 0, to[3] || 0, p), rx = lerp(from[4] || 0, to[4] || 0, p);
  layer.img.style.transform = `perspective(2400px) rotateY(${ry}deg) rotateX(${rx}deg) translate(${x}%, ${y}%) scale(${s})`;
}

/* ------------------------------------------------------------------ particules (profondeur) */
function buildDust(parent, n = 26, seed = 1) {
  const d = el('div', 'dust', parent); const ps = [];
  for (let i = 0; i < n; i++) {
    const p = el('div', 'mote', d), r = 4 + hash(i + seed) * 16;
    Object.assign(p.style, { width: r + 'px', height: r + 'px', filter: `blur(${r / 5}px)` });
    ps.push({ p, x: hash(i * 3 + seed) * W, y: hash(i * 7 + seed) * H, v: 10 + hash(i * 11 + seed) * 40, ph: hash(i * 5) * 6, a: .15 + hash(i * 13 + seed) * .45 });
  }
  return { d, ps };
}
function updateDust(D, t) {
  for (const q of D.ps) {
    const x = (q.x + Math.sin(t * .4 + q.ph) * 40 + t * q.v * .6) % (W + 40) - 20;
    const y = (q.y - t * q.v + H * 4) % (H + 40) - 20;
    q.p.style.transform = `translate(${x}px, ${y}px)`;
    q.p.style.opacity = q.a * (0.6 + 0.4 * Math.sin(t * 1.3 + q.ph));
  }
}

/* ------------------------------------------------------------------ scènes */
const SCENES = {};

// Photo plein cadre + mouvement de caméra + textes
SCENES.photo = {
  build(s, root) {
    s._ph = photoLayer(root, s.img, s);
    if (s.tint !== false) { const g = el('div', 'grade', root); g.style.background = s.grade || gradeFor(s); }
    if (s.dust) s._dust = buildDust(root, 22, s.start * 10);
    if (s.leak) s._leak = el('div', 'leak', root);
    (s.texts || []).forEach(x => buildText(root, x));
    if (s.tag) { s._tag = el('div', 'chip', root, s.tag); Object.assign(s._tag.style, chipPos(s)); }
  },
  update(s, t) {
    const p = pr(t, s.start - 0.6, s.end + 0.6);
    camera(s._ph, (s.ease || E.inOutSine)(p), s.from || [1.18, 0, 0], s.to || [1.04, 0, 0]);
    if (s._dust) updateDust(s._dust, t);
    if (s._leak) { const q = pr(t, s.start, s.end); s._leak.style.opacity = .55 * Math.sin(Math.PI * q); s._leak.style.transform = `translateX(${lerp(-30, 30, q)}%) rotate(${lerp(-8, 8, q)}deg)`; }
    (s.texts || []).forEach(x => updateText(x, t));
    if (s._tag) { const q = E.outExpo(pr(t, s.tagAt ?? s.start + .4, (s.tagAt ?? s.start + .4) + .8)); s._tag.style.opacity = q * (1 - pr(t, s.end - .3, s.end)); s._tag.style.transform = `translateY(${(1 - q) * 30}px)`; }
  },
};
function gradeFor(s) {
  const dir = s.gradeDir || V('180deg', '90deg');
  return `linear-gradient(${dir}, rgba(7,26,51,.62) 0%, rgba(7,26,51,.18) 38%, rgba(7,26,51,.12) 60%, rgba(7,26,51,.70) 100%)`;
}
function chipPos(s) { return s.tagPos || (FMT === 'v' ? { left: '90px', top: '1180px' } : { left: '120px', top: '820px' }); }

// Plan cadastral stylisé en 3D (vidéo 1)
SCENES.cadastre = {
  build(s, root) {
    root.style.background = `radial-gradient(120% 80% at 50% 40%, ${C.navy2}, ${C.navy})`;
    if (s.img) { s._ph = photoLayer(root, s.img, { filter: 'grayscale(1) contrast(1.2) brightness(.55)' }); s._ph.wrap.style.opacity = .35; s._ph.wrap.style.mixBlendMode = 'luminosity'; }
    const stage = el('div', 'plan3d', root); s._stage = stage;
    const S = V(1500, 1700); stage.style.width = S + 'px'; stage.style.height = S + 'px';
    stage.style.left = (W - S) / 2 + 'px'; stage.style.top = (H - S) / 2 + V(-40, 60) + 'px';
    const svg = svgEl('svg', { viewBox: '0 0 1000 1000', width: S, height: S }, stage); s._svg = svg;
    const defs = svgEl('defs', {}, svg);
    const gl = svgEl('filter', { id: 'glow' + s.id, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: 6, result: 'b' }, gl);
    const m = svgEl('feMerge', {}, gl); svgEl('feMergeNode', { in: 'b' }, m); svgEl('feMergeNode', { in: 'SourceGraphic' }, m);
    // grille de fond
    for (let i = 0; i <= 20; i++) { svgEl('line', { x1: i * 50, y1: 0, x2: i * 50, y2: 1000, stroke: 'rgba(143,211,255,.07)', 'stroke-width': 1 }, svg); svgEl('line', { x1: 0, y1: i * 50, x2: 1000, y2: i * 50, stroke: 'rgba(143,211,255,.07)', 'stroke-width': 1 }, svg); }
    // routes
    s._roads = [];
    [['M0 300 L1000 300', 26], ['M0 690 L1000 650', 22], ['M380 0 L420 1000', 22], ['M760 0 L700 1000', 18]].forEach(([d, w]) => {
      s._roads.push(svgEl('path', { d, stroke: 'rgba(143,211,255,.22)', 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, svg));
    });
    // parcelles (îlots découpés)
    s._parcels = []; let k = 0;
    const blocks = [[30, 30, 330, 250], [440, 30, 300, 250], [790, 30, 190, 250], [30, 330, 330, 330], [440, 330, 240, 300], [730, 330, 250, 300], [30, 710, 350, 270], [450, 690, 230, 290], [740, 690, 240, 290]];
    blocks.forEach(([x, y, w, h], bi) => {
      const cols = w > 260 ? 3 : 2, rows = h > 280 ? 3 : 2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const px = x + c * w / cols, py = y + r * h / rows, pw = w / cols, ph = h / rows;
        const p = svgEl('rect', { x: px + 4, y: py + 4, width: pw - 8, height: ph - 8, fill: 'rgba(63,169,245,0)', stroke: C.sky, 'stroke-width': 2, 'stroke-opacity': .8 }, svg);
        const len = 2 * (pw + ph - 16); p.setAttribute('stroke-dasharray', len); p.setAttribute('stroke-dashoffset', len);
        s._parcels.push({ p, len, d: hash(k++) * .9 + bi * .05, hl: bi === 4 && r === 1 && c === 0, cx: px + pw / 2, cy: py + ph / 2 });
      }
    });
    const H0 = s._parcels.find(q => q.hl);
    s._hl = svgEl('rect', { x: H0.cx - 52, y: H0.cy - 42, width: 104, height: 84, fill: 'rgba(143,211,255,.0)', stroke: '#fff', 'stroke-width': 4, filter: `url(#glow${s.id})` }, svg);
    s._hlc = H0;
    // cotes
    s._dims = svgEl('g', { opacity: 0 }, svg);
    svgEl('path', { d: `M${H0.cx - 52} ${H0.cy + 62} L${H0.cx + 52} ${H0.cy + 62}`, stroke: '#fff', 'stroke-width': 2 }, s._dims);
    svgEl('path', { d: `M${H0.cx + 72} ${H0.cy - 42} L${H0.cx + 72} ${H0.cy + 42}`, stroke: '#fff', 'stroke-width': 2 }, s._dims);
    // repère (pin) hors SVG pour rester net
    s._pin = el('div', 'pin', stage, '<div class="pinc"></div><div class="pinr"></div>');
    s._pin.style.left = (H0.cx / 1000 * S) + 'px'; s._pin.style.top = (H0.cy / 1000 * S) + 'px';
    s._labels = (s.labels || []).map((L, i) => { const d = el('div', 'plabel', root, `<span class="dot"></span>${L.t}`); Object.assign(d.style, L.pos[FMT]); return { d, at: L.at }; });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    const lt = t - s.start, P = pr(t, s.start - .5, s.end + .5);
    const tilt = lerp(V(52, 50), V(40, 38), E.inOutSine(P)), rz = lerp(-18, -6, E.inOutSine(P)), sc = lerp(1.05, 1.2, E.inOutSine(P));
    s._stage.style.transform = `perspective(1800px) rotateX(${tilt}deg) rotateZ(${rz}deg) scale(${sc})`;
    if (s._ph) camera(s._ph, P, [1.25, 0, 0], [1.1, 0, -2]);
    s._roads.forEach((r, i) => r.setAttribute('stroke-opacity', E.outCubic(pr(lt, .1 * i, .8 + .1 * i))));
    for (const q of s._parcels) {
      const p = E.inOutCubic(pr(lt, .2 + q.d, 1.4 + q.d));
      q.p.setAttribute('stroke-dashoffset', q.len * (1 - p));
      q.p.setAttribute('fill', `rgba(63,169,245,${.05 * p})`);
      if (s.hlAt != null && !q.hl) q.p.setAttribute('stroke-opacity', .8 - .45 * pr(t, s.hlAt, s.hlAt + .8));
    }
    const ph = E.outExpo(pr(t, s.hlAt ?? 1e9, (s.hlAt ?? 1e9) + 1.0));
    s._hl.setAttribute('opacity', ph); s._hl.setAttribute('fill', `rgba(143,211,255,${.28 * ph + .08 * Math.sin(t * 4) * ph})`);
    s._dims.setAttribute('opacity', pr(t, (s.hlAt ?? 1e9) + .5, (s.hlAt ?? 1e9) + 1.1));
    const pp = E.outBack(pr(t, (s.hlAt ?? 1e9) + .2, (s.hlAt ?? 1e9) + .9));
    s._pin.style.opacity = pr(t, (s.hlAt ?? 1e9) + .2, (s.hlAt ?? 1e9) + .4);
    s._pin.style.transform = `translate(-50%, -100%) rotateZ(${-rz}deg) rotateX(${-tilt}deg) translateY(${(1 - pp) * -120}px)`;
    const ring = s._pin.querySelector('.pinr'); const rp = ((t - (s.hlAt ?? 0)) % 1.6) / 1.6;
    ring.style.transform = `translate(-50%,-50%) scale(${.4 + rp * 2.4})`; ring.style.opacity = (1 - rp) * .8;
    s._labels.forEach(L => { const q = E.outExpo(pr(t, L.at, L.at + .8)); L.d.style.opacity = q; L.d.style.transform = `translateX(${(1 - q) * -40}px)`; });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Étapes d'accompagnement en cartes verre dépoli sur photo floutée
SCENES.steps = {
  build(s, root) {
    s._ph = photoLayer(root, s.img, { filter: 'blur(14px) saturate(1.1) brightness(.8)' });
    el('div', 'grade', root).style.background = 'linear-gradient(180deg, rgba(7,26,51,.75), rgba(7,26,51,.45) 45%, rgba(7,26,51,.8))';
    (s.texts || []).forEach(x => buildText(root, x));
    s._cards = s.items.map((it, i) => {
      const c = el('div', 'card', root, `<div class="ic">${ICONS[it.icon]}</div><div class="ct"><div class="cn">0${i + 1}</div><div class="cl">${it.t}</div><div class="cs">${it.s || ''}</div></div><div class="ck">${ICONS.check}</div>`);
      const g = s.grid[FMT]; Object.assign(c.style, { left: g.x + 'px', top: (g.y + i * g.dy) + 'px', width: g.w + 'px' });
      return { c, at: it.at, done: it.done };
    });
  },
  update(s, t) {
    camera(s._ph, pr(t, s.start, s.end), [1.2, 0, 0], [1.1, 0, -1]);
    (s.texts || []).forEach(x => updateText(x, t));
    s._cards.forEach(k => {
      const q = E.outExpo(pr(t, k.at, k.at + 1)), d = E.outBack(pr(t, k.done ?? k.at + 1.2, (k.done ?? k.at + 1.2) + .5));
      k.c.style.opacity = q; k.c.style.transform = `perspective(1200px) translateY(${(1 - q) * 80}px) rotateX(${(1 - q) * -25}deg)`;
      const ck = k.c.querySelector('.ck'); ck.style.transform = `scale(${d})`; ck.style.opacity = clamp(d);
      k.c.classList.toggle('on', t > (k.done ?? k.at + 1.2));
    });
  },
};

// Triptyque / mosaïque de photos (vidéo 2)
SCENES.panels = {
  build(s, root) {
    root.style.background = C.navy;
    s._pn = s.items.map((it, i) => {
      const box = el('div', 'panel', root); const g = it.box[FMT]; Object.assign(box.style, { left: g[0] + 'px', top: g[1] + 'px', width: g[2] + 'px', height: g[3] + 'px' });
      const ph = photoLayer(box, it.img, { pos: it.pos });
      const lab = el('div', 'plab', box, `<span>${it.t}</span>`);
      return { box, ph, lab, at: it.at, i };
    });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    s._pn.forEach(k => {
      const q = E.outExpo(pr(t, k.at, k.at + 1.1));
      const dir = FMT === 'v' ? `inset(${(1 - q) * 100}% 0 0 0 round 28px)` : `inset(0 0 ${(1 - q) * 100}% 0 round 28px)`;
      k.box.style.clipPath = dir;
      camera(k.ph, pr(t, k.at - .3, s.end + .5), [1.3, 0, 3], [1.08, 0, -2]);
      const l = E.outExpo(pr(t, k.at + .5, k.at + 1.3)); k.lab.style.opacity = l; k.lab.style.transform = `translateY(${(1 - l) * 24}px)`;
    });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Révélation de marque
SCENES.brand = {
  build(s, root) {
    root.style.background = s.dark ? `radial-gradient(90% 70% at 50% 45%, ${C.navy2}, ${C.navy})` : `radial-gradient(90% 70% at 50% 45%, #FFFFFF, ${C.ice})`;
    if (s.img) { s._ph = photoLayer(root, s.img, { filter: 'blur(18px) brightness(1.05) saturate(.8)' }); s._ph.wrap.style.opacity = s.dark ? .3 : .22; }
    s._rings = [0, 1, 2].map(i => el('div', 'ring', root));
    s._logo = logoBlock(root, s.dark); s._sweep = el('div', 'sweep', s._logo);
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    const lt = t - s.start;
    if (s._ph) camera(s._ph, pr(t, s.start, s.end), [1.2, 0, 0], [1.1, 0, 0]);
    s._rings.forEach((r, i) => { const q = E.outExpo(pr(lt, .1 + i * .18, 1.8 + i * .18)); r.style.transform = `translate(-50%,-50%) scale(${.3 + q * (1 + i * .35)})`; r.style.opacity = (1 - q) * .7; });
    const q = E.outExpo(pr(lt, .15, 1.3));
    s._logo.style.opacity = q; s._logo.style.transform = `translate(-50%,-50%) scale(${lerp(.86, 1, q)})`; s._logo.style.filter = `blur(${(1 - q) * 16}px)`;
    const sw = pr(lt, .9, 1.9); s._sweep.style.transform = `translateX(${lerp(-120, 220, E.inOutCubic(sw))}%) skewX(-20deg)`;
    (s.texts || []).forEach(x => updateText(x, t));
  },
};
function logoBlock(root, dark) {
  const b = el('div', 'logo' + (dark ? ' dark' : ''), root);
  if (CFG.logo) { el('img', 'logoimg', b).src = CFG.logo; }
  else b.innerHTML = '<div class="lw">LUMO</div><div class="lline"></div><div class="ls">IMMOBILIER</div>';
  return b;
}

// Carte du monde en points + arcs vers Lomé (vidéo 3)
SCENES.world = {
  build(s, root) {
    root.style.background = `radial-gradient(100% 80% at 50% 50%, ${C.navy2}, ${C.navy})`;
    const S = s.map[FMT]; const box = el('div', 'world', root); Object.assign(box.style, { left: S.x + 'px', top: S.y + 'px', width: S.w + 'px', height: S.h + 'px' });
    s._box = box; const svg = svgEl('svg', { viewBox: `${S.vb.join(' ')}`, width: S.w, height: S.h, preserveAspectRatio: 'xMidYMid slice' }, box);
    const proj = (lon, lat) => [(lon + 180) * 5, (90 - lat) * 5];
    s._dots = svgEl('g', {}, svg);
    for (const [lo, la, tg] of DOTS) { const [x, y] = proj(lo, la); svgEl('circle', { cx: x, cy: y, r: tg ? 3.4 : 2.6, fill: tg ? C.sky : 'rgba(143,211,255,.30)' }, s._dots); }
    const lome = proj(1.22, 6.13); s._lome = lome;
    s._arcs = (s.cities || []).map((c, i) => {
      const a = proj(c.lon, c.lat), mx = (a[0] + lome[0]) / 2, my = Math.min(a[1], lome[1]) - Math.hypot(a[0] - lome[0], a[1] - lome[1]) * .35;
      const d = `M${a[0]} ${a[1]} Q${mx} ${my} ${lome[0]} ${lome[1]}`;
      const path = svgEl('path', { d, fill: 'none', stroke: C.sky, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
      const len = path.getTotalLength(); path.setAttribute('stroke-dasharray', len); path.setAttribute('stroke-dashoffset', len);
      const dot = svgEl('circle', { cx: a[0], cy: a[1], r: 6, fill: '#fff' }, svg);
      const lab = svgEl('text', { x: a[0] + 12, y: a[1] - 10, fill: 'rgba(255,255,255,.85)', 'font-size': 17, 'font-family': 'Poppins', 'font-weight': 500 }, svg); lab.textContent = c.n;
      const head = svgEl('circle', { r: 5, fill: '#fff' }, svg);
      return { path, len, dot, lab, head, at: s.arcAt + i * .35 };
    });
    s._lpin = svgEl('g', {}, svg);
    s._lring = svgEl('circle', { cx: lome[0], cy: lome[1], r: 10, fill: 'none', stroke: C.sky, 'stroke-width': 2.5 }, s._lpin);
    svgEl('circle', { cx: lome[0], cy: lome[1], r: 8, fill: '#fff' }, s._lpin);
    const tl = svgEl('text', { x: lome[0] + 16, y: lome[1] + 30, fill: '#fff', 'font-size': 24, 'font-family': 'Poppins', 'font-weight': 600, 'letter-spacing': 2 }, s._lpin); tl.textContent = 'LOMÉ';
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    const P = E.inOutSine(pr(t, s.start - .5, s.end + .5)); const z = s.zoom[FMT];
    s._box.style.transform = `perspective(2000px) rotateX(${lerp(18, 8, P)}deg) scale(${lerp(z[0], z[1], P)}) translate(${lerp(z[2], z[3], P)}px, ${lerp(z[4], z[5], P)}px)`;
    s._dots.setAttribute('opacity', E.outCubic(pr(t, s.start - .4, s.start + .8)));
    s._arcs.forEach(a => {
      const q = E.inOutCubic(pr(t, a.at, a.at + 1.4));
      a.path.setAttribute('stroke-dashoffset', a.len * (1 - q));
      const pt = a.path.getPointAtLength(a.len * q); a.head.setAttribute('cx', pt.x); a.head.setAttribute('cy', pt.y); a.head.setAttribute('opacity', q > 0 && q < 1 ? 1 : 0);
      const o = pr(t, a.at - .3, a.at); a.dot.setAttribute('opacity', o); a.lab.setAttribute('opacity', o);
    });
    const lp = ((t - s.start) % 1.5) / 1.5; s._lring.setAttribute('r', 10 + lp * 34); s._lring.setAttribute('opacity', 1 - lp);
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Plan urbain stylisé de Lomé (procédural, illustratif) + repères de types de biens
SCENES.city = {
  build(s, root) {
    root.style.background = C.navy;
    const S = V(1700, 1700); const st = el('div', 'plan3d', root); s._st = st;
    Object.assign(st.style, { width: S + 'px', height: S + 'px', left: (W - S) / 2 + V(0, 360) + 'px', top: (H - S) / 2 + V(80, 120) + 'px' });
    const svg = svgEl('svg', { viewBox: '0 0 1000 1000', width: S, height: S }, st);
    // océan au sud (côte orientée est-ouest, comme à Lomé)
    svgEl('path', { d: 'M0 760 C200 748 420 772 600 758 C760 746 880 762 1000 752 L1000 1000 L0 1000 Z', fill: 'rgba(63,169,245,.16)' }, svg);
    svgEl('path', { d: 'M0 760 C200 748 420 772 600 758 C760 746 880 762 1000 752', fill: 'none', stroke: C.sky, 'stroke-width': 3, 'stroke-opacity': .7 }, svg);
    s._streets = [];
    const add = (d, w, o) => { const p = svgEl('path', { d, stroke: `rgba(143,211,255,${o})`, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, svg); const L = p.getTotalLength(); p.setAttribute('stroke-dasharray', L); p.setAttribute('stroke-dashoffset', L); s._streets.push({ p, L, d: hash(s._streets.length) }); };
    // grandes artères rayonnantes + boulevard côtier + rocades
    add('M0 735 C300 722 700 738 1000 728', 7, .75);
    [[500, 735, 120, 0], [500, 735, 330, 40], [500, 735, 700, 30], [500, 735, 880, 140], [500, 735, 40, 160]].forEach(([x1, y1, x2, y2]) => add(`M${x1} ${y1} L${x2} ${y2}`, 6, .6));
    add('M90 735 C140 420 360 250 560 250 C760 250 900 420 930 735', 5, .5);
    add('M240 735 C260 540 380 430 520 430 C660 430 760 540 770 735', 4, .45);
    for (let i = 0; i < 46; i++) { const x = 40 + hash(i * 3.1) * 920, y = 60 + hash(i * 5.7) * 640, a = hash(i * 2.3) * Math.PI, l = 60 + hash(i) * 140; add(`M${x} ${y} L${x + Math.cos(a) * l} ${y + Math.sin(a) * l}`, 2, .28); }
    s._pins = (s.pins || []).map(P => { const d = el('div', 'cpin', st, `<div class="cpd"></div><div class="cpl">${P.t}</div>`); d.style.left = P.x / 1000 * S + 'px'; d.style.top = P.y / 1000 * S + 'px'; return { d, at: P.at }; });
    const lab = el('div', 'cityname', st, 'LOMÉ'); lab.style.left = 500 / 1000 * S + 'px'; lab.style.top = 560 / 1000 * S + 'px'; s._lab = lab;
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    const P = E.inOutSine(pr(t, s.start - .5, s.end + .5));
    const tilt = lerp(50, 42, P), rz = lerp(10, 0, P);
    s._st.style.transform = `perspective(1800px) rotateX(${tilt}deg) rotateZ(${rz}deg) scale(${lerp(1, 1.14, P)})`;
    s._streets.forEach(q => q.p.setAttribute('stroke-dashoffset', q.L * (1 - E.inOutCubic(pr(t, s.start - .4 + q.d * .8, s.start + .9 + q.d * .9)))));
    s._lab.style.opacity = pr(t, s.start + .4, s.start + 1.2); s._lab.style.transform = `translate(-50%,-50%) rotateZ(${-rz}deg) rotateX(${-tilt}deg)`;
    s._pins.forEach(p => { const q = E.outBack(pr(t, p.at, p.at + .7)); p.d.style.opacity = clamp(q * 2); p.d.style.transform = `translate(-50%,-100%) rotateZ(${-rz}deg) rotateX(${-tilt}deg) scale(${q})`; });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Patrimoine : volumes isométriques qui s'élèvent + 3 piliers
SCENES.pillars = {
  build(s, root) {
    s._ph = photoLayer(root, s.img, {});
    el('div', 'grade', root).style.background = 'linear-gradient(180deg, rgba(7,26,51,.55), rgba(7,26,51,.35) 40%, rgba(7,26,51,.88))';
    s._dust = buildDust(root, 18, 9);
    s._items = s.items.map((it, i) => {
      const g = s.grid[FMT]; const d = el('div', 'pillar', root, `<div class="pi">${ICONS[it.icon]}</div><div class="pt">${it.t}</div>`);
      Object.assign(d.style, { left: (g.x + i * g.dx) + 'px', top: (g.y + i * g.dy) + 'px', width: g.w + 'px' });
      return { d, at: it.at };
    });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    camera(s._ph, E.inOutSine(pr(t, s.start - .5, s.end + .5)), s.from || [1.25, 2, 2, -3], s.to || [1.08, -2, -1, 3]);
    updateDust(s._dust, t);
    s._items.forEach(k => { const q = E.outExpo(pr(t, k.at, k.at + 1)); k.d.style.opacity = q; k.d.style.transform = `translateY(${(1 - q) * 60}px)`; k.d.classList.toggle('on', t > k.at + .3); });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Appel à l'action : maquette du site + boutons
SCENES.cta = {
  build(s, root) {
    root.style.background = s.light ? `radial-gradient(110% 80% at 50% 30%, #FFFFFF, ${C.ice})` : `radial-gradient(110% 80% at 50% 30%, ${C.navy2}, ${C.navy})`;
    if (s.img) { s._ph = photoLayer(root, s.img, { filter: 'blur(22px) saturate(1.1) brightness(.6)' }); s._ph.wrap.style.opacity = .55; }
    if (s.deco && window.buildDeco) s._deco = window.buildDeco(root, s.deco, s);
    s._dust = buildDust(root, 16, 4); if (s.light) s._dust.d.style.opacity = 0;
    const site = el('div', 'site', root); Object.assign(site.style, s.site[FMT]); s._site = site;
    site.innerHTML = `
      <div class="bar"><span class="d"></span><span class="d"></span><span class="d"></span><div class="url">${ICONS.lock}<span>${CFG.site}</span></div></div>
      <div class="hero" style="${s.img ? `background-image:url('${s.img}')` : 'background:linear-gradient(135deg,#0D2B52,#1F6FB8 60%,#5CC0FF)'}">${!s.img && window.heroArt ? window.heroArt() : ''}<div class="hg"></div><div class="hl">${CFG.logo ? `<img src="${CFG.logo}">` : '<b>LUMO</b> IMMOBILIER'}</div></div>
      <div class="body"><div class="lbl">Sur notre site web</div>
        <div class="btn b1">DÉCOUVRIR NOS SERVICES <span class="arr">→</span></div>
        <div class="btn b2">${ICONS.wa}<span>PARLER À UN CONSEILLER SUR WHATSAPP</span></div>
        <div class="note">Le bouton WhatsApp se trouve sur notre site</div></div>`;
    s._b1 = site.querySelector('.b1'); s._b2 = site.querySelector('.b2'); s._note = site.querySelector('.note');
    s._tap = el('div', 'tap', site);
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    if (s._ph) camera(s._ph, pr(t, s.start, s.end), [1.2, 0, 0], [1.1, 0, 0]);
    if (s._deco) window.updateDeco(s._deco, t, s);
    updateDust(s._dust, t);
    const q = E.outExpo(pr(t, s.siteAt, s.siteAt + 1.3));
    s._site.style.opacity = q;
    s._site.style.transform = `perspective(2000px) translateY(${(1 - q) * 160}px) rotateX(${(1 - q) * 28}deg) rotateY(${V(0, -8) * (1 - E.inOutSine(pr(t, s.siteAt, s.end)))}deg)`;
    const b1 = E.outBack(pr(t, s.b1At, s.b1At + .6)), b2 = E.outBack(pr(t, s.b2At, s.b2At + .6));
    s._b1.style.transform = `scale(${b1 * (1 + .03 * Math.sin(Math.max(0, t - s.b1At - .6) * 5) * (t < s.b2At ? 1 : 0))})`; s._b1.style.opacity = clamp(b1 * 2);
    s._b2.style.transform = `scale(${b2 * (1 + .035 * Math.sin(Math.max(0, t - s.b2At - .6) * 4.5))})`; s._b2.style.opacity = clamp(b2 * 2);
    s._note.style.opacity = pr(t, s.b2At + .6, s.b2At + 1.2);
    s._b2.style.boxShadow = `0 0 0 ${(((t - s.b2At) % 1.4) / 1.4) * 26 * (t > s.b2At + .6 ? 1 : 0)}px rgba(37,211,102,${(1 - ((t - s.b2At) % 1.4) / 1.4) * .45 * (t > s.b2At + .6 ? 1 : 0)}), 0 18px 40px rgba(0,0,0,.25)`;
    // indicateur de geste sur le bouton du site
    const tp = pr(t, s.b2At + .9, s.b2At + 1.6); const tg = s._b2.getBoundingClientRect(), sg = s._site.getBoundingClientRect();
    s._tap.style.left = (tg.left - sg.left + tg.width * .78) + 'px'; s._tap.style.top = (tg.top - sg.top + tg.height * .5) + 'px';
    s._tap.style.opacity = tp > 0 && tp < 1 ? Math.sin(Math.PI * tp) : 0; s._tap.style.transform = `translate(-50%,-50%) scale(${.6 + tp * .8})`;
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

// Plan de fin : logo + adresse du site
SCENES.end = {
  build(s, root) {
    root.style.background = `radial-gradient(90% 70% at 50% 45%, #FFFFFF, ${C.ice})`;
    s._logo = logoBlock(root, false); s._sweep = el('div', 'sweep', s._logo);
    s._url = el('div', 'endurl', root, `<span>${CFG.site}</span>`);
    s._wa = el('div', 'endwa', root, `${ICONS.wa}<span>${s.waText || 'Parlez à un conseiller depuis notre site'}</span>`);
    s._legal = el('div', 'legal', root, s.legal ?? "Visuels d'illustration. Ils ne représentent pas des biens commercialisés par LUMO IMMOBILIER.");
  },
  update(s, t) {
    const lt = t - s.start, q = E.outExpo(pr(lt, 0, 1.2));
    s._logo.style.opacity = q; s._logo.style.transform = `translate(-50%,-50%) translateY(${V(-120, -90)}px) scale(${lerp(.9, 1, q)})`;
    s._sweep.style.transform = `translateX(${lerp(-120, 220, E.inOutCubic(pr(lt, .6, 1.6)))}%) skewX(-20deg)`;
    const u = E.outExpo(pr(lt, .5, 1.5)); s._url.style.opacity = u; s._url.style.transform = `translate(-50%, ${(1 - u) * 30}px)`;
    const w = E.outExpo(pr(lt, .9, 1.9)); s._wa.style.opacity = w; s._wa.style.transform = `translate(-50%, ${(1 - w) * 30}px)`;
    s._legal.style.opacity = pr(lt, 1.2, 2);
  },
};

const ICONS = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 2.8h8l4 4V21H6z M14 2.8V7h4 M9 12h6 M9 15.5h6 M9 9h2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12h9 M18 12v3 M15.5 12v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  ear: '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7 M6 9.5V20h12V9.5 M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  build: '<svg viewBox="0 0 24 24"><path d="M3 21h18 M5 21V9l5-3v15 M10 21V4l9 4v13 M13 10h3 M13 13h3 M13 16h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  plane: '<svg viewBox="0 0 24 24"><path d="M2.5 13.5 21 6l-3.5 13-5.2-4.3L9 18v-4.6z M12.3 14.7 21 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  tree: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 15v6 M9 21h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  expand: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  family: '<svg viewBox="0 0 24 24"><circle cx="8" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19c0-3 2-5 4.5-5 M20.5 19c0-3-2-5-4.5-5 M8.5 21c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  wallet: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 9.5h18 M16 14h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18 M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#3FA9F5"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  wa: '<svg class="wai" viewBox="0 0 24 24"><path d="M12 2.6a9.3 9.3 0 0 0-8 14.1L2.8 21.3l4.8-1.2A9.3 9.3 0 1 0 12 2.6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.6 7.6c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.2-.1.4 0 .6.7 1.2 1.6 2.1 2.8 2.8.2.1.4.1.6 0l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.3.3.5 0 .6-.2 1.3-.7 1.7-.6.5-1.4.7-2.2.5-2.9-.8-5.2-3.1-6-6-.2-.8 0-1.5.4-2.1z" fill="currentColor"/></svg>',
};

/* ------------------------------------------------------------------ orchestration */
let SB = null, DOTS = [], GLOBAL = {};
function init(storyboard, fmt, cfg, dots) {
  FMT = fmt; W = fmt === 'v' ? 1080 : 1920; H = fmt === 'v' ? 1920 : 1080; CFG = cfg; DOTS = dots || [];
  document.documentElement.style.setProperty('--W', W + 'px'); document.documentElement.style.setProperty('--H', H + 'px');
  document.body.className = 'f' + fmt;
  const stage = document.getElementById('stage'); stage.innerHTML = '';
  SB = storyboard;
  SB.scenes.forEach((s, i, A) => { const nx = A[i + 1]; s.end = nx ? nx.start + (nx.td ?? 0.8) : SB.duration; });
  SB.scenes.forEach((s, i) => {
    s.id = i; s.root = el('div', 'scene', stage); s.root.style.zIndex = 10 + i; s.root.style.visibility = 'hidden';
    SCENES[s.type].build(s, s.root);
  });
  // habillage global
  GLOBAL.vig = el('div', 'vignette', stage);
  GLOBAL.grain = el('div', 'grain', stage);
  GLOBAL.bug = el('div', 'bug', stage, CFG.logo ? `<img src="${CFG.logo}">` : '<b>LUMO</b><span>IMMOBILIER</span>');
  GLOBAL.illu = el('div', 'illu', stage, "Images d'illustration");
  GLOBAL.cap = el('div', 'cap', stage); GLOBAL.capt = el('span', '', GLOBAL.cap);
  GLOBAL.flash = el('div', 'flash', stage);
}

function transitionStyle(kind, p, entering) {
  // p : 0 -> 1 pendant la transition
  const e = E.inOutCubic(p);
  switch (kind) {
    case 'zoom': return entering ? { opacity: E.outCubic(p), transform: `scale(${lerp(1.35, 1, E.outExpo(p))})`, filter: `blur(${(1 - e) * 22}px)` }
      : { opacity: 1 - E.inCubic(p), transform: `scale(${lerp(1, 1.5, E.inCubic(p))})`, filter: `blur(${e * 22}px)` };
    case 'wipe': return entering ? { clipPath: V(`inset(${(1 - e) * 100}% 0 0 0)`, `inset(0 0 0 ${(1 - e) * 100}%)`), transform: `scale(${lerp(1.08, 1, e)})` }
      : { transform: V(`translateY(${-e * 18}%) scale(${lerp(1, .96, e)})`, `translateX(${-e * 18}%) scale(${lerp(1, .96, e)})`), filter: `brightness(${1 - .5 * e})` };
    case 'slide': return entering ? { transform: V(`translateY(${(1 - E.outExpo(p)) * 100}%)`, `translateX(${(1 - E.outExpo(p)) * 100}%)`) }
      : { transform: V(`translateY(${-E.outExpo(p) * 30}%)`, `translateX(${-E.outExpo(p) * 30}%)`), filter: `brightness(${1 - .6 * p})` };
    case 'flash': return entering ? { opacity: pr(p, .45, .55) } : { opacity: 1 };
    default: return entering ? { opacity: e } : { opacity: 1 };
  }
}

function renderFrame(t) {
  const S = SB.scenes;
  for (let i = 0; i < S.length; i++) {
    const s = S[i], nx = S[i + 1];
    const td = s.td ?? 0.8, ntd = nx ? (nx.td ?? 0.8) : 0;
    const vis = t >= s.start && (!nx || t < nx.start + ntd);
    s.root.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) continue;
    let st = { opacity: 1, transform: 'none', filter: 'none', clipPath: 'none' };
    if (i > 0 && t < s.start + td) Object.assign(st, transitionStyle(s.enter || 'fade', pr(t, s.start, s.start + td), true));
    if (nx && t >= nx.start) Object.assign(st, transitionStyle(nx.enter || 'fade', pr(t, nx.start, nx.start + ntd), false));
    Object.assign(s.root.style, st);
    SCENES[s.type].update(s, t);
  }
  // flash lumineux sur les transitions 'flash'
  let fl = 0; S.forEach(s => { if (s.enter === 'flash') { const d = s.td ?? .8; fl = Math.max(fl, Math.sin(Math.PI * pr(t, s.start, s.start + d))); } });
  GLOBAL.flash.style.opacity = fl * .95;
  // grain animé
  GLOBAL.grain.style.backgroundPosition = `${Math.floor(hash(Math.floor(t * 30)) * 512)}px ${Math.floor(hash(Math.floor(t * 30) + 7) * 512)}px`;
  // logo discret après la révélation de marque, masqué sur les plans de marque
  const b = SB.bug; const bon = b && t > b[0] && t < b[1]; const bq = b ? E.outCubic(pr(t, b[0], b[0] + .6)) * (1 - pr(t, b[1] - .3, b[1])) : 0;
  GLOBAL.bug.style.opacity = bon ? bq : 0;
  let cur_s = S[0]; for (const sc of S) if (t >= sc.start) cur_s = sc;
  GLOBAL.bug.classList.toggle('dk', !(cur_s.dark || ['world', 'city', 'cadastre', 'photo', 'steps', 'pillars'].includes(cur_s.type) || (cur_s.type === 'cta' && !cur_s.light)));
  const ill = SB.illu ? (t > SB.illu[0] && t < SB.illu[1] ? 1 : 0) * pr(t, SB.illu[0], SB.illu[0] + .5) * (1 - pr(t, SB.illu[1] - .4, SB.illu[1])) : 0;
  GLOBAL.illu.style.opacity = ill * .8;
  // sous-titres
  let cur = null;
  for (const p of SB.phrases) if (t >= p.start - .08 && t <= p.end + .25) cur = p;
  const capOn = cur && t < (SB.capEnd ?? 1e9);
  if (capOn) {
    if (GLOBAL.capt.textContent !== cur.text) GLOBAL.capt.textContent = cur.text;
    const a = E.outCubic(pr(t, cur.start - .08, cur.start + .2)) * (1 - pr(t, cur.end + .05, cur.end + .25));
    GLOBAL.cap.style.opacity = a; GLOBAL.cap.style.transform = `translate(-50%, ${(1 - a) * 12}px)`;
    GLOBAL.cap.classList.toggle('light', !!(SB.lightCap || []).find(r => t >= r[0] && t < r[1]));
  } else GLOBAL.cap.style.opacity = 0;
}
window.LUMO = { init, renderFrame };
