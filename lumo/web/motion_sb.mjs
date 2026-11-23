// Storyboards « motion design pur » (sans voix off, sans photo) des 3 publicités LUMO IMMOBILIER.
// buildMotion(n, fmt) -> { scenes, phrases:[], duration, sections, sfx, music_end, bug, novoice }
export function buildMotion(n, fmt) {
  const v = fmt === 'v', V = (a, b) => (v ? a : b);
  const X = V(90, 130), TW = V(900, 900), TOP = V(330, 170);
  const T = (t, at, style, y, o = {}) => ({ t, at, style, x: X, y, w: TW, ...o });
  const K = (t, at, dark, y = TOP) => T(t, at, dark ? 'kicker' : 'kickerD', y);
  const site = { v: { left: '110px', top: '640px', width: '860px' }, h: { left: '1060px', top: '130px', width: '740px' } };
  const phone = { v: { left: '240px', top: '680px', width: '600px', height: '820px' }, h: { left: '1180px', top: '70px', width: '560px', height: '940px' } };
  const draw = { v: [60, 560, 960], h: [880, 40, 1000] };
  const qRow = (i) => ({ v: { left: '90px', top: (640 + i * 200) + 'px' }, h: { left: '130px', top: (380 + i * 170) + 'px' } });
  const qTxt = (t, at, i, acc) => T(t, at, 'h2D', V(665 + i * 200, 405 + i * 170), { x: V(250, 290), w: V(760, 1400), accent: acc });
  let S = [], secs;
  const cta = (start, line1, b1, b2) => ({ type: 'cta', light: true, deco: 'blueprint', start, enter: 'slide', site, siteAt: start + .5, b1At: start + b1, b2At: start + b2,
    texts: [T(line1, start + .1, 'h2D', V(260, 380), v ? { x: 90, align: 'center', w: 900 } : {})] });
  const end = start => ({ type: 'end', start, enter: 'fade', td: .7, legal: 'Lomé · Togo' });
  const brand = (start, line) => ({ type: 'brand', start, enter: 'flash', td: .9, texts: [T(line, start + 1.0, 'dark2', V(1180, 720), { x: V(90, 160), align: 'center', w: V(900, 1600) })] });

  if (n === 1) {
    S = [
      { type: 'title', dark: true, deco: 'blueprint', start: 0,
        texts: [K('Projet de construction', .15, true), T(v ? 'Vous cherchez|un terrain|à Lomé ?' : 'Vous cherchez un|terrain à Lomé ?', .3, 'hero', TOP + V(80, 64), { accent: ['terrain'] })] },
      { type: 'draw', art: 'plot', start: 3.2, enter: 'zoom', box: draw, artAt: .2,
        labels: [{ t: 'Emplacement', at: 5.6, pos: { v: { left: '90px', top: '1400px' }, h: { left: '130px', top: '600px' } } },
                 { t: 'Accès', at: 5.9, pos: { v: { left: '420px', top: '1400px' }, h: { left: '130px', top: '700px' } } },
                 { t: 'Superficie', at: 6.2, pos: { v: { left: '640px', top: '1400px' }, h: { left: '130px', top: '800px' } } }],
        texts: [K('Tout commence ici', 3.3), T('Le bon terrain,|la base de tout.', 3.45, 'h1D', TOP + V(80, 64), { accent: ['terrain,'] })] },
      { type: 'title', deco: 'grid', start: 8.0, enter: 'wipe',
        icons: [{ icon: 'pin', at: 8.5, pos: qRow(0) }, { icon: 'doc', at: 9.7, pos: qRow(1) }, { icon: 'route', at: 10.9, pos: qRow(2) }],
        texts: [K('Avant d’acheter', 8.1), T('Les bonnes questions', 8.2, 'h1D', TOP + V(80, 64)),
                qTxt('Le bon emplacement ?', 8.6, 0, ['emplacement']), qTxt('Des documents clairs ?', 9.8, 1, ['documents']), qTxt('Les bonnes étapes ?', 11.0, 2, ['étapes'])] },
      brand(12.6, 'Votre partenaire immobilier|à Lomé'),
      { type: 'cards', start: 15.2, enter: 'slide', line: true,
        grid: { v: { x: 90, y: 720, dy: 240, w: 900 }, h: { x: 980, y: 220, dy: 250, w: 820 } },
        items: [{ icon: 'pin', t: 'Emplacement', s: 'Les quartiers adaptés à votre projet', at: 16.0 },
                { icon: 'doc', t: 'Documents', s: 'Le dossier du terrain, examiné avec vous', at: 17.9 },
                { icon: 'key', t: 'Acquisition', s: 'Chaque étape, expliquée et préparée', at: 19.8 }],
        texts: [K('Notre accompagnement', 15.3), T('On avance|avec vous.', 15.45, 'h1D', TOP + V(80, 64), { accent: ['avec', 'vous.'] })] },
      { type: 'draw', art: 'plot', opt: { house: true, houseAt: 23.2 }, start: 22.4, enter: 'slide', box: draw, artAt: -2.6,
        texts: [K('Votre projet', 22.5), T('Du terrain…|à votre maison.', 22.6, 'h1D', TOP + V(80, 64), { accent: ['maison.'] })] },
      { type: 'chat', start: 26.6, enter: 'wipe', phone, phoneAt: 26.9,
        msgs: [{ me: true, t: 'Bonjour, je cherche un terrain pour construire à Lomé.', at: 28.0, tm: '10:02' },
               { me: false, t: 'Bonjour ! Avec plaisir. Parlons de votre projet : quartier, superficie, budget…', at: 30.0, tm: '10:03' }],
        texts: [K('Un vrai interlocuteur', 26.7), T(v ? 'Un conseiller|vous répond.' : 'Un conseiller|vous répond.', 26.85, 'h1D', TOP + V(80, 64), { accent: ['conseiller'] })] },
      cta(32.6, v ? 'Votre projet de terrain|commence sur notre site.' : 'Votre projet de terrain|commence sur|notre site.', 1.4, 3.0),
      end(38.4),
    ];
    secs = [['hook', 0], ['probleme', 8.0], ['solution', 12.6], ['confiance', 22.4], ['cta', 32.6], ['fin', 38.4]];
  }

  if (n === 2) {
    S = [
      { type: 'title', dark: true, deco: 'blueprint', start: 0,
        texts: [K('Votre future maison', .15, true), T(v ? 'Vous cherchez|une villa ou|une maison ?' : 'Vous cherchez une|villa ou une maison ?', .3, 'hero', TOP + V(80, 64), { accent: ['villa', 'maison'] })] },
      { type: 'draw', art: 'villa', start: 3.4, enter: 'zoom', box: { v: [60, 600, 960], h: [880, 40, 1000] }, artAt: .1,
        texts: [K('Imaginez', 3.5), T('La maison qui|vous ressemble.', 3.65, 'h1D', TOP + V(80, 64), { accent: ['ressemble.'] })] },
      { type: 'chips', start: 9.0, enter: 'wipe',
        wrap: { v: { left: '90px', top: '700px', width: '900px' }, h: { left: '130px', top: '470px', width: '1660px' } },
        items: [{ icon: 'expand', t: 'Plus d’espace', at: 9.6 }, { icon: 'tree', t: 'Un jardin', at: 10.1 }, { icon: 'moon', t: 'Un quartier calme', at: 10.6 },
                { icon: 'family', t: 'Pour toute la famille', at: 11.1 }, { icon: 'wallet', t: 'Selon votre budget', at: 11.6 }],
        texts: [K('Vos critères comptent', 9.1), T('Dites-nous ce que|vous recherchez.', 9.25, 'h1D', TOP + V(80, 64), { accent: ['recherchez.'] })] },
      brand(13.6, 'Votre partenaire immobilier|à Lomé'),
      { type: 'cards', start: 16.4, enter: 'slide', line: true,
        grid: { v: { x: 90, y: 720, dy: 240, w: 900 }, h: { x: 980, y: 220, dy: 250, w: 820 } },
        items: [{ icon: 'ear', t: 'Écoute', s: 'Vos critères, votre budget, votre façon de vivre', at: 17.2 },
                { icon: 'search', t: 'Recherche', s: 'Des villas et maisons adaptées à vous', at: 19.1 },
                { icon: 'key', t: 'Accompagnement', s: 'À chaque étape, jusqu’à votre décision', at: 21.0 }],
        texts: [K('Notre méthode', 16.5), T('Une recherche|sur mesure.', 16.65, 'h1D', TOP + V(80, 64), { accent: ['sur', 'mesure.'] })] },
      { type: 'chat', start: 23.6, enter: 'wipe', phone, phoneAt: 23.9,
        msgs: [{ me: true, t: 'Bonjour, je cherche une villa avec jardin pour ma famille.', at: 25.0, tm: '18:41' },
               { me: false, t: 'Bonjour ! Avec plaisir. Combien de chambres, quel quartier et quel budget ?', at: 27.0, tm: '18:42' }],
        texts: [K('Parlez-nous de votre projet', 23.7), T('Un conseiller|vous répond.', 23.85, 'h1D', TOP + V(80, 64), { accent: ['conseiller'] })] },
      { type: 'title', dark: true, deco: 'rings', start: 29.6, enter: 'zoom',
        texts: [T(v ? 'Votre future|maison|commence par|un échange.' : 'Votre future maison|commence par|un échange.', 29.75, 'h1', V(560, 300), { accent: ['échange.'] })] },
      cta(32.8, v ? 'Trouvons ensemble|votre future maison.' : 'Trouvons ensemble|votre future maison.', 1.4, 3.0),
      end(38.6),
    ];
    secs = [['hook', 0], ['probleme', 9.0], ['solution', 13.6], ['confiance', 23.6], ['cta', 32.8], ['fin', 38.6]];
  }

  if (n === 3) {
    S = [
      { type: 'world', start: 0, arcAt: .5,
        map: { v: { x: -700, y: 300, w: 2480, h: 1240, vb: [0, 0, 1800, 900] }, h: { x: -160, y: -40, w: 2240, h: 1120, vb: [0, 0, 1800, 900] } },
        zoom: { v: [1.0, 1.55, 0, -260, 0, 40], h: [1.0, 1.4, 60, 200, 40, 95] },
        cities: [{ n: 'Paris', lon: 2.35, lat: 48.85 }, { n: 'Montréal', lon: -73.57, lat: 45.5 }, { n: 'New York', lon: -74, lat: 40.7 },
                 { n: 'Bruxelles', lon: 4.35, lat: 50.85 }, { n: 'Berlin', lon: 13.4, lat: 52.5 }],
        texts: [K('Diaspora togolaise', .1, true), T(v ? 'Vous vivez|à l’étranger ?' : 'Vous vivez|à l’étranger ?', .25, 'hero', TOP + V(80, 64), { out: 2.3 }),
                T(v ? 'Votre projet,|c’est au Togo.' : 'Votre projet,|c’est au Togo.', 2.4, 'hero', TOP + V(80, 64), { accent: ['Togo.'] })] },
      { type: 'title', deco: 'grid', start: 4.6, enter: 'wipe',
        icons: [{ icon: 'home', at: 5.1, pos: qRow(0) }, { icon: 'ear', at: 6.3, pos: qRow(1) }, { icon: 'globe', at: 7.5, pos: qRow(2) }],
        texts: [K('Investir à distance', 4.7), T(v ? 'Des questions|légitimes' : 'Des questions légitimes', 4.8, 'h1D', TOP + V(80, 64)),
                qTxt('Quel bien choisir ?', 5.2, 0, ['bien']), qTxt('À qui faire confiance ?', 6.4, 1, ['confiance']), qTxt('Comment suivre de loin ?', 7.6, 2, ['loin'])] },
      brand(9.4, 'Accompagne les investisseurs|de la diaspora'),
      { type: 'city', start: 12.2, enter: 'slide',
        pins: [{ t: 'Terrains', x: 300, y: 400, at: 12.9 }, { t: 'Villas', x: 640, y: 330, at: 13.5 }, { t: 'Maisons', x: 720, y: 600, at: 14.1 }],
        texts: [K('Plan stylisé de Lomé', 12.3, true), T('Lomé et|ses environs.', 12.45, 'h1', TOP + V(70, 60))] },
      { type: 'chat', start: 16.6, enter: 'wipe', phone, phoneAt: 16.9,
        msgs: [{ me: true, t: 'Bonjour, je vis à Paris et je souhaite investir à Lomé.', at: 18.0, tm: '21:15' },
               { me: false, t: 'Bonjour ! Parlons de votre projet. Nous échangeons à distance, à votre rythme.', at: 20.0, tm: '21:16' }],
        texts: [K('Où que vous soyez', 16.7), T('Un conseiller,|à distance.', 16.85, 'h1D', TOP + V(80, 64), { accent: ['distance.'] })] },
      { type: 'iso', start: 22.6, enter: 'zoom', box: { v: [60, 640, 960], h: [880, 40, 1000] },
        labels: [{ t: 'Patrimoine', at: 23.8, pos: { v: { left: '90px', top: '1400px' }, h: { left: '130px', top: '600px' } } },
                 { t: 'Retour au pays', at: 24.5, pos: { v: { left: '370px', top: '1400px' }, h: { left: '130px', top: '700px' } } },
                 { t: 'Transmission', at: 25.2, pos: { v: { left: '700px', top: '1400px' }, h: { left: '130px', top: '800px' } } }],
        texts: [K('Votre patrimoine', 22.7), T('Bâtir au pays,|pour demain.', 22.85, 'h1D', TOP + V(80, 64), { accent: ['demain.'] })] },
      cta(28.2, v ? 'Votre projet au Togo|commence sur notre site.' : 'Votre projet au Togo|commence sur|notre site.', 1.4, 3.0),
      end(34.0),
    ];
    secs = [['hook', 0], ['probleme', 4.6], ['solution', 9.4], ['confiance', 22.6], ['cta', 28.2], ['fin', 34.0]];
  }

  if (n === 4) { // Exemple : appartements meublés à Lomé
    const apts = ['Studio meublé', 'Appartement 1 chambre', 'Appartement 2 chambres'];
    S = [
      { type: 'title', dark: true, deco: 'blueprint', start: 0,
        texts: [K('Appartements meublés · Lomé', .15, true), T(v ? 'Vous cherchez|un appartement|meublé|à Lomé ?' : 'Vous cherchez un|appartement meublé|à Lomé ?', .3, 'hero', TOP + V(80, 64), { accent: ['meublé'] })] },
      { type: 'chips', start: 3.6, enter: 'wipe',
        wrap: { v: { left: '90px', top: '700px', width: '900px' }, h: { left: '130px', top: '470px', width: '1660px' } },
        items: [{ icon: 'build', t: 'En mission', at: 4.3 }, { icon: 'moon', t: 'En vacances', at: 4.8 }, { icon: 'plane', t: 'De passage', at: 5.3 },
                { icon: 'family', t: 'En famille', at: 5.8 }, { icon: 'home', t: 'Retour au pays', at: 6.3 }],
        texts: [K('Pour votre séjour', 3.7), T('Un chez-vous,|dès votre arrivée.', 3.85, 'h1D', TOP + V(80, 64), { accent: ['chez-vous,'] })] },
      { ...brand(8.2, 'Appartements meublés|à Lomé') },
      { type: 'draw', art: 'room', start: 10.8, enter: 'zoom', box: { v: [100, 700, 880], h: [880, 40, 1000] }, artAt: .1,
        labels: [{ t: 'Salon', at: 13.6, pos: { v: { left: '90px', top: '1400px' }, h: { left: '130px', top: '600px' } } },
                 { t: 'Chambre', at: 14.0, pos: { v: { left: '310px', top: '1400px' }, h: { left: '130px', top: '700px' } } },
                 { t: 'Entièrement meublé', at: 14.4, pos: { v: { left: '570px', top: '1400px' }, h: { left: '130px', top: '800px' } } }],
        texts: [K('Nos appartements meublés', 10.9), T('Posez vos valises,|vous êtes chez vous.', 11.05, 'h1D', TOP + V(80, 64), { accent: ['chez', 'vous.'] })] },
      { type: 'cards', start: 16.6, enter: 'slide', line: false, numLabel: 'CHOIX',
        grid: { v: { x: 90, y: 720, dy: 240, w: 900 }, h: { x: 980, y: 220, dy: 250, w: 820 } },
        items: [{ icon: 'home', t: apts[0], s: 'Pour une personne ou un couple', at: 17.3 },
                { icon: 'home', t: apts[1], s: 'Plus d’espace, une chambre séparée', at: 18.3 },
                { icon: 'family', t: apts[2], s: 'Pour la famille ou entre collègues', at: 19.3 }],
        texts: [K('Plusieurs formats', 16.7), T('L’appartement|qu’il vous faut.', 16.85, 'h1D', TOP + V(80, 64), { accent: ['vous', 'faut.'] })] },
      { type: 'booking', start: 22.0, enter: 'wipe', phoneAt: 22.2, pick: 1, apts,
        phone: { v: { left: '260px', top: '690px', width: '560px', height: '810px' }, h: { left: '1180px', top: '70px', width: '560px', height: '940px' } },
        pages: [24.6, 27.8, 30.0], taps: [24.1, 27.2, 29.5],
        steps: [{ t: 'Cliquez sur « Réserver »', at: 22.6, until: 25.6, pos: { v: { left: '90px', top: '410px' }, h: { left: '130px', top: '420px' } } },
                { t: 'Choisissez votre appartement', at: 25.6, until: 29.3, pos: { v: { left: '90px', top: '500px' }, h: { left: '130px', top: '530px' } } },
                { t: 'Réservez sur WhatsApp', at: 29.3, pos: { v: { left: '90px', top: '590px' }, h: { left: '130px', top: '640px' } } }],
        msgs: [{ me: true, t: 'Bonjour, je souhaite réserver l’appartement 1 chambre.', at: 31.0, tm: '09:12' },
               { me: false, t: 'Bonjour ! Avec plaisir. Pour quelles dates ?', at: 33.0, tm: '09:13' }],
        texts: [K('Réserver en 3 étapes', 22.1), ...(v ? [] : [T('Réserver,|c’est simple.', 22.25, 'h1D', TOP + 64, { accent: ['simple.'] })])] },
      { type: 'bigcta', start: 35.0, enter: 'zoom', btnAt: 35.9,
        btn: { v: { left: '50%', top: '760px', width: '760px' }, h: { left: '50%', top: '450px', width: '700px' } },
        sub: 'Choisissez votre appartement sur notre site,<br>puis réservez via WhatsApp.',
        subPos: { v: { left: '90px', width: '900px', top: '960px' }, h: { left: '260px', width: '1400px', top: '640px' } },
        urlPos: { v: { left: '50%', top: '1140px' }, h: { left: '50%', top: '790px' } },
        texts: [T('Réservez votre|appartement meublé.', 35.15, 'h1D', V(420, 180), { x: V(90, 160), align: 'center', w: V(900, 1600), accent: ['meublé.'] })] },
      { ...end(39.5), legal: 'Appartements meublés · Lomé, Togo', waText: 'Réservation via WhatsApp depuis notre site' },
    ];
    secs = [['hook', 0], ['probleme', 3.6], ['solution', 8.2], ['confiance', 16.6], ['cta', 35.0], ['fin', 39.5]];
  }
  S.forEach(s => (s.texts = (s.texts || []).filter(Boolean)));
  const endS = S[S.length - 1], total = endS.start + 4.2, brandS = S.find(s => s.type === 'brand'), ctaS = S.find(s => s.type === 'cta' || s.type === 'bigcta');
  const sfx = [];
  S.forEach((s, i) => {
    if (i === 0) { sfx.push({ type: 'impact', t: 0.05 }); return; }
    if (s.type === 'brand') { sfx.push({ type: 'riser', t: s.start + .35, dur: 1.6 }, { type: 'impact', t: s.start + .35 }, { type: 'shimmer', t: s.start + 1.0 }); return; }
    if (s.type === 'end') { sfx.push({ type: 'impact', t: s.start + .1 }, { type: 'shimmer', t: s.start + .7 }); return; }
    sfx.push({ type: 'whoosh', t: s.start + .25, dur: .9, pan: i % 2 ? .4 : -.4 });
    (s.items || []).forEach(it => sfx.push({ type: s.type === 'chips' ? 'pop' : 'tick', t: it.at + .1 }));
    (s.icons || []).forEach(it => sfx.push({ type: 'pop', t: it.at + .1 }));
    (s.pins || []).forEach(p => sfx.push({ type: 'pop', t: p.at + .1 }));
    (s.msgs || []).forEach(m => sfx.push({ type: 'pop', t: m.at + .05 }));
    (s.taps || []).forEach(x => sfx.push({ type: 'pop', t: x + .02 }));
    (s.pages || []).forEach(x => sfx.push({ type: 'whoosh', t: x + .25, dur: .6, pan: .3 }));
    (s.steps || []).forEach(x => sfx.push({ type: 'tick', t: x.at + .05 }));
    if (s.type === 'bigcta') sfx.push({ type: 'pop', t: s.btnAt + .05 }, { type: 'pop', t: s.btnAt + 1.9 });
    if (s.art === 'room') [1.3, 1.6, 2.0, 2.3, 2.6, 2.9, 3.2].forEach(k => sfx.push({ type: 'tick', t: s.start + s.artAt + k + .1 }));
    (s.labels || []).forEach(l => sfx.push({ type: 'tick', t: l.at + .05 }));
    if (s.art === 'plot' && !s.opt) [0, 1, 2, 3].forEach(k => sfx.push({ type: 'tick', t: s.start + s.artAt + 1.5 + k * .18 }));
    if (s.opt && s.opt.house) sfx.push({ type: 'whoosh', t: s.opt.houseAt + .3, dur: 1.0 });
    if (s.type === 'cta') sfx.push({ type: 'pop', t: s.b1At + .05 }, { type: 'pop', t: s.b2At + .05 });
  });
  return { scenes: S, phrases: [], duration: +total.toFixed(2), sections: secs.map(([name, start]) => ({ name, start })), sfx, music_end: endS.start,
           bug: [brandS.start + 1.6, ctaS.start], novoice: true };
}
