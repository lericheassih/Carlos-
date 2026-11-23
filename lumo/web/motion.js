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
      else if (q.kind === 'drop') { const k = E.outBack(pr(t, q.a, q.a + .6)); q.el.setAttribute('opacity', clamp(pr(t, q.a, q.a + .25))); q.el.setAttribute('transform', `translate(0 ${(1 - k) * -90})`); }
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
      const c = el('div', 'card lightc', root, `<div class="ic">${ICONS[it.icon]}</div><div class="ct"><div class="cn">${s.numLabel || 'ÉTAPE'} 0${i + 1}</div><div class="cl">${it.t}</div><div class="cs">${it.s || ''}</div></div><div class="ck">${ICONS.check}</div>`);
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

/* =================================================================== APPARTEMENTS MEUBLÉS */
// prisme isométrique (3 faces visibles) dans un groupe
function isoBox(g, iso, x1, y1, x2, y2, z1, z2, col) {
  const [top, left, right] = col;
  svgEl('path', { d: poly([iso(x1, y2, z1), iso(x2, y2, z1), iso(x2, y2, z2), iso(x1, y2, z2)]), fill: left, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
  svgEl('path', { d: poly([iso(x2, y1, z1), iso(x2, y2, z1), iso(x2, y2, z2), iso(x2, y1, z2)]), fill: right, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
  svgEl('path', { d: poly([iso(x1, y1, z2), iso(x2, y1, z2), iso(x2, y2, z2), iso(x1, y2, z2)]), fill: top, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
}
const WOOD = ['#E9D3B8', '#D3B28C', '#BF9A70'], WHITE = ['#FFFFFF', '#EEF4F9', '#DCE7F0'], BLUE = ['#8FD3FF', '#3FA9F5', '#1F7FD0'], NAVYC = ['#2E5C8F', '#1D4470', '#123459'];

// Appartement meublé en coupe isométrique : murs dessinés, puis meubles qui se posent un à un
ILLU.room = (g, T) => {
  const S = [], F = [], P = [], iso = isoF(500, 250, 44);
  // sol + murs
  F.push(fill(g, poly([iso(0, 0), iso(10, 0), iso(10, 10), iso(0, 10)]), '#F5EFE7', { a: T + .5, d: .7 }));
  F.push(fill(g, poly([iso(0, 0, 0), iso(10, 0, 0), iso(10, 0, 7), iso(0, 0, 7)]), '#FFFFFF', { a: T + .6, d: .7 }));
  F.push(fill(g, poly([iso(0, 0, 0), iso(0, 10, 0), iso(0, 10, 7), iso(0, 0, 7)]), '#EAF3FB', { a: T + .6, d: .7 }));
  S.push(stroke(g, poly([iso(0, 10, 0), iso(0, 0, 0), iso(10, 0, 0)]).replace(' Z', ''), { a: T, d: .8, w: 3.5 }));
  S.push(stroke(g, `M${iso(0, 10, 7).join(' ')} L${iso(0, 0, 7).join(' ')} L${iso(10, 0, 7).join(' ')}`, { a: T + .2, d: .8, w: 3.5 }));
  S.push(stroke(g, `M${iso(0, 0, 0).join(' ')} L${iso(0, 0, 7).join(' ')} M${iso(10, 0, 0).join(' ')} L${iso(10, 0, 7).join(' ')} M${iso(0, 10, 0).join(' ')} L${iso(0, 10, 7).join(' ')}`, { a: T + .3, d: .7, w: 3.5 }));
  S.push(stroke(g, `M${iso(10, 0, 0).join(' ')} L${iso(10, 10, 0).join(' ')} L${iso(0, 10, 0).join(' ')}`, { a: T + .4, d: .8, w: 2.5, c: 'rgba(11,36,64,.35)' }));
  // fenêtre (mur du fond) + cadre (mur gauche)
  F.push(fill(g, poly([iso(5.2, 0, 2.8), iso(8.8, 0, 2.8), iso(8.8, 0, 5.8), iso(5.2, 0, 5.8)]), 'url(#glassg)', { a: T + .9 }));
  S.push(stroke(g, poly([iso(5.2, 0, 2.8), iso(8.8, 0, 2.8), iso(8.8, 0, 5.8), iso(5.2, 0, 5.8)]), { a: T + .7, d: .6, w: 2.6 }));
  S.push(stroke(g, `M${iso(7, 0, 2.8).join(' ')} L${iso(7, 0, 5.8).join(' ')}`, { a: T + .9, d: .3, w: 2 }));
  F.push(fill(g, poly([iso(0, 2.2, 3.4), iso(0, 4.6, 3.4), iso(0, 4.6, 5.2), iso(0, 2.2, 5.2)]), BL, { a: T + 1.0 }));
  S.push(stroke(g, poly([iso(0, 2.2, 3.4), iso(0, 4.6, 3.4), iso(0, 4.6, 5.2), iso(0, 2.2, 5.2)]), { a: T + .8, d: .5, w: 2.4 }));
  const piece = (at, fn) => { const grp = svgEl('g', { opacity: 0 }, g); fn(grp); P.push({ el: grp, a: at, kind: 'drop' }); };
  // tapis
  piece(T + 1.3, gg => svgEl('path', { d: poly([iso(3.2, 4, 0), iso(8, 4, 0), iso(8, 8.6, 0), iso(3.2, 8.6, 0)]), fill: '#DCEFFC', stroke: '#8FD3FF', 'stroke-width': 2 }, gg));
  // lit contre le mur du fond (tête de lit + matelas + oreillers + plaid)
  piece(T + 1.6, gg => {
    isoBox(gg, iso, 6, 0.2, 9.8, 0.6, 0, 2.6, NAVYC);
    isoBox(gg, iso, 6, 0.6, 9.8, 4.2, 0, 1.0, WHITE);
    isoBox(gg, iso, 6.4, 0.8, 7.8, 1.6, 1.0, 1.35, WHITE); isoBox(gg, iso, 8.1, 0.8, 9.5, 1.6, 1.0, 1.35, WHITE);
    isoBox(gg, iso, 6, 2.8, 9.8, 4.2, 1.0, 1.08, BLUE);
  });
  // canapé contre le mur gauche
  piece(T + 2.0, gg => { isoBox(gg, iso, 0.2, 3.6, 0.9, 8.6, 0, 2.3, BLUE); isoBox(gg, iso, 0.9, 3.6, 2.4, 8.6, 0, 1.1, BLUE); isoBox(gg, iso, 0.9, 3.6, 2.4, 4.2, 1.1, 1.7, BLUE); isoBox(gg, iso, 0.9, 8.0, 2.4, 8.6, 1.1, 1.7, BLUE); });
  // table basse
  piece(T + 2.3, gg => { isoBox(gg, iso, 4.2, 5.4, 6.6, 7.4, 0.75, 0.95, WOOD); isoBox(gg, iso, 4.4, 7.1, 4.6, 7.3, 0, .75, WOOD); isoBox(gg, iso, 6.3, 7.1, 6.5, 7.3, 0, .75, WOOD); });
  // meuble TV / bureau + écran
  piece(T + 2.6, gg => { isoBox(gg, iso, 9.0, 5.0, 9.8, 9.0, 0, 1.4, WOOD); isoBox(gg, iso, 9.35, 6.0, 9.55, 8.0, 1.4, 3.0, [INK, INK, '#243F5E']); });
  // plante
  piece(T + 2.9, gg => { isoBox(gg, iso, 0.5, 9.0, 1.3, 9.8, 0, 0.9, ['#F4F4F4', '#E2E2E2', '#CFCFCF']); const p = iso(0.9, 9.4, 1.9); svgEl('circle', { cx: p[0], cy: p[1], r: 30, fill: '#7FC08F' }, gg); svgEl('circle', { cx: p[0] - 14, cy: p[1] + 10, r: 18, fill: '#97D2A6' }, gg); svgEl('circle', { cx: p[0] + 14, cy: p[1] - 14, r: 16, fill: '#A9DBB4' }, gg); });
  // suspension lumineuse
  piece(T + 3.2, gg => { const a = iso(5.4, 6.4, 7), b = iso(5.4, 6.4, 4.4); svgEl('path', { d: `M${a.join(' ')} L${b.join(' ')}`, stroke: INK, 'stroke-width': 2 }, gg); svgEl('path', { d: `M${b[0] - 26} ${b[1] + 26} L${b[0] + 26} ${b[1] + 26} L${b[0] + 12} ${b[1]} L${b[0] - 12} ${b[1]} Z`, fill: '#FFD27A', stroke: INK, 'stroke-width': 2 }, gg); svgEl('ellipse', { cx: b[0], cy: b[1] + 120, rx: 120, ry: 50, fill: 'rgba(255,210,122,.18)' }, gg); });
  return { S, F, P };
};

// mini-vignette d'appartement (pour les cartes du site)
function aptThumb(i) {
  const hues = [['#DFF2FF', '#8FD3FF'], ['#E8F5EC', '#9ED8B0'], ['#FFF3E0', '#FFCF8A']][i % 3];
  return `<svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice"><rect width="200" height="130" fill="${hues[0]}"/>
   <path d="M20 112 H180" stroke="#0B2440" stroke-width="3"/><rect x="${30 + i * 6}" y="76" width="70" height="26" rx="6" fill="${hues[1]}" stroke="#0B2440" stroke-width="2.5"/>
   <rect x="${26 + i * 6}" y="64" width="14" height="38" rx="5" fill="${hues[1]}" stroke="#0B2440" stroke-width="2.5"/>
   <rect x="118" y="34" width="50" height="38" fill="#fff" stroke="#0B2440" stroke-width="2.5"/><path d="M143 34 V72" stroke="#0B2440" stroke-width="2"/>
   <path d="M120 112 V90 H160 V112" fill="none" stroke="#0B2440" stroke-width="2.5"/><circle cx="${175 - i * 4}" cy="94" r="10" fill="#7FC08F"/></svg>`;
}

/* Scène : parcours de réservation sur téléphone (site -> choix -> WhatsApp) */
SCENES.booking = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'blueprint', s);
    (s.texts || []).forEach(x => buildText(root, x));
    s._steps = (s.steps || []).map((st, i) => { const d = el('div', 'bstep', root, `<span class="bn">${i + 1}</span><span>${st.t}</span>`); Object.assign(d.style, st.pos[FMT]); return { d, at: st.at, until: st.until }; });
    const ph = el('div', 'phone', root); Object.assign(ph.style, s.phone[FMT]); s._ph = ph;
    const apts = s.apts.map((a, i) => `<div class="apt" data-i="${i}"><div class="th">${aptThumb(i)}</div><div class="ai"><div class="an">${a}</div><div class="ac">Meublé</div></div><div class="ak">${ICONS.check}</div></div>`).join('');
    ph.innerHTML = `<div class="scr bk">
      <div class="pg p0"><div class="sbar"><b>LUMO</b> IMMOBILIER</div><div class="shero">${window.heroArt ? window.heroArt() : ''}</div>
        <div class="stit">Appartements meublés<br>à Lomé</div><div class="sbtn rsv">RÉSERVER</div></div>
      <div class="pg p1"><div class="sbar"><b>LUMO</b> IMMOBILIER</div><div class="stit2">Choisissez votre appartement</div>${apts}</div>
      <div class="pg p2"><div class="sbar"><b>LUMO</b> IMMOBILIER</div><div class="dth">${aptThumb(s.pick)}</div><div class="stit2">${s.apts[s.pick]}</div><div class="ac big">Meublé</div>
        <div class="sbtn wa">${ICONS.wa}<span>RÉSERVER SUR WHATSAPP</span></div></div>
      <div class="pg p3"><div class="hdr"><div class="av">L</div><div><div class="nm">LUMO IMMOBILIER</div><div class="st">WhatsApp</div></div></div><div class="msgs"></div></div></div>`;
    s._pg = [0, 1, 2, 3].map(i => ph.querySelector('.p' + i));
    const msgs = ph.querySelector('.msgs');
    s._msgs = s.msgs.map(m => { const typing = m.me ? null : el('div', 'bub in typing', msgs, '<i></i><i></i><i></i>'); const b = el('div', 'bub ' + (m.me ? 'out' : 'in'), msgs, `${m.t}<span class="tm">${m.tm || ''}</span>`); return { b, typing, at: m.at, me: m.me }; });
    s._rsv = ph.querySelector('.rsv'); s._wa = ph.querySelector('.sbtn.wa'); s._apt = [...ph.querySelectorAll('.apt')];
    s._tap = el('div', 'tap', ph);
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    (s.texts || []).forEach(x => updateText(x, t));
    s._steps.forEach(k => { const q = E.outExpo(pr(t, k.at, k.at + .7)); const on = t < (k.until ?? 1e9); k.d.style.opacity = q * (on ? 1 : .45); k.d.style.transform = `translateX(${(1 - q) * -40}px) scale(${on ? 1 : .94})`; k.d.classList.toggle('on', on && t >= k.at); });
    const q = E.outExpo(pr(t, s.phoneAt, s.phoneAt + 1.1));
    s._ph.style.opacity = q; s._ph.style.transform = `perspective(2000px) translateY(${(1 - q) * 200}px) rotateX(${(1 - q) * 25}deg)`;
    // pages : glissement horizontal
    const cuts = s.pages; // instants de passage vers les pages 1, 2, 3
    s._pg.forEach((p, i) => {
      const enter = i === 0 ? 1 : E.inOutCubic(pr(t, cuts[i - 1], cuts[i - 1] + .5));
      const leave = i < 3 ? E.inOutCubic(pr(t, cuts[i], cuts[i] + .5)) : 0;
      p.style.transform = `translateX(${(1 - enter) * 100 - leave * 30}%)`; p.style.zIndex = i; p.style.filter = `brightness(${1 - leave * .3})`;
    });
    // pulsation du bouton Réserver, sélection, bouton WhatsApp
    s._rsv.style.transform = `scale(${1 + .04 * Math.sin(t * 6) * (t < s.taps[0] ? 1 : 0) - .06 * Math.sin(Math.PI * pr(t, s.taps[0], s.taps[0] + .3))})`;
    s._apt.forEach((a, i) => { const on = i === s.pick && t > s.taps[1]; a.classList.toggle('sel', on); a.style.transform = `scale(${i === s.pick ? 1 - .05 * Math.sin(Math.PI * pr(t, s.taps[1], s.taps[1] + .3)) : 1})`; const ap = E.outExpo(pr(t, cuts[0] + .2 + i * .15, cuts[0] + .9 + i * .15)); a.style.opacity = ap; a.style.marginLeft = (1 - ap) * 60 + 'px'; });
    s._wa.style.transform = `scale(${1 + .04 * Math.sin(t * 6) * (t > cuts[1] + .5 && t < s.taps[2] ? 1 : 0) - .06 * Math.sin(Math.PI * pr(t, s.taps[2], s.taps[2] + .3))})`;
    // indicateur de geste
    const targets = [s._rsv, s._apt[s.pick], s._wa]; let tp = -1, tgt = null;
    s.taps.forEach((tt, i) => { if (t > tt - .5 && t < tt + .5) { tp = (t - tt + .5); tgt = targets[i]; } });
    if (tgt) { const r = tgt.getBoundingClientRect(), pr0 = s._ph.getBoundingClientRect(), sc = pr0.width / s._ph.offsetWidth; s._tap.style.left = ((r.left - pr0.left) / sc + r.width / sc * .7) + 'px'; s._tap.style.top = ((r.top - pr0.top) / sc + r.height / sc * .5) + 'px'; s._tap.style.opacity = Math.sin(Math.PI * tp); s._tap.style.transform = `translate(-50%,-50%) scale(${1.3 - tp * .5})`; }
    else s._tap.style.opacity = 0;
    s._msgs.forEach(m => {
      if (m.typing) { const on = t > m.at - 1.1 && t < m.at; m.typing.style.display = on ? 'inline-flex' : 'none'; m.typing.querySelectorAll('i').forEach((d, i) => { d.style.transform = `translateY(${Math.sin(t * 9 - i) * 4}px)`; }); }
      const k = E.outBack(pr(t, m.at, m.at + .5)); m.b.style.display = t >= m.at ? 'block' : 'none'; m.b.style.transform = `scale(${k})`; m.b.style.transformOrigin = m.me ? '100% 100%' : '0 100%';
    });
  },
};

/* Scène : appel à l'action final « Réserver » */
SCENES.bigcta = {
  build(s, root) {
    root.style.background = bgOf(s);
    s._deco = buildDeco(root, s.deco || 'rings', s);
    (s.texts || []).forEach(x => buildText(root, x));
    s._btn = el('div', 'bigbtn', root, `<span>RÉSERVER</span><span class="arr">→</span>`); Object.assign(s._btn.style, s.btn[FMT]);
    s._sub = el('div', 'bigsub', root, s.sub); Object.assign(s._sub.style, s.subPos[FMT]);
    s._url = el('div', 'bigurl', root, `${ICONS.lock}<span>${CFG.site}</span>`); Object.assign(s._url.style, s.urlPos[FMT]);
    s._tap = el('div', 'tap big', root);
  },
  update(s, t) {
    updateDeco(s._deco, t, s);
    (s.texts || []).forEach(x => updateText(x, t));
    const b = E.outBack(pr(t, s.btnAt, s.btnAt + .7)); const pulse = t > s.btnAt + .7 ? .035 * Math.sin((t - s.btnAt) * 5) : 0;
    s._btn.style.opacity = clamp(b * 2); s._btn.style.transform = `translateX(-50%) scale(${b + pulse})`;
    const ring = ((t - s.btnAt) % 1.4) / 1.4; s._btn.style.boxShadow = `0 0 0 ${ring * 34 * (t > s.btnAt + .7 ? 1 : 0)}px rgba(63,169,245,${(1 - ring) * .4}), 0 30px 60px rgba(31,127,208,.35)`;
    const u = E.outExpo(pr(t, s.btnAt + .6, s.btnAt + 1.5)); s._sub.style.opacity = u; s._sub.style.transform = `translateY(${(1 - u) * 30}px)`;
    const w = E.outExpo(pr(t, s.btnAt + 1.0, s.btnAt + 1.9)); s._url.style.opacity = w; s._url.style.transform = `translateX(-50%) translateY(${(1 - w) * 30}px)`;
    const tp = pr(t, s.btnAt + 1.6, s.btnAt + 2.3); const r = s._btn.getBoundingClientRect();
    s._tap.style.left = (r.left + r.width * .72) + 'px'; s._tap.style.top = (r.top + r.height * .55) + 'px'; s._tap.style.opacity = tp > 0 && tp < 1 ? Math.sin(Math.PI * tp) : 0; s._tap.style.transform = `translate(-50%,-50%) scale(${1.4 - tp * .6})`;
  },
};
