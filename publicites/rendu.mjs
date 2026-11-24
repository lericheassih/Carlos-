// Rendu image par image d'un concept → MP4 (H.264). Usage :
//   node rendu.mjs c1 1920 [--stills 1,5,12] [--audio audio/mix-c1.wav] [--out export/x.mp4]
import { createRequire } from "node:module";
import { spawn, execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(execSync("npm root -g").toString().trim() + "/playwright")); }
const [c, h = "1920", ...rest] = process.argv.slice(2);
const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const DIR = path.dirname(new URL(import.meta.url).pathname);
const FPS = 30, W = 1080, H = +h;
const caps = JSON.parse(readFileSync(`${DIR}/audio/sous-titres-${c}.json`, "utf8"));
const b = await chromium.launch({ args: ["--disable-web-security", "--allow-file-access-from-files"] });
const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("ERREUR PAGE:", e.message));
await page.goto(`file://${DIR}/page.html?c=${c}&h=${H}`);
await page.evaluate((x) => (window.R.caps = x), caps);
const { dur, fmt } = await page.evaluate(() => window.ready());
const stills = opt("--stills");
if (stills) {
  mkdirSync(`${DIR}/apercus`, { recursive: true });
  for (const s of stills.split(",")) {
    await page.evaluate((t) => window.render(t), +s);
    await page.screenshot({ path: `${DIR}/apercus/${c}-${fmt}-${s}.jpg`, type: "jpeg", quality: 85 });
  }
  console.log("aperçus OK"); await b.close(); process.exit(0);
}
const out = opt("--out") || `${DIR}/export/${c}-${fmt}.mp4`;
const audio = opt("--audio");
const N = Math.round(dur * FPS);
const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-"];
if (audio) args.push("-i", audio);
args.push("-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), "-profile:v", "high", "-level", "4.1");
if (audio) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest");
args.push("-movflags", "+faststart", out);
const ff = spawn("ffmpeg", args, { stdio: ["pipe", "ignore", "inherit"] });
const t0 = Date.now();
for (let f = 0; f < N; f++) {
  await page.evaluate((t) => window.render(t), f / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 150 === 0) console.log(`${c} ${fmt} ${f}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await b.close();
console.log("OK", out, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
