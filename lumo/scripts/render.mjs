// Rendu image par image d'une publicité LUMO dans Chromium (Playwright), puis encodage ffmpeg.
// Usage :
//   node lumo/scripts/render.mjs plan <n>                 -> build/plan<n>.json (pour la musique)
//   node lumo/scripts/render.mjs stills <n> <v|h> t1,t2  -> build/stills/<n><fmt>_<t>.jpg
//   node lumo/scripts/render.mjs video <n> <v|h>         -> export/LUMO_V<n>_<9x16|16x9>.mp4 (nécessite build/mix<n>.wav)
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { spawnSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const B = path.join(ROOT, 'build'), X = path.join(ROOT, 'export');
fs.mkdirSync(B, { recursive: true }); fs.mkdirSync(X, { recursive: true });
const { buildStoryboard } = await import(pathToFileURL(path.join(ROOT, 'web', 'storyboards.mjs')));
const FPS = 30;
const [mode, nStr, fmt = 'v', arg] = process.argv.slice(2); const n = +nStr;

const MD = process.env.CUT === 'motion';   // version motion design pur (sans voix, sans photo)
const PFX = MD ? 'md' : '';
const tl = MD ? null : JSON.parse(fs.readFileSync(path.join(B, `timeline${n}.json`)));
const imgMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'img', 'images.json')));
const IMG = {}; for (const k in imgMap) if (!k.startsWith('_')) IMG[k] = pathToFileURL(path.join(ROOT, 'assets', 'img', imgMap[k].file)).href;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json')));
if (cfg.logo) cfg.logo = pathToFileURL(path.join(ROOT, cfg.logo)).href;
const { buildMotion } = await import(pathToFileURL(path.join(ROOT, 'web', 'motion_sb.mjs')));
const sb = MD ? buildMotion(n, fmt) : buildStoryboard(n, fmt, tl, IMG);

if (mode === 'plan') {
  const { scenes, ...rest } = sb;
  fs.writeFileSync(path.join(B, `plan${PFX}${n}.json`), JSON.stringify({ ...rest, scenes: scenes.map(s => ({ type: s.type, start: s.start })) }, null, 1));
  console.log(`plan${PFX}${n}.json  durée ${sb.duration}s`); process.exit(0);
}

const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1920 : 1080;
const dots = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'world_dots.json')));

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('ERREUR PAGE:', e.message));
  await page.goto(pathToFileURL(path.join(ROOT, 'web', 'index.html')).href);
  await page.evaluate(async ([sb, fmt, cfg, dots]) => {
    await document.fonts.load('600 40px Poppins'); await document.fonts.load('500 40px Poppins'); await document.fonts.load('400 40px Poppins'); await document.fonts.load('700 40px Poppins');
    const srcs = new Set(); sb.scenes.forEach(s => { if (s.img) srcs.add(s.img); (s.items || []).forEach(i => i.img && srcs.add(i.img)); });
    if (cfg.logo) srcs.add(cfg.logo);
    await Promise.all([...srcs].map(u => new Promise(r => { const i = new Image(); i.onload = () => i.decode().then(r, r); i.onerror = () => { console.error('image', u); r(); }; i.src = u; })));
    window.LUMO.init(sb, fmt, cfg, dots); await document.fonts.ready;
  }, [sb, fmt, cfg, dots]);
  return page;
}
async function shot(page, t, file) {
  await page.evaluate(t => window.LUMO.renderFrame(t), t);
  await page.screenshot({ path: file, type: 'jpeg', quality: 94 });
}

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
const tag = `${PFX}${n}${fmt}`;
if (mode === 'stills') {
  const dir = path.join(B, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const page = await openPage(browser);
  for (const t of arg.split(',').map(Number)) { await shot(page, t, path.join(dir, `${tag}_${t.toFixed(2)}.jpg`)); }
  console.log('stills ok');
} else if (mode === 'video') {
  const frames = Math.round(sb.duration * FPS), dir = path.join(B, `frames_${tag}`);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const NW = +(process.env.WORKERS || 4); const t0 = Date.now();
  await Promise.all([...Array(NW).keys()].map(async w => {
    const page = await openPage(browser);
    for (let f = w; f < frames; f += NW) {
      await shot(page, f / FPS, path.join(dir, String(f).padStart(5, '0') + '.jpg'));
      if (w === 0 && f % 120 === 0) console.log(`  ${tag} ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  await browser.close();
  const out = path.join(X, `LUMO_${MD ? 'MOTION_' : ''}V${n}_${fmt === 'v' ? '9x16' : '16x9'}.mp4`);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-i', path.join(B, `mix${PFX}${n}.wav`),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '10M', '-bufsize', '20M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status) process.exit(1);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('OK', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close().catch(() => {});
