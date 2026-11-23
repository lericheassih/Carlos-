"""Bande sonore originale (synthèse procédurale) + effets sonores + mixage avec la voix off.
Usage : python3 lumo/scripts/music.py <n>   (lit build/plan{n}.json et build/voix{n}.wav)
Sortie : build/mix{n}.wav (48 kHz stéréo) — musique duckée sous la voix, impacts et whooshs calés sur les plans."""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); B = os.path.join(ROOT, "build")
SR = 48000
rng = np.random.default_rng(7)

NOTE = {n: i for i, n in enumerate("C C# D D# E F F# G G# A A# B".split())}


def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


def chord(spec):
    """'D3 F#3 A3 D4' -> fréquences"""
    out = []
    for s in spec.split():
        out.append(hz(s[:-1], int(s[-1])))
    return out


# ------------------------------------------------------------------ styles par vidéo
STYLES = {
    1: dict(bpm=92, prog=["D2|D3 F#3 A3 E4", "B1|B2 D3 F#3 A3", "G1|G2 B2 D3 F#3", "A1|A2 C#3 E3 B3"],
            arp=[0, 2, 3, 1, 2, 3, 1, 3], bright=1.0),
    2: dict(bpm=70, prog=["D#2|D#3 G3 A#3 D4", "C2|C3 D#3 G3 A#3", "G#1|G#2 C3 D#3 G3", "A#1|A#2 D3 F3 C4"],
            arp=[0, 1, 2, 3, 2, 1, 3, 2], bright=0.8),
    3: dict(bpm=98, prog=["A1|A2 C3 E3 B3", "F1|F2 A2 C3 E3", "C2|C3 E3 G3 D4", "G1|G2 B2 D3 A3"],
            arp=[0, 3, 1, 3, 2, 3, 1, 3], bright=1.1),
}
# niveau de chaque couche par section (pad, piano, basse, pulsation, cordes aiguës)
LEVELS = {
    "hook":      (0.55, 0.35, 0.0, 0.0, 0.0),
    "probleme":  (0.60, 0.70, 0.25, 0.0, 0.0),
    "solution":  (0.70, 0.80, 0.65, 0.55, 0.15),
    "confiance": (0.85, 0.85, 0.85, 0.80, 0.55),
    "cta":       (0.75, 0.70, 0.70, 0.45, 0.40),
    "fin":       (0.60, 0.30, 0.40, 0.00, 0.30),
}


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lp", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "hp", fs=SR, output="sos"), x)


def saw(f, n, detune=0.0, harmonics=24):
    t = np.arange(n) / SR; x = np.zeros(n)
    ff = f * (1 + detune)
    for k in range(1, harmonics + 1):
        if ff * k > 16000: break
        x += np.sin(2 * np.pi * ff * k * t + rng.uniform(0, 6.28)) / k
    return x


def env_adsr(n, a, r):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[-nr:] *= np.linspace(1, 0, nr) ** 1.2
    return e


def piano(f, dur, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, amp in enumerate([1, .5, .28, .16, .09, .05, .03], 1):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        x += amp * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.6 + 0.9 * k))
    x += 0.02 * lp(rng.standard_normal(n), 3000) * np.exp(-t * 60)  # marteau
    x *= np.minimum(1, t / 0.004)
    return x * vel


def kick(n=int(0.5 * SR)):
    t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def impact(dur=3.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    noise = lp(rng.standard_normal(n), 1800) * np.exp(-t * 5) * 0.35
    return np.tanh(1.6 * (boom + noise)) * 0.9


def riser(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n); seg = 2400
    for i in range(0, n, seg):  # balayage passe-bande ascendant
        fc = 400 + 7000 * (i / n) ** 2
        out[i:i + seg] = sosfilt(butter(2, [fc * 0.7, min(fc * 1.4, 20000)], "bp", fs=SR, output="sos"), x[i:i + seg])
    return out * (t / dur) ** 2.2 * 0.5


def whoosh(dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n); seg = 1200
    for i in range(0, n, seg):
        p = i / n; fc = 300 + 3500 * np.sin(np.pi * p)
        out[i:i + seg] = sosfilt(butter(2, [fc * 0.6, fc * 1.6], "bp", fs=SR, output="sos"), x[i:i + seg])
    return out * np.sin(np.pi * t / dur) ** 2 * 0.55


def shimmer(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in (2093, 2637, 3136, 4186):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * 2.2) * rng.uniform(.5, 1)
    return x * 0.12 * np.minimum(1, t / 0.01)


def reverb_ir(sec=2.8):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-t * 6.9 / sec)[:, None]
    ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1)
    return ir / np.sqrt((ir ** 2).sum(0))


def place(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        buf[i:i + len(x), 0] += x * gain * l * 1.41; buf[i:i + len(x), 1] += x * gain * r * 1.41
    else:
        buf[i:i + len(x)] += x * gain


def section_curve(plan, total, idx):
    """courbe lissée du niveau d'une couche selon les sections"""
    n = int(total * SR); c = np.zeros(n)
    secs = plan["sections"]
    for k, s in enumerate(secs):
        a = int(s["start"] * SR); b = int((secs[k + 1]["start"] if k + 1 < len(secs) else total) * SR)
        c[a:b] = LEVELS[s["name"]][idx]
    w = int(1.2 * SR); ker = np.ones(w) / w
    return np.convolve(np.concatenate([np.full(w, c[0]), c, np.full(w, c[-1])]), ker, "same")[w:w + n]


def compose(n_vid, plan):
    st = STYLES[n_vid]; total = plan["duration"]; N = int(total * SR)
    beat = 60 / st["bpm"]; bar = 4 * beat
    music = np.zeros((N, 2))
    lay = [section_curve(plan, total, i) for i in range(5)]
    end_t = plan["music_end"]              # accord final tenu à partir d'ici
    t, k = 0.0, 0
    while t < total:
        bass_s, notes_s = st["prog"][k % 4].split("|")
        bf = chord(bass_s)[0]; notes = chord(notes_s)
        L = min(bar, total - t); nn = int(L * SR)
        if t >= end_t:  # accord final (tonique) qui sonne jusqu'au bout
            bass_s, notes_s = st["prog"][0].split("|"); bf = chord(bass_s)[0]; notes = chord(notes_s)
            L = total - t; nn = int(L * SR)
        i0 = int(t * SR); seg = slice(i0, i0 + nn)
        # pad (scies désaccordées filtrées, stéréo)
        e = env_adsr(nn, min(1.2, L / 3), min(1.0, L / 3))
        for j, f in enumerate(notes):
            for side, det in ((0, -0.004), (1, 0.004)):
                x = lp(saw(f, nn, det, 14), 900 * st["bright"] + 300 * j) * e
                music[seg, side] += x * 0.05 * lay[0][seg]
        # cordes aiguës (octave supérieure, douce)
        for f in notes[1:]:
            x = lp(saw(f * 2, nn, 0.002, 10), 2600) * e
            music[seg, 0] += x * 0.025 * lay[4][seg]; music[seg, 1] += x * 0.025 * lay[4][seg]
        # basse
        tb = np.arange(nn) / SR
        b = (np.sin(2 * np.pi * bf * tb) + 0.3 * np.sin(4 * np.pi * bf * tb)) * env_adsr(nn, 0.05, 0.4)
        music[seg] += (np.tanh(1.5 * b) * 0.12 * lay[2][seg])[:, None]
        if t < end_t:
            # piano en arpèges (croches)
            for s8 in range(8):
                ts = t + s8 * beat / 2
                if ts >= min(total, end_t): break
                f = notes[st["arp"][s8] % len(notes)] * 2
                g = 0.10 * lay[1][min(int(ts * SR), N - 1)] * (1.0 if s8 % 2 == 0 else 0.7)
                place(music, piano(f, 2.2), ts, g, pan=0.35 * np.sin(s8))
            # pulsation (kick doux + charleston)
            for q in range(4):
                tq = t + q * beat
                if tq >= end_t: break
                g = lay[3][min(int(tq * SR), N - 1)]
                if g > 0.02:
                    place(music, kick(), tq, 0.30 * g)
                    hat = hp(rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90)
                    place(music, hat, tq + beat / 2, 0.05 * g, pan=0.3)
        t += L; k += 1
        if t >= end_t and L != bar and t >= total: break
    # réverbération
    ir = reverb_ir()
    wet = np.stack([fftconvolve(music[:, 0], ir[:, 0])[:N], fftconvolve(music[:, 1], ir[:, 1])[:N]], 1)
    music = 0.75 * music + 0.45 * wet
    # fondu d'entrée/sortie
    music[: int(0.25 * SR)] *= np.linspace(0, 1, int(0.25 * SR))[:, None]
    fo = int(1.2 * SR); music[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    return music


def sfx_track(plan):
    N = int(plan["duration"] * SR); fx = np.zeros((N, 2)); ir = reverb_ir(2.0)
    for ev in plan["sfx"]:
        kind, t = ev["type"], ev["t"]
        if kind == "impact":
            place(fx, impact(), t, 0.55)
        elif kind == "riser":
            r = riser(ev.get("dur", 1.5)); place(fx, r, t - len(r) / SR, 0.30)
        elif kind == "whoosh":
            place(fx, whoosh(ev.get("dur", 0.8)), t - 0.4, 0.22, pan=ev.get("pan", 0))
        elif kind == "shimmer":
            place(fx, shimmer(), t, 0.5)
        elif kind == "tick":
            n = int(0.03 * SR); x = hp(rng.standard_normal(n), 3000) * np.exp(-np.arange(n) / SR * 200)
            place(fx, x, t, 0.10)
        elif kind == "pop":
            n = int(0.12 * SR); tt = np.arange(n) / SR
            x = np.sin(2 * np.pi * (900 + 600 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 35)
            place(fx, x, t, 0.12)
    wet = np.stack([fftconvolve(fx[:, 0], ir[:, 0])[:N], fftconvolve(fx[:, 1], ir[:, 1])[:N]], 1)
    return fx + 0.3 * wet


def main_motion(n):
    """version motion design : pas de voix, la musique porte le film."""
    plan = json.load(open(os.path.join(B, f"planmd{n}.json")))
    music = compose(n, plan); fx = sfx_track(plan)
    mix = music * 0.9 + fx * 0.8
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.95
    sf.write(os.path.join(B, f"mixmd{n}.wav"), mix.astype(np.float32), SR)
    print(f"mixmd{n}.wav {plan['duration']:.1f} s")


def main(n):
    plan = json.load(open(os.path.join(B, f"plan{n}.json")))
    total = plan["duration"]; N = int(total * SR)
    v, vsr = sf.read(os.path.join(B, f"voix{n}.wav"))
    v = resample_poly(v, SR, vsr)[:N]; v = np.pad(v, (0, N - len(v)))
    music = compose(n, plan); fx = sfx_track(plan)
    # ducking : la musique baisse d'environ 9 dB sous la voix (attaque rapide, relâchement doux)
    env = np.sqrt(np.convolve(v ** 2, np.ones(1200) / 1200, "same"))
    act = (env > 0.02).astype(float)
    att, rel = int(0.06 * SR), int(0.45 * SR)
    sm = np.convolve(act, np.ones(att) / att, "same"); sm = np.maximum.accumulate if False else sm
    duck = np.zeros(N); cur = 0.0
    a_c, r_c = 1 / att, 1 / rel
    for i in range(0, N, 240):  # résolution 5 ms
        target = sm[i]
        cur += (target - cur) * (min(1, a_c * 240) if target > cur else min(1, r_c * 240))
        duck[i:i + 240] = cur
    gain = 1 - 0.65 * duck
    music *= gain[:, None] * 0.62
    vv = np.stack([v, v], 1) * 0.95
    sp = env > 0.02
    rv = np.sqrt((vv[sp] ** 2).mean()); rm = np.sqrt((music[sp] ** 2).mean()); rm2 = np.sqrt((music[~sp] ** 2).mean())
    print(f"  voix {20*np.log10(rv):.1f} dBFS | musique sous la voix {20*np.log10(rm):.1f} dBFS ({20*np.log10(rm/rv):.1f} dB) | hors voix {20*np.log10(rm2):.1f}")
    mix = music * 1.0 + fx + vv
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.95
    sf.write(os.path.join(B, f"mix{n}.wav"), mix.astype(np.float32), SR)
    sf.write(os.path.join(B, f"musique{n}.wav"), (music / max(1e-6, np.max(np.abs(music))) * 0.9).astype(np.float32), SR)
    print(f"mix{n}.wav {total:.1f} s")


if __name__ == "__main__":
    (main_motion if len(sys.argv) > 2 and sys.argv[2] == "motion" else main)(int(sys.argv[1]))
