// Storyboards des 3 publicités LUMO IMMOBILIER — calés sur la chronologie réelle de la voix off.
// buildStoryboard(n, fmt, timeline, IMG) -> { scenes, phrases, bug, illu, capEnd, duration, sections, sfx }
// P(i)/E(i) = début/fin de la phrase i de la voix off. Positions différentes en 9:16 ('v') et 16:9 ('h').

export function buildStoryboard(n, fmt, tl, IMG) {
  const v = fmt === 'v', V = (a, b) => (v ? a : b);
  const ph = tl.phrases, P = i => ph[i].start, E = i => ph[i].end;
  const X = V(90, 130), TW = V(900, 1000);
  const pos = { top: V(330, 170), mid: V(720, 380), low: V(1020, 600) };
  const kick = (t, at, out, y = pos.top, o = {}) => ({ t, at, out, style: 'kicker', x: X, y, w: TW, ...o });
  const txt = (t, at, out, style = 'h1', y = pos.top + V(80, 64), o = {}) => ({ t, at, out, style, x: X, y, w: TW, ...o });
  const C = o => ({ ...o, x: V(90, 160), align: 'center', w: V(900, 1600) });
  const IMGP = k => { if (!IMG[k]) throw new Error('image manquante : ' + k); return IMG[k]; };
  const ctaSite = { v: { left: '110px', top: '600px', width: '860px' }, h: { left: '1060px', top: '120px', width: '740px' } };
  let S = [], endAt, total;

  if (n === 1) {
    endAt = E(12) + 0.9; total = endAt + 4.4;
    S = [
      { type: 'photo', start: 0, img: IMGP('v1_hook'), from: [1.42, 0, 6, 0, 6], to: [1.12, 0, -3, 0, 0], dust: true,
        texts: [kick('Projet de construction', .15, P(1) - .4), txt(v ? 'Vous avez|un projet de|construction ?' : 'Vous avez un projet|de construction ?', .3, P(1) - .45, 'hero', pos.top + V(80, 64), { accent: ['construction'] })] },
      { type: 'cadastre', start: P(1) - .35, enter: 'zoom', img: IMGP('v1_aerial'), hlAt: P(1) + .9,
        labels: [
          { t: 'Emplacement', at: P(2) + .2, pos: { v: { left: '90px', top: '1000px' }, h: { left: '1300px', top: '300px' } } },
          { t: 'Accès', at: P(2) + .6, pos: { v: { left: '90px', top: '1105px' }, h: { left: '1300px', top: '400px' } } },
          { t: 'Environnement', at: P(2) + 1.0, pos: { v: { left: '90px', top: '1210px' }, h: { left: '1300px', top: '500px' } } }],
        texts: [txt('Tout commence par|le bon terrain.', P(1), P(2) - .1, 'h1', pos.top, { accent: ['bon', 'terrain.'] }),
                txt('La base de votre|projet de vie.', P(2) + .05, P(3) - .5, 'h1', pos.top, { accent: ['projet', 'vie.'] })] },
      { type: 'photo', start: P(3) - .3, enter: 'wipe', img: IMGP('v1_risk'), from: [1.1, 0, 0, -4], to: [1.25, 0, 2, 3],
        filter: 'saturate(.55) contrast(1.1) brightness(.75)', grade: 'linear-gradient(180deg, rgba(7,26,51,.85), rgba(7,26,51,.55) 50%, rgba(7,26,51,.9))',
        texts: [kick('Attention', P(3) - .1, P(4) + 1.3),
                txt('Emplacement|mal choisi ?', P(3), P(4) - .25, 'h1', pos.top + V(80, 64)),
                txt('Dossier|incomplet ?', P(3) + 1.25, P(4) - .25, 'h1', pos.top + V(330, 280), { accent: ['incomplet'] }),
                txt('Et tout votre projet|se complique.', P(4) + .05, P(5) - .5, 'h1', pos.top + V(80, 64))] },
      { type: 'brand', start: P(5) - .4, enter: 'flash', td: .9, img: IMGP('v1_house'),
        texts: [C(txt('Agence immobilière|Lomé · Togo', P(5) + 1.0, null, 'dark2', V(1180, 720)))] },
      { type: 'steps', start: P(6) - .35, enter: 'slide', img: IMGP('v1_street'),
        grid: { v: { x: 90, y: 640, dy: 230, w: 900 }, h: { x: 1000, y: 250, dy: 210, w: 800 } },
        items: [{ icon: 'pin', t: 'Emplacement', s: 'adapté à votre projet', at: P(6) },
                { icon: 'doc', t: 'Documents', s: 'examinés de près', at: P(7) },
                { icon: 'key', t: 'Acquisition', s: 'préparée étape par étape', at: P(8) }],
        texts: [kick("L'accompagnement LUMO", P(6) - .1, null), txt('Votre terrain,|en toute clarté.', P(6) + .1, null, 'h2', pos.top + V(70, 60))] },
      { type: 'city', start: P(9) - .4, enter: 'zoom',
        pins: [{ t: 'Terrains', x: 280, y: 420, at: P(9) + .3 }, { t: 'Quartiers résidentiels', x: 640, y: 330, at: P(9) + .9 }, { t: 'Nouvelles constructions', x: 700, y: 600, at: P(9) + 1.5 }],
        texts: [kick('Plan stylisé de Lomé', P(9) - .2, null), txt('Lomé et ses environs|se construisent.', P(9), null, 'h1', pos.top + V(70, 60), { accent: ['construisent.'] })] },
      { type: 'photo', start: P(10) - .25, enter: 'wipe', img: IMGP('v1_house'), from: [1.3, 0, 3, -6], to: [1.08, 0, 0, 4], leak: true,
        texts: [txt(v ? 'Votre projet|mérite des|fondations|solides.' : 'Votre projet mérite|des fondations solides.', P(10), null, 'hero', pos.top + V(40, 40), { accent: ['solides.'] })] },
      { type: 'cta', start: P(11) - .4, enter: 'slide', img: IMGP('v1_house'), site: ctaSite, siteAt: P(11) + .5, b1At: P(12) + .2, b2At: P(12) + 2.0,
        texts: [txt(v ? 'Vous avez un|projet immobilier ?' : 'Vous avez un|projet immobilier ?', P(11) - .1, null, 'h2', V(220, 300), v ? C({}) : {}),
                ...(v ? [] : [txt('Rendez-vous sur notre site|et échangez avec|un conseiller LUMO.', P(12), null, 'body', 500)])] },
      { type: 'end', start: endAt, enter: 'fade', td: .7 },
    ];
  }

  if (n === 2) {
    endAt = E(10) + 0.9; total = endAt + 4.4;
    S = [
      { type: 'photo', start: 0, img: IMGP('v2_hook'), from: [1.35, 4, 3, -5], to: [1.08, -2, 0, 3], leak: true, dust: true,
        texts: [kick('Votre prochaine maison', .2, P(1) - .5), txt(v ? 'Et si c’était|exactement celle|dont vous avez|toujours rêvé ?' : 'Et si c’était exactement|celle dont vous avez|toujours rêvé ?', .45, P(1) - .45, 'h1', pos.top + V(80, 64), { accent: ['rêvé'], stagger: .07 })] },
      { type: 'panels', start: P(1) - .4, enter: 'zoom',
        items: [
          { img: IMGP('v2_salon'), t: 'Un salon baigné de lumière', at: P(1) - .2, box: { v: [60, 250, 960, 330], h: [100, 140, 560, 740] } },
          { img: IMGP('v2_jardin'), t: 'Un jardin pour respirer', at: P(2) - .1, box: { v: [60, 600, 960, 330], h: [680, 140, 560, 740] } },
          { img: IMGP('v2_chambre'), t: 'Le calme, chaque soir', at: P(3) - .1, box: { v: [60, 950, 960, 330], h: [1260, 140, 560, 740] } }] },
      { type: 'photo', start: P(4) - .4, enter: 'wipe', img: IMGP('v2_kitchen'), from: [1.3, -3, 0, 6], to: [1.08, 2, 0, -2],
        texts: [kick('La bonne recherche', P(4) - .1, null), txt('Savoir ce que vous|voulez vraiment.', P(4) + .1, null, 'h1', pos.top + V(80, 64), { accent: ['vraiment.'] })] },
      { type: 'brand', start: P(5) - .35, enter: 'flash', td: .9, img: IMGP('v2_salon'),
        texts: [C(txt('Agence immobilière|Lomé · Togo', P(5) + 1.0, null, 'dark2', V(1180, 720)))] },
      { type: 'steps', start: P(6) - .3, enter: 'slide', img: IMGP('v2_villa'),
        grid: { v: { x: 90, y: 640, dy: 230, w: 900 }, h: { x: 1000, y: 250, dy: 210, w: 800 } },
        items: [{ icon: 'ear', t: 'Vos attentes', s: 'et votre budget', at: P(6) - .1 },
                { icon: 'heart', t: 'Votre façon de vivre', s: 'au cœur de la recherche', at: P(6) + 1.0 },
                { icon: 'home', t: 'Des biens', s: 'qui vous ressemblent', at: P(7) + .3 }],
        texts: [kick('Une recherche sur mesure', P(6) - .2, null), txt('Villas et maisons,|selon vous.', P(6), null, 'h2', pos.top + V(70, 60))] },
      { type: 'photo', start: P(8) - .4, enter: 'zoom', img: IMGP('v2_pool'), from: [1.4, 0, 4, 0, 6], to: [1.1, 0, -2, 0, 0], dust: true, leak: true,
        texts: [txt('Une recherche|personnalisée.', P(8), P(8) + 1.75, 'h1', pos.top + V(80, 64), { accent: ['personnalisée.'] }),
                txt('Un accompagnement|à chaque étape.', P(8) + 1.85, null, 'h1', pos.top + V(80, 64), { accent: ['chaque', 'étape.'] })] },
      { type: 'cta', start: P(9) - .4, enter: 'slide', img: IMGP('v2_hook'), site: ctaSite, siteAt: P(9) + .9, b1At: P(10) + .2, b2At: P(10) + 1.9,
        texts: [txt('Votre future maison|vous attend peut-être déjà.', P(9) - .1, null, 'h2', V(200, 300), v ? C({ style: 'h2' }) : {}),
                ...(v ? [] : [txt('Rendez-vous sur notre site|et parlez à un|conseiller LUMO.', P(10), null, 'body', 560)])] },
      { type: 'end', start: endAt, enter: 'fade', td: .7 },
    ];
  }

  if (n === 3) {
    endAt = E(10) + 0.9; total = endAt + 4.4;
    const wmap = {
      v: { x: -700, y: 300, w: 2480, h: 1240, vb: [0, 0, 1800, 900] },
      h: { x: -160, y: -40, w: 2240, h: 1120, vb: [0, 0, 1800, 900] } };
    S = [
      { type: 'world', start: 0, map: wmap, arcAt: .6,
        zoom: { v: [1.0, 1.55, 0, -260, 0, 40], h: [1.0, 1.4, 60, 200, 40, 95] },
        cities: [{ n: 'Paris', lon: 2.35, lat: 48.85 }, { n: 'Montréal', lon: -73.57, lat: 45.5 }, { n: 'New York', lon: -74, lat: 40.7 },
                 { n: 'Bruxelles', lon: 4.35, lat: 50.85 }, { n: 'Berlin', lon: 13.4, lat: 52.5 }],
        texts: [kick('Diaspora togolaise', .1, P(1) - .4), txt('Vous vivez|à l’étranger…', .3, P(1) - .4, 'hero', pos.top + V(80, 64)),
                txt(v ? '…mais votre|projet, c’est|au Togo ?' : '…mais votre projet,|c’est au Togo ?', P(1), null, 'hero', pos.top + V(80, 64), { accent: ['Togo'] })] },
      { type: 'photo', start: P(2) - .4, enter: 'zoom', img: IMGP('v3_question'), from: [1.25, 2, 0, 4], to: [1.08, -2, 0, -3],
        filter: 'saturate(.7) brightness(.7) contrast(1.08)', grade: 'linear-gradient(180deg, rgba(7,26,51,.88), rgba(7,26,51,.55) 50%, rgba(7,26,51,.9))',
        texts: [kick('Investir à distance', P(2) - .1, null), txt('Des questions|légitimes.', P(2) + .1, P(3) - .3, 'h1', pos.top + V(80, 64)),
                txt('Quel bien choisir ?', P(3), null, 'h2', pos.top + V(90, 74)),
                txt('À qui faire confiance ?', P(3) + 1.2, null, 'h2', pos.top + V(190, 164), { accent: ['confiance'] }),
                txt('Comment avancer|quand on vit loin ?', P(4), null, 'h2', pos.top + V(290, 254))] },
      { type: 'brand', start: P(5) - .4, enter: 'flash', td: .9, img: IMGP('v3_villa'),
        texts: [C(txt('Agence immobilière|Lomé · Togo', P(5) + 1.0, null, 'dark2', V(1180, 720)))] },
      { type: 'city', start: P(6) - .3, enter: 'slide',
        pins: [{ t: 'Terrains', x: 300, y: 400, at: P(6) + .1 }, { t: 'Villas', x: 640, y: 330, at: P(6) + .75 }, { t: 'Maisons', x: 720, y: 600, at: P(6) + 1.4 }],
        texts: [kick('Plan stylisé de Lomé', P(6) - .2, null), txt('Lomé et|ses environs.', P(6), null, 'h1', pos.top + V(70, 60))] },
      { type: 'photo', start: P(7) - .3, enter: 'wipe', img: IMGP('v3_building'), from: [1.3, 0, 4, 0, 5], to: [1.08, 0, -2, 0, 0], dust: true,
        tag: 'Échanges à distance', tagAt: P(7) + .6,
        texts: [txt('Un conseiller,|où que vous soyez.', P(7), null, 'h1', pos.top + V(80, 64), { accent: ['où', 'soyez.'] })] },
      { type: 'pillars', start: P(8) - .4, enter: 'zoom', img: IMGP('v3_villa'),
        grid: { v: { x: 90, y: 700, dx: 0, dy: 200, w: 900 }, h: { x: 160, y: 470, dx: 560, dy: 0, w: 480 } },
        items: [{ icon: 'build', t: 'Bâtir un patrimoine', at: P(8) }, { icon: 'plane', t: 'Préparer votre retour', at: P(8) + 1.35 }, { icon: 'heart', t: 'Penser à vos enfants', at: P(8) + 2.7 }],
        texts: [kick('Votre patrimoine au Togo', P(8) - .2, null), txt('Investir|avec sens.', P(8), null, 'h1', pos.top + V(80, 64))] },
      { type: 'photo', start: P(9) - .3, enter: 'flash', td: .7, img: IMGP('v3_hero'), from: [1.3, 0, 3, -5], to: [1.06, 0, 0, 3], leak: true,
        texts: [txt('Votre projet peut|commencer dès|aujourd’hui.', P(9) + .1, null, 'h1', pos.top + V(40, 40), { accent: ['aujourd’hui.'] })] },
      { type: 'cta', start: P(10) - .4, enter: 'slide', img: IMGP('v3_villa'), site: ctaSite, siteAt: P(10) + .3, b1At: P(10) + 1.0, b2At: P(10) + 2.9,
        texts: [txt('Échangez avec un|conseiller LUMO.', P(10) - .1, null, 'h2', V(220, 300), v ? C({}) : {}),
                ...(v ? [] : [txt('Rendez-vous sur notre site,|où que vous soyez.', P(10) + .4, null, 'body', 500)])] },
      { type: 'end', start: endAt, enter: 'fade', td: .7 },
    ];
  }

  // centrage automatique pour C() (le format v centre la plupart des titres de CTA)
  S.forEach(s => (s.texts || []).forEach(x => { if (x.out === null) delete x.out; }));
  const brand = S.find(s => s.type === 'brand');
  const ctaS = S.find(s => s.type === 'cta');
  // ------------------------------------------------------------ audio : sections et effets
  const secOrder = [];
  ph.forEach(p => { if (!secOrder.find(s => s.name === p.section)) secOrder.push({ name: p.section, start: secOrder.length ? Math.max(0, p.start - .4) : 0 }); });
  secOrder.push({ name: 'fin', start: endAt });
  const sfx = [];
  S.forEach((s, i) => {
    if (i === 0) { sfx.push({ type: 'impact', t: 0.05 }); return; }
    if (s.type === 'brand') { sfx.push({ type: 'riser', t: s.start + .35, dur: 1.6 }, { type: 'impact', t: s.start + .35 }, { type: 'shimmer', t: s.start + 1.0 }); return; }
    if (s.type === 'end') { sfx.push({ type: 'impact', t: s.start + .1 }, { type: 'shimmer', t: s.start + .7 }); return; }
    sfx.push({ type: 'whoosh', t: s.start + .25, dur: .9, pan: i % 2 ? .4 : -.4 });
    (s.items || []).forEach(it => it.at != null && s.type !== 'panels' && sfx.push({ type: 'tick', t: it.at + .1 }));
    (s.pins || []).forEach(p => sfx.push({ type: 'pop', t: p.at + .1 }));
    if (s.type === 'panels') s.items.forEach(it => sfx.push({ type: 'whoosh', t: it.at + .2, dur: .7, pan: .2 }));
    if (s.type === 'cadastre') sfx.push({ type: 'pop', t: s.hlAt + .3 });
    if (s.type === 'cta') sfx.push({ type: 'pop', t: s.b1At + .05 }, { type: 'pop', t: s.b2At + .05 });
  });
  return {
    scenes: S, phrases: ph, duration: +total.toFixed(3), sections: secOrder, sfx, music_end: endAt,
    bug: [brand.start + 1.6, ctaS.start], illu: [0, endAt], capEnd: ctaS.start + .3,
    lightCap: [[brand.start, brand.start + (S[S.indexOf(brand) + 1].start - brand.start)]],
  };
}
