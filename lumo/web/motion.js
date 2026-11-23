/* LUMO IMMOBILIER — scènes de motion design pur (sans photo) : illustrations vectorielles
   dessinées au trait, parcelle isométrique, villa, conversation avec un conseiller, patrimoine isométrique. */
'use strict';
const INK = '#0B2440', BL = '#3FA9F5', BL2 = '#1F7FD0', SKY = '#8FD3FF', ICE = '#EAF6FE';

/* ------------------------------------------------------------------ décors de fond */
function buildDeco(root, kind, s) {
  const dark = !!s.dark, D = { kind, dark, lines: [], blobs: [], rings: [] };
  const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, root); svg.style.position = 'absolute'; svg.style.inset = '0';
  const col = dark ? 'rgba(143,211,255,.10)' : 'rgba(31,127,208,.09)';
  if (kind === 'grid' || kind === 'blueprint') {
    const step = 90;
    for (let x = step / 2; x < W; x += step) D.lines.push(mkLine(svg, x, 0, x, H, col, 1.2));
    for (let y = step / 2; y < H; y += step) D.lines.push(mkLine(svg, 0, y, W, y, col, 1.2));
  }
  if (kind === 'blueprint' || kind === 'rings') {
    [V(380, 420), V(560, 600), V(760, 820)].forEach((r, i) => {
      const c = svgEl('circle', { cx: V(W * .85, W * .78), cy: V(H * .72, H * .6), r, fill: 'none', stroke: dark ? 'rgba(143,211,255,.16)' : 'rgba(63,169,245,.20)', 'stroke-width': 2, 'stroke-dasharray': i === 1 ? '6 14' : 'none' }, svg);
      const L = 2 * Math.PI * r; if (i !== 1) { c.setAttribute('stroke-dasharray', L); c.setAttribute('stroke-dashoffset', L); }
      D.rings.push({ c, L, i });
    });
  }
  for (let i = 0; i < 3; i++) {
    const b = el('div', 'blob', root);
    const sz = V(900, 1000) * (0.7 + 0.3 * i);
    Object.assign(b.style, { width: sz + 'px', height: sz + 'px', background: `radial-gradient(circle, ${dark ? 'rgba(63,169,245,.22)' : 'rgba(143,211,255,.45)'}, transparent 65%)` });
    D.blobs.push({ b, sz, x: hash(i + 3) * W, y: hash(i + 9) * H, ph: i * 2.1 });
  }
  return D;
}
function mkLine(svg, x1, y1, x2, y2, stroke, w) {
  const l = svgEl('line', { x1, y1, x2, y2, stroke, 'stroke-width': w }, svg); const L = Math.hypot(x2 - x1, y2 - y1);
  l.setAttribute('stroke-dasharray', L); l.setAttribute('stroke-dashoffset', L); return { l, L, d: hash(x1 * 7 + y1 * 3) };
}
function updateDeco(D, t, s) {
  const lt = t - s.start;
  D.lines.forEach(q => q.l.setAttribute('stroke-dashoffset', q.L * (1 - E.inOutCubic(pr(lt, -.3 + q.d * .5, 1.2 + q.d * .6)))));
  D.rings.forEach(r => { r.c.setAttribute('stroke-dashoffset', r.L * (1 - E.inOutCubic(pr(lt, .1 * r.i, 2 + .2 * r.i)))); r.c.style.transformOrigin = 'center'; r.c.setAttribute('transform', `rotate(${t * (r.i % 2 ? -6 : 4)} ${r.c.getAttribute('cx')} ${r.c.getAttribute('cy')})`); });
  D.blobs.forEach(b => { b.b.style.transform = `translate(${b.x - b.sz / 2 + Math.sin(t * .35 + b.ph) * 120}px, ${b.y - b.sz / 2 + Math.cos(t * .3 + b.ph) * 100}px)`; });
}
window.buildDeco = buildDeco; window.updateDeco = updateDeco;

function bgOf(s) {
  return s.dark ? `radial-gradient(110% 80% at 30% 20%, ${C.navy2}, ${C.navy})` : `radial-gradient(120% 90% at 20% 10%, #FFFFFF, ${ICE} 70%, #D8EEFC)`;
}

/* ------------------------------------------------------------------ outils SVG « dessin au trait » */
function stroke(parent, d, o = {}) {
  const p = svgEl('path', { d, fill: 'none', stroke: o.c || INK, 'stroke-width': o.w || 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  const L = p.getTotalLength(); p.setAttribute('stroke-dasharray', L); p.setAttribute('stroke-dashoffset', L);
  return { p, L, a: o.a ?? 0, d: o.d ?? 1 };
}
function fill(parent, d, color, o = {}) { const p = svgEl('path', { d, fill: color, opacity: 0 }, parent); return { p, a: o.a ?? 0, d: o.d ?? .6, op: o.op ?? 1 }; }
const rectP = (x1, y1, x2, y2) => `M${x1} ${y1} L${x2} ${y1} L${x2} ${y2} L${x1} ${y2} Z`;

/* isométrie : unités -> écran */
function isoF(ox, oy, k) { return (x, y, z = 0) => [ox + (x - y) * .866 * k, oy + (x + y) * .5 * k - z * k]; }
const poly = pts => 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z';

/* ------------------------------------------------------------------ illustrations */
const ILLU = {};

// Villa contemporaine en élévation
ILLU.villa = (g, T) => {
  const S = [], F = [], P = [];
  F.push(fill(g, 'M40 300 A300 300 0 0 1 960 300 L960 830 L40 830 Z', 'url(#skyg)', { a: T + 1.6, d: 1.2, op: .9 }));
  S.push(stroke(g, 'M40 830 L960 830', { a: T, d: .8, w: 4 }));
  // volumes
  F.push(fill(g, rectP(180, 600, 760, 830), '#F7FBFF', { a: T + 1.4 }), fill(g, rectP(300, 440, 860, 600), '#FFFFFF', { a: T + 1.5 }), fill(g, rectP(280, 418, 880, 440), INK, { a: T + 1.5 }));
  S.push(stroke(g, rectP(180, 600, 760, 830), { a: T + .2, d: 1.1 }), stroke(g, rectP(300, 440, 860, 600), { a: T + .45, d: 1.1 }), stroke(g, rectP(280, 418, 880, 440), { a: T + .7, d: .8 }));
  // vitrages
  const glass = [[340, 470, 620, 575], [680, 470, 825, 575], [215, 640, 480, 800]];
  glass.forEach((r, i) => { F.push(fill(g, rectP(...r), 'url(#glassg)', { a: T + 1.7 + i * .1 })); S.push(stroke(g, rectP(...r), { a: T + .9 + i * .15, d: .7, w: 2.6 })); });
  [410, 480, 550].forEach((x, i) => S.push(stroke(g, `M${x} 470 L${x} 575`, { a: T + 1.2 + i * .05, d: .4, w: 2.2 })));
  [300, 390].forEach((x, i) => S.push(stroke(g, `M${x} 640 L${x} 800`, { a: T + 1.25 + i * .05, d: .4, w: 2.2 })));
  F.push(fill(g, rectP(540, 660, 615, 830), BL2, { a: T + 1.8 }));
  S.push(stroke(g, rectP(540, 660, 615, 830), { a: T + 1.1, d: .6, w: 2.6 }));
  // bardage bois
  for (let x = 650; x <= 740; x += 15) S.push(stroke(g, `M${x} 612 L${x} 818`, { a: T + 1.3 + (x - 650) / 400, d: .35, w: 1.8, c: '#B98A5E' }));
  // piscine
  F.push(fill(g, 'M120 860 L900 860 L860 930 L160 930 Z', 'url(#poolg)', { a: T + 1.9 }));
  S.push(stroke(g, 'M120 860 L900 860 L860 930 L160 930 Z', { a: T + 1.0, d: .9, w: 2.6, c: BL2 }));
  [0, 1, 2].forEach(i => S.push(stroke(g, `M${260 + i * 200} ${885 + i % 2 * 14} q30 -10 60 0 t60 0`, { a: T + 2.2 + i * .1, d: .5, w: 2.2, c: '#FFFFFF' })));
  // palmier
  S.push(stroke(g, 'M915 830 Q895 700 925 585', { a: T + .9, d: .8, w: 6, c: '#2E5A3A' }));
  ['M925 585 Q870 560 830 600', 'M925 585 Q980 555 1010 600', 'M925 585 Q900 520 860 515', 'M925 585 Q960 520 1000 530', 'M925 585 Q930 540 935 500'].forEach((d, i) =>
    S.push(stroke(g, d, { a: T + 1.5 + i * .08, d: .5, w: 5, c: '#3F7D52' })));
  // soleil
  const sun = svgEl('circle', { cx: 170, cy: 300, r: 62, fill: '#FFD27A', opacity: 0 }, g); P.push({ el: sun, a: T + 2.0, kind: 'sun' });
  // lumières aux fenêtres (moment « vie »)
  const glow = svgEl('g', { opacity: 0 }, g); glass.forEach(r => svgEl('rect', { x: r[0] + 4, y: r[1] + 4, width: r[2] - r[0] - 8, height: r[3] - r[1] - 8, fill: '#FFE6A6', opacity: .55 }, glow));
  P.push({ el: glow, a: T + 3.0, kind: 'fade' });
  return { S, F, P };
};

// Parcelle isométrique (+ maison optionnelle)
ILLU.plot = (g, T, opt = {}) => {
  const S = [], F = [], P = [], iso = isoF(500, 360, 46);
  // parcelles voisines (pointillés)
  [[-11, 0, -1, 7], [11, 0, 21, 7], [0, 8, 10, 15], [-11, 8, -1, 15], [11, 8, 21, 15]].forEach(([x1, y1, x2, y2], i) => {
    const d = poly([iso(x1, y1), iso(x2, y1), iso(x2, y2), iso(x1, y2)]);
    const s = stroke(g, d, { a: T + .1 * i, d: 1, w: 2, c: 'rgba(31,127,208,.35)' }); S.push(s);
  });
  // route
  F.push(fill(g, poly([iso(-12, -3.2), iso(22, -3.2), iso(22, -1), iso(-12, -1)]), '#D5E7F5', { a: T + .3 }));
  S.push(stroke(g, poly([iso(-12, -3.2), iso(22, -3.2)]).replace(' Z', ''), { a: T, d: 1, w: 2.4, c: '#7FA6C8' }));
  S.push(stroke(g, `M${iso(-12, -2.1).join(' ')} L${iso(22, -2.1).join(' ')}`, { a: T + .2, d: 1, w: 2, c: '#FFFFFF' }));
  // LA parcelle
  const pc = [iso(0, 0), iso(10, 0), iso(10, 7), iso(0, 7)];
  F.push(fill(g, poly(pc), 'url(#plotg)', { a: T + 1.1, d: .8 }));
  S.push(stroke(g, poly(pc), { a: T + .5, d: 1.2, w: 4.5, c: BL2 }));
  // bornes
  pc.forEach((p, i) => {
    const b = svgEl('g', { opacity: 0 }, g);
    svgEl('ellipse', { cx: p[0], cy: p[1], rx: 11, ry: 6, fill: INK }, b); svgEl('rect', { x: p[0] - 7, y: p[1] - 30, width: 14, height: 30, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.5 }, b);
    svgEl('rect', { x: p[0] - 7, y: p[1] - 30, width: 14, height: 9, fill: '#E5484D' }, b);
    P.push({ el: b, a: T + 1.5 + i * .18, kind: 'pop', x: p[0], y: p[1] });
  });
  // cotes
  const off = (a, b, dx, dy) => `M${a[0] + dx} ${a[1] + dy} L${b[0] + dx} ${b[1] + dy}`;
  S.push(stroke(g, off(iso(0, 7), iso(10, 7), -14, 26), { a: T + 2.1, d: .6, w: 2, c: BL2 }));
  S.push(stroke(g, off(iso(10, 0), iso(10, 7), 26, 14), { a: T + 2.25, d: .6, w: 2, c: BL2 }));
  // arbres voisins
  [[-6, 4], [15, 3], [5, 12], [17, 11], [-5, 11]].forEach(([x, y], i) => {
    const p = iso(x, y); const tr = svgEl('g', { opacity: 0 }, g);
    svgEl('ellipse', { cx: p[0], cy: p[1] + 4, rx: 26, ry: 10, fill: 'rgba(11,36,64,.10)' }, tr);
    svgEl('circle', { cx: p[0], cy: p[1] - 26, r: 28, fill: '#8CCB9B' }, tr); svgEl('circle', { cx: p[0] + 10, cy: p[1] - 34, r: 16, fill: '#A9DBB4' }, tr);
    P.push({ el: tr, a: T + .8 + i * .12, kind: 'pop', x: p[0], y: p[1] });
  });
  if (opt.house) {
    const hT = opt.houseAt ?? T + .3, h = 3.2, x1 = 2.5, x2 = 7.5, y1 = 1.8, y2 = 5.2, rid = 1.6;
    const grp = svgEl('g', {}, g); P.push({ el: grp, a: hT, kind: 'grow', base: iso(x2, y2)[1], dur: 1.4 });
    const L = [iso(x1, y2), iso(x2, y2), iso(x2, y2, h), iso(x1, y2, h)], Rr = [iso(x2, y1), iso(x2, y2), iso(x2, y2, h), iso(x2, y1, h)];
    const roofL = [iso(x1, y2, h), iso(x2, y2, h), iso(x2, (y1 + y2) / 2, h + rid), iso(x1, (y1 + y2) / 2, h + rid)];
    const roofR = [iso(x1, y1, h), iso(x2, y1, h), iso(x2, (y1 + y2) / 2, h + rid), iso(x1, (y1 + y2) / 2, h + rid)];
    const gable = [iso(x2, y1, h), iso(x2, y2, h), iso(x2, (y1 + y2) / 2, h + rid)];
    svgEl('path', { d: poly(roofR), fill: '#2E8FE0', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, grp);
    svgEl('path', { d: poly(L), fill: '#FFFFFF', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, grp);
    svgEl('path', { d: poly(Rr), fill: '#E3F1FC', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, grp);
    svgEl('path', { d: poly(gable), fill: '#E3F1FC', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, grp);
    svgEl('path', { d: poly(roofL), fill: '#5CC0FF', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, grp);
    // fenêtres et porte
    [[3.2, 4.4], [5.6, 6.8]].forEach(([a, b]) => svgEl('path', { d: poly([iso(a, y2, 1.4), iso(b, y2, 1.4), iso(b, y2, 2.6), iso(a, y2, 2.6)]), fill: '#BFE5FF', stroke: INK, 'stroke-width': 2.4 }, grp));
    svgEl('path', { d: poly([iso(x2, 3, 0), iso(x2, 4, 0), iso(x2, 4, 2.2), iso(x2, 3, 2.2)]), fill: BL2, stroke: INK, 'stroke-width': 2.4 }, grp);
  }
  return { S, F, P };
};

function defsFor(svg) {
  const d = svgEl('defs', {}, svg);
  const lg = (id, stops, x2 = 0, y2 = 1) => { const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, d); stops.forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, g)); };
  lg('skyg', [[0, '#DFF2FF'], [1, '#FFFFFF']]); lg('glassg', [[0, '#9FD6FA'], [1, '#E6F5FF']], 1, 1);
  lg('poolg', [[0, '#5CC0FF'], [1, '#2E8FE0']]); lg('plotg', [[0, 'rgba(143,211,255,.55)'], [1, 'rgba(63,169,245,.30)']], 1, 1);
  const sh = svgEl('filter', { id: 'soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, d); svgEl('feDropShadow', { dx: 0, dy: 10, stdDeviation: 14, 'flood-color': '#0B2440', 'flood-opacity': .12 }, sh);
}

/* Scène : titre typographique sur fond graphique */
SCENES.title = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'grid', s);
    s._icons = (s.icons || []).map(ic => { const d = el('div', 'qic' + (s.dark ? ' dark' : ''), root, `${ICONS[ic.icon]}`); Object.assign(d.style, ic.pos[FMT]); return { d, at: ic.at }; });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    s._icons.forEach(k => { const q = E.outBack(pr(t, k.at, k.at + .6)); k.d.style.opacity = clamp(q * 2); k.d.style.transform = `scale(${q}) rotate(${(1 - q) * -20}deg)`; });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

/* Scène : illustration qui se dessine */
SCENES.draw = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'grid', s);
    const box = el('div', 'illu-box', root); const b = s.box[FMT]; Object.assign(box.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[2] + 'px' });
    s._box = box; const svg = svgEl('svg', { viewBox: '0 0 1000 1000', width: b[2], height: b[2] }, box); defsFor(svg);
    s._art = ILLU[s.art](svgEl('g', {}, svg), s.start + (s.artAt ?? .2), s.opt || {});
    s._labels = (s.labels || []).map(L => { const d = el('div', 'tagL', root, `<span class="dot"></span>${L.t}`); Object.assign(d.style, L.pos[FMT]); return { d, at: L.at }; });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    const P = E.inOutSine(pr(t, s.start - .3, s.end + .3));
    s._box.style.transform = `perspective(2000px) rotateY(${lerp(-6, 6, P)}deg) scale(${lerp(.96, 1.04, P)})`;
    for (const q of s._art.S) q.p.setAttribute('stroke-dashoffset', q.L * (1 - E.inOutCubic(pr(t, q.a, q.a + q.d))));
    for (const q of s._art.F) q.p.setAttribute('opacity', q.op * E.outCubic(pr(t, q.a, q.a + q.d)));
    for (const q of s._art.P) {
      if (q.kind === 'pop') { const k = E.outBack(pr(t, q.a, q.a + .55)); q.el.setAttribute('opacity', clamp(k * 2)); q.el.setAttribute('transform', `translate(${q.x} ${q.y}) scale(${Math.max(0, k)}) translate(${-q.x} ${-q.y})`); }
      else if (q.kind === 'sun') { const k = E.outCubic(pr(t, q.a, q.a + 1)); q.el.setAttribute('opacity', k); q.el.setAttribute('transform', `translate(0 ${(1 - k) * 80})`); }
      else if (q.kind === 'grow') { const k = E.outExpo(pr(t, q.a, q.a + q.dur)); q.el.setAttribute('opacity', pr(t, q.a, q.a + .2)); q.el.setAttribute('transform', `translate(0 ${q.base}) scale(1 ${Math.max(.001, k)}) translate(0 ${-q.base})`); }
      else q.el.setAttribute('opacity', E.outCubic(pr(t, q.a, q.a + .8)));
    }
    s._labels.forEach(L => { const q = E.outExpo(pr(t, L.at, L.at + .8)); L.d.style.opacity = q; L.d.style.transform = `translateY(${(1 - q) * 30}px)`; });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

/* Scène : cartes claires (étapes d'accompagnement) */
SCENES.cards = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'blueprint', s);
    (s.texts || []).forEach(x => buildText(root, x));
    s._cards = s.items.map((it, i) => {
      const c = el('div', 'card lightc', root, `<div class="ic">${ICONS[it.icon]}</div><div class="ct"><div class="cn">ÉTAPE 0${i + 1}</div><div class="cl">${it.t}</div><div class="cs">${it.s || ''}</div></div><div class="ck">${ICONS.check}</div>`);
      const g = s.grid[FMT]; Object.assign(c.style, { left: (g.x + i * (g.dx || 0)) + 'px', top: (g.y + i * (g.dy || 0)) + 'px', width: g.w + 'px' });
      return { c, at: it.at };
    });
    if (s.line) { s._ln = el('div', 'vline', root); const g = s.grid[FMT]; Object.assign(s._ln.style, { left: (g.x + 78) + 'px', top: (g.y + 60) + 'px', height: (g.dy * (s.items.length - 1)) + 'px' }); }
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    (s.texts || []).forEach(x => updateText(x, t));
    s._cards.forEach(k => {
      const q = E.outExpo(pr(t, k.at, k.at + 1)), d = E.outBack(pr(t, k.at + .9, k.at + 1.4));
      k.c.style.opacity = q; k.c.style.transform = `perspective(1200px) translateX(${(1 - q) * V(-60, 80)}px) rotateY(${(1 - q) * 18}deg)`;
      const ck = k.c.querySelector('.ck'); ck.style.transform = `scale(${d})`; ck.style.opacity = clamp(d);
      k.c.classList.toggle('on', t > k.at + .9);
    });
    if (s._ln) s._ln.style.transform = `scaleY(${E.inOutCubic(pr(t, s.items[0].at + .5, s.items[s.items.length - 1].at + .6))})`;
  },
};

/* Scène : pastilles (critères / questions) */
SCENES.chips = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'grid', s);
    (s.texts || []).forEach(x => buildText(root, x));
    const wrap = el('div', 'chipwrap', root); Object.assign(wrap.style, s.wrap[FMT]);
    s._chips = s.items.map(it => { const c = el('div', 'chipL' + (s.dark ? ' dark' : ''), wrap, `<span class="ci">${ICONS[it.icon]}</span>${it.t}`); return { c, at: it.at }; });
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    (s.texts || []).forEach(x => updateText(x, t));
    s._chips.forEach((k, i) => { const q = E.outBack(pr(t, k.at, k.at + .6)); k.c.style.opacity = clamp(q * 2); k.c.style.transform = `translateY(${(1 - q) * 40}px) scale(${.7 + .3 * q})`; k.c.style.marginTop = Math.sin(t * 1.4 + i) * 6 + 'px'; });
  },
};

/* Scène : conversation avec un conseiller (téléphone) */
SCENES.chat = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'blueprint', s);
    (s.texts || []).forEach(x => buildText(root, x));
    const ph = el('div', 'phone', root); Object.assign(ph.style, s.phone[FMT]); s._ph = ph;
    ph.innerHTML = `<div class="scr"><div class="hdr"><div class="av">L</div><div><div class="nm">Conseiller LUMO</div><div class="st">en ligne</div></div></div><div class="msgs"></div></div>`;
    const msgs = ph.querySelector('.msgs');
    s._msgs = s.msgs.map(m => {
      const typing = m.me ? null : el('div', 'bub in typing', msgs, '<i></i><i></i><i></i>');
      const b = el('div', 'bub ' + (m.me ? 'out' : 'in'), msgs, `${m.t}<span class="tm">${m.tm || ''}</span>`);
      return { b, typing, at: m.at, me: m.me };
    });
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    (s.texts || []).forEach(x => updateText(x, t));
    const q = E.outExpo(pr(t, s.phoneAt, s.phoneAt + 1.2));
    s._ph.style.opacity = q; s._ph.style.transform = `perspective(2000px) translateY(${(1 - q) * 200}px) rotateX(${(1 - q) * 25}deg) rotateY(${V(0, -10) * (1 - E.inOutSine(pr(t, s.phoneAt, s.end)))}deg)`;
    s._msgs.forEach(m => {
      if (m.typing) { const on = t > m.at - 1.1 && t < m.at; m.typing.style.display = on ? 'inline-flex' : 'none'; m.typing.querySelectorAll('i').forEach((d, i) => { d.style.transform = `translateY(${Math.sin(t * 9 - i) * 4}px)`; }); }
      const k = E.outBack(pr(t, m.at, m.at + .5)); m.b.style.display = t >= m.at ? 'block' : 'none';
      m.b.style.transform = `scale(${k})`; m.b.style.transformOrigin = m.me ? '100% 100%' : '0 100%';
    });
  },
};

/* Scène : patrimoine isométrique (volumes qui s'élèvent) */
SCENES.iso = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'grid', s);
    const b = s.box[FMT]; const box = el('div', 'illu-box', root); Object.assign(box.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[2] + 'px' }); s._box = box;
    const svg = svgEl('svg', { viewBox: '0 0 1000 1000', width: b[2], height: b[2] }, box); defsFor(svg);
    const iso = isoF(500, 300, 40);
    const ground = [iso(-1, -1), iso(13, -1), iso(13, 13), iso(-1, 13)];
    s._ground = svgEl('path', { d: poly(ground), fill: '#FFFFFF', stroke: 'rgba(31,127,208,.35)', 'stroke-width': 2, opacity: 0, filter: 'url(#soft)' }, svg);
    s._b = [];
    const lots = [[1, 1, 3, 3, 5], [5, 1, 7.5, 3, 8], [9, 1, 11, 3.2, 4], [1, 5, 3, 7.5, 6], [5, 5, 7.5, 7.5, 10], [9, 5.5, 11, 7.5, 7], [1, 9.5, 3, 11, 3], [5, 9.5, 7.5, 11, 4.5], [9, 9.5, 11, 11, 5.5]];
    // ordre d'affichage : de l'arrière vers l'avant
    lots.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([x1, y1, x2, y2, h], i) => {
      const g = svgEl('g', {}, svg);
      const fL = svgEl('path', { fill: '#8FD3FF', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      const fR = svgEl('path', { fill: '#3FA9F5', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      const fT = svgEl('path', { fill: '#EAF6FE', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      const win = svgEl('g', {}, g);
      s._b.push({ x1, y1, x2, y2, h, fL, fR, fT, win, at: s.start + .5 + hash(i * 3.3) * 1.6, iso });
    });
    s._labels = (s.labels || []).map(L => { const d = el('div', 'tagL', root, `<span class="dot"></span>${L.t}`); Object.assign(d.style, L.pos[FMT]); return { d, at: L.at }; });
    (s.texts || []).forEach(x => buildText(root, x));
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    s._ground.setAttribute('opacity', E.outCubic(pr(t, s.start, s.start + .8)));
    const P = E.inOutSine(pr(t, s.start - .3, s.end + .3)); s._box.style.transform = `scale(${lerp(.95, 1.05, P)}) translateY(${lerp(20, -20, P)}px)`;
    for (const b of s._b) {
      const z = b.h * E.outExpo(pr(t, b.at, b.at + 1.6)), iso = b.iso, vis = z > .02;
      [b.fL, b.fR, b.fT].forEach(f => f.setAttribute('opacity', vis ? 1 : 0));
      if (!vis) continue;
      b.fL.setAttribute('d', poly([iso(b.x1, b.y2), iso(b.x2, b.y2), iso(b.x2, b.y2, z), iso(b.x1, b.y2, z)]));
      b.fR.setAttribute('d', poly([iso(b.x2, b.y1), iso(b.x2, b.y2), iso(b.x2, b.y2, z), iso(b.x2, b.y1, z)]));
      b.fT.setAttribute('d', poly([iso(b.x1, b.y1, z), iso(b.x2, b.y1, z), iso(b.x2, b.y2, z), iso(b.x1, b.y2, z)]));
    }
    s._labels.forEach(L => { const q = E.outExpo(pr(t, L.at, L.at + .8)); L.d.style.opacity = q; L.d.style.transform = `translateY(${(1 - q) * 30}px)`; });
    (s.texts || []).forEach(x => updateText(x, t));
  },
};

/* petite illustration pour l'en-tête de la maquette du site */
window.heroArt = () => `<svg viewBox="0 0 1000 330" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">
  <g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linejoin="round">
  <path d="M80 300 L920 300"/><path d="M300 300 V200 H620 V300"/><path d="M380 200 V140 H720 V200"/><path d="M360 132 H740"/>
  <path d="M410 155 H560 V190 H410 Z"/><path d="M600 155 H690 V190 H600 Z"/><path d="M330 220 H470 V290 H330 Z"/><path d="M520 230 H560 V300"/>
  <path d="M780 300 Q770 240 790 190"/><path d="M790 190 Q750 175 730 200 M790 190 Q830 170 850 200 M790 190 Q800 160 810 150"/></g></svg>`;
