"""Montage des 3 pubs Meta Ads (9:16 + 4:5), vignettes et textes.
Usage : python3 scripts/build.py [1 2 3]
Prérequis : build/voix{n}.wav + build/timeline{n}.json (scripts/make_voice.py)."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R, B, E = (os.path.join(ROOT, d) for d in ("rushes", "build", "export"))
os.makedirs(B, exist_ok=True); os.makedirs(E, exist_ok=True)
FONT = "/usr/share/fonts/opentype/montserrat/Montserrat-%s.otf"
def F(w, s): return ImageFont.truetype(FONT % w, s)

BLUE, BLUE2, LIGHT = (13, 59, 140), (47, 111, 214), (176, 208, 255)
FPS = 30
# HDR (HLG iPhone) -> SDR + étalonnage léger (plus lumineux, plus chaud)
GRADE = ("zscale=t=linear:npl=200,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,"
         "zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
         "eq=brightness=0.015:contrast=1.03:saturation=1.12,colorbalance=rm=0.03:bm=-0.03")

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)

# ---------------------------------------------------------------- plans
# (rush, début dans le rush, durée prévue) — mis à l'échelle sur la durée utile
SHOTS = {
 1: [("3046", 0.0, 3.0), ("3038", 1.0, 2.5), ("3038", 10.5, 2.5), ("3042", 0.0, 2.5), ("3044", 5.0, 2.5),
     ("3041", 4.0, 2.5), ("3049", 0.0, 2.5), ("3050", 0.0, 3.0), ("3045", 12.0, 3.0), ("3038", 13.5, 3.0)],
 2: [("3045", 0.5, 2.5), ("3045", 8.5, 2.5), ("3046", 3.0, 2.5), ("3049", 0.0, 2.5), ("3049", 3.5, 2.0),
     ("3039", 0.0, 2.5), ("3048", 0.0, 2.0), ("3047", 4.5, 2.0), ("3043", 0.0, 2.0), ("3038", 12.5, 3.5),
     ("3050", 0.0, 2.9)],
 3: [("3038", 0.0, 1.2), ("3045", 5.5, 1.2), ("3042", 0.5, 1.2), ("3041", 5.0, 1.2), ("3046", 1.0, 1.2),
     ("3044", 1.5, 1.2), ("3045", 13.0, 1.2), ("3048", 0.5, 1.2), ("3043", 0.5, 1.2), ("3038", 8.0, 1.2),
     ("3039", 2.0, 1.2), ("3049", 0.5, 1.2), ("3045", 2.0, 1.2), ("3044", 6.0, 1.2), ("3041", 1.0, 1.2),
     ("3046", 6.5, 1.2), ("3042", 5.0, 1.2), ("3050", 0.5, 1.2), ("3038", 14.5, 1.5), ("3045", 14.5, 1.5),
     ("3047", 5.0, 1.4), ("3045", 3.0, 1.0)],
}
FADE = {1: 0.3, 2: 0.4, 3: 0.0}
ENDCARD_BG = {1: ("3038", 2.0), 2: ("3045", 1.5), 3: ("3045", 6.0)}
DUR = {}
def dur(rush):
    if rush not in DUR:
        DUR[rush] = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "csv=p=0", f"{R}/IMG_{rush}.mov"]))
    return DUR[rush]

# --------------------------------------------------------- textes à l'écran
LABELS = {  # (bloc de voix, fraction début, fraction fin, texte)
 1: [(2, 0, .5, "Wifi rapide  •  Espace de travail"), (2, .5, 1, "Climatisation dans chaque chambre"),
     (3, 0, 1, "Sécurité 24h/24\nGroupe électrogène  •  Parking")],
 2: [(1, .35, 1, "Grand salon & table familiale"), (2, 0, 1, "Cuisine tout équipée"),
     (3, 0, 1, "Chambres climatisées  •  Eau chaude"), (4, 0, 1, "Libre, comme à la maison")],
 3: [(1, 0, .25, "Salon design"), (1, .25, .5, "Lumières d'ambiance"), (1, .5, .75, "Chambres élégantes"),
     (1, .75, 1, "Douche à l'italienne"), (2, 0, .5, "Propre  •  Moderne"), (2, .5, 1, "Climatisé  •  Wifi inclus"),
     (3, 0, 1, "Week-end à deux"), (4, 0, 1, "1 nuit, 2 nuits ou plus")],
}
RECAP_SUB = {1: "Tout équipé  •  Wifi  •  Clim", 2: "Salon  •  Cuisine  •  Chambres", 3: "Pourquoi payer plus ?"}

def layout(fmt):
    if fmt == "9x16":
        return dict(W=1080, H=1920, price_y=300, label_y=330, sub_cy=1345, sub_size=60, end_top=330, end_gap=1.0)
    return dict(W=1080, H=1350, price_y=110, label_y=130, sub_cy=1070, sub_size=54, end_top=150, end_gap=0.78)

def rrect(d, box, r, fill, outline=None, width=0):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)

def text_w(f, s): return f.getbbox(s)[2] - f.getbbox(s)[0]

def pin(d, cx, cy, s, col):
    d.ellipse([cx - s/2, cy - s, cx + s/2, cy], fill=col)
    d.polygon([(cx - s*0.42, cy - s*0.35), (cx + s*0.42, cy - s*0.35), (cx, cy + s*0.45)], fill=col)
    d.ellipse([cx - s*0.18, cy - s*0.68, cx + s*0.18, cy - s*0.32], fill=(255, 255, 255))

def price_banner(L, inverse=False, y=None, extra=None):
    """Bandeau prix blanc/bleu (inverse=True : fond bleu, texte blanc)."""
    W = L["W"]; im = Image.new("RGBA", (W, L["H"]), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    big, small, loc = F("ExtraBold", 98), F("Bold", 54), F("SemiBold", 44)
    t1, t2 = "65 000 FCFA", " / nuit"
    w1, w2 = text_w(big, t1), text_w(small, t2)
    bw = max(w1 + w2, 600) + 100; bh = 236 + (78 if extra else 0)
    x0, y0 = (W - bw) // 2, (L["price_y"] if y is None else y)
    bg, c1, c2, c3 = ((13, 59, 140, 232), (255, 255, 255), LIGHT, (225, 236, 255)) if inverse else \
                     ((255, 255, 255, 228), BLUE, BLUE2, (60, 84, 130))
    # ombre douce
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle(
        [x0, y0 + 10, x0 + bw, y0 + bh + 10], 38, fill=(0, 0, 0, 70)); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    rrect(d, [x0, y0, x0 + bw, y0 + bh], 38, bg)
    rrect(d, [x0 + 40, y0 + 22, x0 + 120, y0 + 30], 4, c2 + (255,))  # petit trait d'accent
    tx = (W - w1 - w2) // 2; by = y0 + 40
    d.text((tx, by), t1, font=big, fill=c1)
    asc_big = big.getbbox(t1)[3]; d.text((tx + w1, by + asc_big - small.getbbox(t2)[3]), t2, font=small, fill=c2)
    ly = y0 + 166; lt = "Totsi, Lomé"; lw = text_w(loc, lt) + 50; lx = (W - lw) // 2
    pin(d, lx + 18, ly + 38, 34, c2); d.text((lx + 50, ly), lt, font=loc, fill=c3)
    if extra:
        ef = F("Bold", 44); ew = text_w(ef, extra)
        d.line([x0 + 60, y0 + 240, x0 + bw - 60, y0 + 240], fill=c2 + (90,), width=2)
        d.text(((W - ew) // 2, y0 + 256), extra, font=ef, fill=c1)
    return im

def label_pill(L, text, inverse=False):
    W = L["W"]; im = Image.new("RGBA", (W, L["H"]), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = F("Bold", 50); lines = text.split("\n")
    w = max(text_w(f, l) for l in lines) + 150; h = 40 + 66 * len(lines)
    x0, y0 = (W - w) // 2, L["label_y"]
    bg, fg = ((13, 59, 140, 225), (255, 255, 255)) if inverse else ((255, 255, 255, 225), BLUE)
    rrect(d, [x0, y0, x0 + w, y0 + h], h // 2 if len(lines) == 1 else 34, bg)
    d.ellipse([x0 + 34, y0 + h/2 - 9, x0 + 52, y0 + h/2 + 9], fill=BLUE2 if not inverse else LIGHT)
    for i, l in enumerate(lines):
        d.text(((W - text_w(f, l)) // 2 + 14, y0 + 18 + 66 * i), l, font=f, fill=fg)
    return im

NB = "\u00a0"
def protect(t):
    """Espaces insécables : « 65 000 », numéro, espace avant : ? !"""
    import re
    t = t.replace("65 000", f"65{NB}000").replace("70 39 05 05", NB.join("70 39 05 05".split()))
    return re.sub(r" ([:?!;])", NB + r"\1", t)

def wrap(f, text, maxw):
    lines, cur = [], ""
    for w in text.split(" "):
        t = (cur + " " + w).strip(" ")
        if text_w(f, t) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]

def balance(f, text, maxw=900):
    """1 ligne si elle tient, sinon 2 lignes de largeurs équilibrées."""
    if text_w(f, text) <= maxw: return [text]
    w = text.split(" "); best = None
    for i in range(1, len(w)):
        a, b = " ".join(w[:i]), " ".join(w[i:]); m = max(text_w(f, a), text_w(f, b))
        if best is None or m < best[0]: best = (m, [a, b])
    return best[1]

def sub_chunks(L, text):
    """Sous-titres de 2 lignes max, coupés sur la ponctuation, sans mot orphelin."""
    import re, math
    f = F("Bold", L["sub_size"]); text = protect(text)
    phrases = [p for p in re.split(r"(?<=[,:?.!;])(?<!\u00a0[:?!;]) +|(?<=\u00a0[:?!;]) +", text) if p]
    chunks, cur = [], ""
    for p in phrases:
        t = (cur + " " + p).strip()
        if len(wrap(f, t, 900)) <= 2 or len(cur) < 16 or len(p) < 12: cur = t
        else: chunks.append(cur); cur = p
    chunks.append(cur)
    out = []
    for c in chunks:
        ls = wrap(f, c, 900)
        if len(ls) <= 2: out.append(balance(f, c)); continue
        k = math.ceil(len(ls) / 2); words = c.split(" "); tot = len(c); grp, acc, g = [], 0, []
        for w in words:
            g.append(w); acc += len(w) + 1
            if acc >= tot * (len(grp) + 1) / k and len(grp) < k - 1: grp.append(" ".join(g)); g = []
        grp.append(" ".join(g)); out += [balance(f, x) for x in grp if x]
    return out

def sub_img(L, lines):
    W = L["W"]; im = Image.new("RGBA", (W, L["H"]), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = F("Bold", L["sub_size"]); lh = int(L["sub_size"] * 1.28)
    y = L["sub_cy"] - lh * len(lines) // 2
    for l in lines:
        d.text(((W - text_w(f, l)) // 2, y), l, font=f, fill="white", stroke_width=6, stroke_fill="black"); y += lh
    return im

def wa_icon(size):
    s = size * 4; im = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, s, s], fill=(37, 211, 102))
    c, r, w = s / 2, s * 0.29, int(s * 0.05)
    d.ellipse([c - r, c - r, c + r, c + r], outline="white", width=w)
    d.polygon([(c - r * 0.92, c + r * 0.45), (c - r * 1.12, c + r * 1.12), (c - r * 0.45, c + r * 0.92)], fill="white")
    d.ellipse([c - r + w, c - r + w, c + r - w, c + r - w], fill=(37, 211, 102))
    d.polygon([(c - r * 0.80, c + r * 0.45), (c - r * 0.97, c + r * 0.97), (c - r * 0.45, c + r * 0.80)], fill=(37, 211, 102))
    # combiné téléphonique (glyphe U+1F4DE de FreeSerif)
    g = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSerif.ttf", int(s * 0.62))
    ph = Image.new("RGBA", (s, s), (0, 0, 0, 0)); pd = ImageDraw.Draw(ph); bb = pd.textbbox((0, 0), "\U0001F4DE", font=g)
    pd.text((c - (bb[0] + bb[2]) / 2, c - (bb[1] + bb[3]) / 2), "\U0001F4DE", font=g, fill="white")
    im.alpha_composite(ph.rotate(8, resample=Image.BICUBIC, center=(c, c)))
    return im.resize((size, size), Image.LANCZOS)

def end_card(L):
    W, H = L["W"], L["H"]; g = L["end_gap"]
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    y = L["end_top"]
    ic = wa_icon(int(170 * (0.85 if g < 1 else 1))); im.alpha_composite(ic, ((W - ic.width) // 2, y)); y += ic.height + int(40 * g)
    f1 = F("Bold", 48); t = "Écrivez-nous sur WhatsApp"; d.text(((W - text_w(f1, t)) // 2, y), t, font=f1, fill="white"); y += int(80 * g)
    f2 = F("ExtraBold", 96); t = "+228 70 39 05 05"; d.text(((W - text_w(f2, t)) // 2, y), t, font=f2, fill="white"); y += int(150 * g)
    pb = price_banner(L, y=y).crop((0, y, W, y + 260)); im.alpha_composite(pb, (0, y)); y += 250 + int(55 * g)
    f3 = F("Bold", 54); t = "Réservez avec vos dates"; tw = text_w(f3, t)
    rrect(d, [(W - tw) // 2 - 50, y, (W + tw) // 2 + 50, y + 96], 48, (37, 211, 102, 255))
    d.text(((W - tw) // 2, y + 16), t, font=f3, fill="white")
    return im

# ------------------------------------------------------------------ build
def build(n):
    tl = json.load(open(f"{B}/timeline{n}.json"))
    T = round(tl[-1]["end"] + 0.7, 2); END = 3.5; t_end = T - END
    work = f"{B}/v{n}"; os.makedirs(work, exist_ok=True)
    # 1) plans étalonnés + stabilisés, mis à l'échelle sur [0, t_end]
    shots = SHOTS[n]; fd = FADE[n]; tot = sum(s[2] for s in shots); k = t_end / tot
    durs = [round(s[2] * k, 3) for s in shots]
    clips, cut_times, acc = [], [], 0.0
    for i, ((rush, ss, _), D) in enumerate(zip(shots, durs)):
        L = D + fd  # chaque plan déborde de la durée du fondu
        ss = max(0, min(ss, dur(rush) - L - 0.05)); avail = dur(rush) - ss
        slow = f"setpts=PTS*{(L + 0.15) / avail:.4f}," if avail < L + 0.1 else ""  # rush trop court : léger ralenti
        out = f"{work}/s{i:02d}.mp4"
        if not os.path.exists(out): run(["ffmpeg", "-y", "-v", "error", "-ss", f"{ss}", "-i", f"{R}/IMG_{rush}.mov", "-an",
             "-vf", f"{slow}{GRADE},deshake=rx=32:ry=32,scale=1124:2000,crop=1080:1920,fps={FPS},tpad=stop_mode=clone:stop_duration=1,trim=0:{L:.3f},setpts=PTS-STARTPTS,setsar=1",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", out])
        clips.append((out, L)); cut_times.append(round(acc, 2)); acc += D
    # écran final : fond flouté et assombri
    rush, ss = ENDCARD_BG[n]; ec = f"{work}/end.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{ss}", "-i", f"{R}/IMG_{rush}.mov", "-frames:v", "1",
         "-vf", f"{GRADE},scale=1080:1920,gblur=sigma=28,eq=brightness=-0.16:saturation=0.9", f"{work}/end.png"])
    run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-t", f"{END + fd + 0.2}", "-i", f"{work}/end.png", "-vf", f"fps={FPS},format=yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", ec])
    clips.append((ec, END + fd + 0.2))
    # 2) assemblage (fondus courts ou coupes franches)
    base = f"{work}/base.mp4"; inp = []
    for c, _ in clips: inp += ["-i", c]
    if fd > 0:
        fc, prev, off = [], "[0:v]", 0.0
        for i in range(1, len(clips)):
            off += durs[i - 1] if i - 1 < len(durs) else 0
            lab = f"[x{i}]"; fc.append(f"{prev}[{i}:v]xfade=transition=fade:duration={fd}:offset={off:.3f}{lab}"); prev = lab
        fc = ";".join(fc) + f";{prev}trim=0:{T},setpts=PTS-STARTPTS[v]"
    else:
        fc = "".join(f"[{i}:v]trim=0:{(durs + [END + 0.2])[i]},setpts=PTS-STARTPTS[c{i}];" for i in range(len(clips)))
        fc += "".join(f"[c{i}]" for i in range(len(clips))) + f"concat=n={len(clips)}:v=1:a=0,trim=0:{T}[v]"
    if not os.path.exists(base): run(["ffmpeg", "-y", "-v", "error"] + inp + ["-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "16", "-r", str(FPS), base])

    # 3) habillage par format
    blocks = {i: b for i, b in enumerate(tl)}
    price_blk = next(b for b in tl if b["kind"] == "price")
    names = {1: "video1_pro", 2: "video2_diaspora", 3: "video3_escapade"}
    for fmt in ("9x16", "4x5"):
        Lo = layout(fmt); ov = []  # (png, t0, t1)
        def add(img, t0, t1, tag):
            p = f"{work}/{fmt}_{tag}.png"; img.save(p); ov.append((p, round(t0, 2), round(t1, 2)))
        inv = n == 3
        add(price_banner(Lo, inverse=inv), 0, 5.6, "price")
        for j, (bi, a, b, txt) in enumerate(LABELS[n]):
            bl = blocks[bi]; t0 = bl["start"] + a * (bl["end"] - bl["start"]); t1 = bl["start"] + b * (bl["end"] - bl["start"]) + (0.25 if b == 1 else 0)
            t0 = max(t0, 5.75)
            if t1 - t0 > 0.6: add(label_pill(Lo, txt, inverse=inv), t0, min(t1, price_blk["start"] - 0.05), f"lab{j}")
        add(price_banner(Lo, inverse=inv, extra=RECAP_SUB[n]), price_blk["start"], t_end + 0.05, "recap")
        add(end_card(Lo), t_end + 0.1, T, "end")
        srt = []
        for bi, bl in enumerate(tl):
            ch = sub_chunks(Lo, bl["text"]); total = sum(len(" ".join(c)) for c in ch); t = bl["start"]
            for ci, c in enumerate(ch):
                d_ = (bl["end"] - bl["start"]) * len(" ".join(c)) / total
                add(sub_img(Lo, c), t, t + d_ + (0.12 if ci == len(ch) - 1 else 0), f"sub{bi}_{ci}"); srt.append((t, t + d_, "\n".join(c))); t += d_
        # filtre overlay
        inp = ["-i", base, "-i", f"{B}/voix{n}.wav"]
        for p, _, _ in ov: inp += ["-loop", "1", "-framerate", str(FPS), "-t", f"{T}", "-i", p]
        vf = "[0:v]" + ("crop=1080:1350:0:285," if fmt == "4x5" else "") + "null[b0]"
        for j, (p, t0, t1) in enumerate(ov):
            fade = "" if p.endswith("_end.png") or "_sub" in p or t0 < 0.1 else f",fade=t=in:st={t0}:d=0.2:alpha=1"
            vf += f";[{j + 2}:v]format=rgba{fade}[o{j}];[b{j}][o{j}]overlay=0:0:enable='between(t,{t0},{t1})'[b{j + 1}]"
        af = f"[1:a]apad,atrim=0:{T},loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st={T - 0.4}:d=0.4,aresample=48000[a]"
        out = f"{E}/{names[n]}_{fmt}.mp4"
        run(["ffmpeg", "-y", "-v", "error"] + inp + ["-filter_complex", vf + ";" + af, "-map", f"[b{len(ov)}]", "-map", "[a]",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", f"{T}", out])
        if fmt == "9x16":
            with open(f"{work}/sous_titres.srt", "w") as fh:
                for i, (a, b, s) in enumerate(srt, 1):
                    ts = lambda x: f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int(x*1000%1000):03d}"
                    fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n{s}\n\n")
        print(f"OK {out} ({T}s) — coupes : {cut_times}")
    return T

THUMB = {1: ("3046", 1.0, "En mission à Lomé ?"), 2: ("3045", 1.5, "Les fêtes au pays,\ncomme chez vous"), 3: ("3045", 6.0, "Escapade à deux")}
def thumbnail(n):
    rush, ss, title = THUMB[n]; p = f"{B}/thumb_raw{n}.png"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{ss}", "-i", f"{R}/IMG_{rush}.mov", "-frames:v", "1", "-vf", f"{GRADE},scale=1080:1920", p])
    L = layout("9x16"); im = Image.open(p).convert("RGBA")
    im.alpha_composite(price_banner(L, inverse=(n == 3)))
    d = ImageDraw.Draw(im); f = F("ExtraBold", 76); y = 1240
    for l in title.split("\n"):
        d.text(((1080 - text_w(f, l)) // 2, y), l, font=f, fill="white", stroke_width=7, stroke_fill=(10, 30, 70)); y += 96
    im.convert("RGB").save(f"{E}/thumbnail{n}.jpg", quality=92)

if __name__ == "__main__":
    for n in [int(a) for a in sys.argv[1:]] or [1, 2, 3]:
        build(n); thumbnail(n)
