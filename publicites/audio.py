"""Bande-son des publicités LUMO : musique composée par programme + sound design calé sur l'image + voix off.
numpy uniquement. Usage : python3 audio.py c1 [c2 ...]   → audio/mix-cX.wav (48 kHz stéréo)"""
import sys, json, numpy as np, soundfile as sf

SR = 48000
rng = np.random.default_rng(7)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def t_(d): return np.arange(int(d * SR)) / SR
def env_adsr(n, a=0.01, r=0.2):
    e = np.ones(n); A = max(1, int(a * SR)); Rr = max(1, int(r * SR))
    e[:A] = np.linspace(0, 1, A); e[-Rr:] *= np.linspace(1, 0, Rr); return e

def piano(m, d, vel=0.5):
    f = mtof(m); t = t_(d + 1.2)
    s = sum((1 / k ** 1.4) * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k)) * np.exp(-t * (1.1 + 0.9 * k)) for k in range(1, 7))
    return s * vel * env_adsr(len(t), 0.004, 0.3)
def pad(m, d, vel=0.25):
    f = mtof(m); t = t_(d)
    s = np.zeros_like(t)
    for det in (-0.0045, 0, 0.0045):
        s += sum((1 / k) * np.sin(2 * np.pi * f * (1 + det) * k * t + k) for k in range(1, 6))
    s *= 1 + 0.15 * np.sin(2 * np.pi * 0.25 * t)
    return s / 6 * vel * env_adsr(len(t), min(1.2, d / 3), min(1.2, d / 3))
def pluck(m, d=0.6, vel=0.5, bright=1.0):
    f = mtof(m); t = t_(d)
    s = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 5 * k / bright)) for k in range(1, 8))
    return s * vel * env_adsr(len(t), 0.002, 0.05)
def marimba(m, d=0.7, vel=0.5):
    f = mtof(m); t = t_(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.4 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22) + 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)
    return s * vel * env_adsr(len(t), 0.002, 0.05)
def bass(m, d, vel=0.5):
    f = mtof(m); t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return np.tanh(s * 1.3) * vel * env_adsr(len(t), 0.008, 0.06)
def kick(vel=0.9):
    t = t_(0.45); f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.15 * rng.standard_normal(len(t)) * np.exp(-t * 120)) * vel
def hat(vel=0.25, d=0.05):
    t = t_(d); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0); n = np.diff(n, prepend=0)
    return n / 4 * np.exp(-t * 70) * vel
def clap(vel=0.4):
    t = t_(0.25); n = rng.standard_normal(len(t)); n = n - np.convolve(n, np.ones(8) / 8, "same")
    e = np.exp(-t * 18) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 60) * (t > 0.012) + 0.4 * np.exp(-np.maximum(0, t - 0.024) * 60) * (t > 0.024)
    return n * e * vel
def noise_band(d, lo, hi):
    n = rng.standard_normal(int(d * SR)); F = np.fft.rfft(n); fr = np.fft.rfftfreq(len(n), 1 / SR)
    F[(fr < lo) | (fr > hi)] = 0; return np.fft.irfft(F, len(n))
def whoosh(d=0.7, vel=0.35, up=True):
    n = len(t_(d)); out = np.zeros(n); chunks = 24; L = n // chunks + 1
    for i in range(chunks):
        x = i / (chunks - 1); c = 300 + (2600 if up else 1800) * (x if up else 1 - x)
        seg = noise_band(L / SR + 0.02, c * 0.6, c * 1.6)[:L]
        a, b = i * L, min(n, (i + 1) * L); out[a:b] += seg[: b - a] * np.hanning(L)[: b - a]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return out / (np.abs(out).max() + 1e-9) * e * vel
def riser(d=1.5, vel=0.3):
    t = t_(d); x = t / d
    s = noise_band(d, 800, 9000) / 3 * x ** 2 + 0.3 * np.sin(2 * np.pi * np.cumsum(200 + 1400 * x ** 2) / SR) * x ** 2
    return s * vel
def impact(vel=0.8):
    t = t_(2.2); s = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 9)) * t) * np.exp(-t * 2.2)
    s += noise_band(2.2, 40, 900) / 4 * np.exp(-t * 6)
    return np.tanh(s * 1.5) * vel
def chime(m, vel=0.25, d=1.8):
    f = mtof(m); t = t_(d)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.5) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)) * vel
def click(vel=0.25):
    t = t_(0.03); return (noise_band(0.03, 1500, 8000) * np.exp(-t * 300) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 400)) * vel
def keytap(vel=0.12):
    t = t_(0.04); return noise_band(0.04, 2000, 9000) * np.exp(-t * 220) * vel
def tick(vel=0.25):
    t = t_(0.06); return (np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 160) + noise_band(0.06, 3000, 9000) * np.exp(-t * 400) * 0.3) * vel
def pop(vel=0.3):
    t = t_(0.15); f = 300 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * vel

class Bus:
    def __init__(self, dur): self.l = np.zeros(int(dur * SR) + SR * 3); self.r = np.zeros_like(self.l)
    def add(self, at, s, pan=0.0, gain=1.0):
        a = int(at * SR)
        if a < 0: s = s[-a:]; a = 0
        b = min(len(self.l), a + len(s)); s = s[: b - a] * gain
        self.l[a:b] += s * np.sqrt(0.5 * (1 - pan)); self.r[a:b] += s * np.sqrt(0.5 * (1 + pan))
    def st(self): return np.stack([self.l, self.r], 1)

def reverb(x, secs=2.4, wet=0.28, damp=3.2):
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * damp); ir[: int(0.012 * SR)] = 0
        ir = np.convolve(ir, np.ones(6) / 6, "same"); ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(len(x) + n)))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = y
    return x * (1 - wet) + out * wet

def chords_play(bus, start, end, bpm, prog, beats_per_chord, inst):
    beat = 60 / bpm; t = start; i = 0
    while t < end - 0.01:
        ch = prog[i % len(prog)]; d = min(beats_per_chord * beat, end - t)
        inst(bus, t, ch, d, i); t += beats_per_chord * beat; i += 1

# ------------------------------------------------------------------ concepts
def c1(D):
    mus, sfx = Bus(D), Bus(D); bpm = 72; beat = 60 / bpm
    prog = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 60, 64], [46, 50, 53, 57]]   # Fmaj7 Am7 Dm9 Bbmaj7
    def inst(b, t, ch, d, i):
        b.add(t, pad(ch[0] - 12, d + 0.8, 0.22), -0.2); b.add(t, pad(ch[2], d + 0.8, 0.12), 0.3)
        if t >= 3.2:
            arp = ch[1:] + [ch[0] + 12]
            for k in range(8):
                tt = t + k * beat / 2
                if tt < D - 1.5 and tt < t + d: b.add(tt, piano(arp[k % len(arp)] + 12, 0.6, 0.16 + 0.05 * (k == 0)), -0.3 + 0.6 * (k % 2))
        if t >= 25.0: b.add(t, bass(ch[0] - 24, d, 0.28))
    chords_play(mus, 0, D - 1.0, bpm, prog, 8, inst)
    for t in np.arange(25.0, 35.0, beat * 2): mus.add(t, kick(0.35))
    mus.add(D - 6.5, pad(53, 6.5, 0.25)); mus.add(D - 6.5, pad(60, 6.5, 0.15)); mus.add(D - 6.5, piano(65, 4, 0.3)); mus.add(D - 6.5, piano(72, 4, 0.2))
    sfx.add(0.1, impact(0.45)); sfx.add(0.25, whoosh(1.6, 0.25))
    for t in [3.35, 6.15, 9.15, 12.55, 25.15, 28.55, 31.85]: sfx.add(t - 0.35, whoosh(0.9, 0.22), pan=0.3)
    for i in range(5): sfx.add(12.6 + 1.1 + i * 0.85, chime([84, 86, 88, 89, 91][i], 0.12), pan=-0.3 + 0.15 * i)
    sfx.add(33.8, riser(1.5, 0.22)); sfx.add(35.3, impact(0.55)); sfx.add(35.3, chime(77, 0.18, 3))
    sfx.add(37.4, chime(89, 0.14)); sfx.add(38.3, pop(0.25))
    return mus, sfx, 0.92

def c2(D):
    mus, sfx = Bus(D), Bus(D); bpm = 124; beat = 60 / bpm
    prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
    def inst(b, t, ch, d, i):
        if t >= 3.3:
            for k in range(int(d / (beat / 2) + 0.5)):
                b.add(t + k * beat / 2, bass(ch[0] - 24 + (12 if k % 4 == 3 else 0), beat / 2 * 0.9, 0.42))
            for k in range(8):
                if k in (0, 3, 6, 7): b.add(t + k * beat / 2, pluck(ch[k % 3] + 12, 0.35, 0.18, 1.4), -0.4 + 0.8 * (k % 2))
        b.add(t, pad(ch[0], d, 0.12 if t < 3.3 else 0.16), 0.2)
    chords_play(mus, 0, D - 1.2, bpm, prog, 4, inst)
    t = 3.35
    while t < 30.6:
        mus.add(t, kick(0.85)); mus.add(t + beat / 2, hat(0.15))
        if int(round((t - 3.35) / beat)) % 2 == 1: mus.add(t, clap(0.28))
        t += beat
    t = 30.9
    while t < D - 1.4: mus.add(t, kick(0.9)); mus.add(t + beat / 2, hat(0.25)); t += beat
    for i in range(7): sfx.add(i * beat, whoosh(0.3, 0.16, up=False), pan=(-1) ** i * 0.4)
    for at in [0.02, beat * 2, beat * 4, beat * 5.6]: sfx.add(at, impact(0.5)); sfx.add(at, clap(0.35))
    sfx.add(2.4, riser(0.95, 0.3))
    for i in range(4): sfx.add(3.45 + i * beat, whoosh(0.4, 0.18), pan=(-1) ** i * 0.5); sfx.add(3.65 + i * beat, tick(0.12))
    sfx.add(7.3, impact(0.4)); sfx.add(7.3, chime(88, 0.12))
    for i in range(4): sfx.add(12.45 + i * beat * 2, impact(0.32)); sfx.add(12.5 + i * beat * 2, pop(0.22))
    for i in range(5): sfx.add(18.7 + i * beat, tick(0.14))
    for i in range(6): sfx.add(24.8 + i * beat * 2 - 0.14, whoosh(0.32, 0.2), pan=0.4)
    sfx.add(27.15, impact(0.5)); sfx.add(29.9, riser(1.0, 0.32)); sfx.add(30.9, impact(0.75))
    sfx.add(34.5, click(0.4)); sfx.add(34.55, pop(0.3))
    mus.add(D - 1.6, pad(57, 1.6, 0.2)); mus.add(D - 1.6, kick(0.7))
    return mus, sfx, 0.7

def c3(D):
    mus, sfx = Bus(D), Bus(D); bpm = 96; beat = 60 / bpm
    prog = [[50, 53, 57, 64], [46, 50, 53, 57], [43, 46, 50, 57], [45, 50, 52, 55]]   # Dm9 Bbmaj7 Gm9 Asus
    def inst(b, t, ch, d, i):
        b.add(t, pad(ch[0], d + 0.6, 0.2), -0.25); b.add(t, pad(ch[3], d + 0.6, 0.1), 0.35)
        if t >= 4.4:
            for k in range(int(d / beat + 0.5)): b.add(t + k * beat, bass(ch[0] - 24, beat * 0.5, 0.3))
        if t >= 12.6:
            for k in range(8):
                if k % 3 == 0: b.add(t + k * beat / 2, pluck(ch[(k // 3) % 4] + 12, 0.5, 0.1, 0.8), 0.4 * (-1) ** k)
    chords_play(mus, 2.2, D - 1.0, bpm, prog, 8, inst)
    t = 4.4
    while t < 34.8:
        mus.add(t, kick(0.38)); mus.add(t + beat / 2, hat(0.1, 0.03)); t += beat
    for s in range(3): sfx.add(0.25 + s * 0.4, tick(0.22))
    for i in range(22): sfx.add(1.5 + i * 0.077, keytap(0.07))
    sfx.add(2.2, impact(0.55)); sfx.add(2.2, whoosh(1.8, 0.2))
    for t in [4.45, 4.7, 4.95]: sfx.add(t, whoosh(0.8, 0.14), pan=0.5)
    for i in range(6): sfx.add(12.7 + 0.9 + i * 0.75, chime(86 + (i % 3) * 2, 0.07, 1.2), pan=0.3)
    for t in [25.2, 28.5, 31.7]: sfx.add(t - 0.3, whoosh(1.0, 0.13))
    sfx.add(33.7, riser(1.4, 0.18)); sfx.add(35.1, impact(0.5)); sfx.add(37.8, chime(81, 0.16, 2.5)); sfx.add(37.85, chime(88, 0.1, 2.5))
    mus.add(D - 5.5, pad(50, 5.5, 0.2)); mus.add(D - 5.5, pad(57, 5.5, 0.12))
    return mus, sfx, 0.6

def c4(D):
    mus, sfx = Bus(D), Bus(D); bpm = 108; beat = 60 / bpm
    prog = [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]]   # C G Am F
    def inst(b, t, ch, d, i):
        b.add(t, pad(ch[0], d, 0.1), 0.2)
        for k in range(8):
            if t + k * beat / 2 < D - 1.3: b.add(t + k * beat / 2, marimba(ch[[0, 2, 1, 2, 0, 2, 1, 2][k]] + 12 + (12 if k == 7 else 0), 0.5, 0.16), -0.35 + 0.7 * (k % 2))
        if t >= 4.4:
            for k in range(4): b.add(t + k * beat, bass(ch[0] - 24, beat * 0.6, 0.32))
    chords_play(mus, 0.0, D - 1.2, bpm, prog, 4, inst)
    t = 4.4
    while t < D - 1.3:
        mus.add(t, kick(0.5)); mus.add(t + beat / 2, hat(0.14))
        if int(round((t - 4.4) / beat)) % 2 == 1: mus.add(t, clap(0.2))
        t += beat
    sfx.add(0.05, pop(0.4)); sfx.add(0.08, impact(0.35))
    for i in range(4): sfx.add(0.6 + i * 0.12, tick(0.1))
    sfx.add(3.6, whoosh(0.9, 0.24))
    for at in [8.6, 12.3, 14.4, 24.75]: sfx.add(at, click(0.35))
    for at in [9.3, 13.2, 16.3, 22.4]: sfx.add(at - 0.05, whoosh(0.45, 0.12), pan=0.4)
    for i in range(3): sfx.add(4.4 + 3.3 + i * 0.35, pop(0.2))
    sfx.add(12.8 + 3.4, pop(0.28)); sfx.add(12.8 + 3.4, chime(84, 0.1))
    for i in range(36): sfx.add(22.9 + i * 0.047, keytap(0.06 + 0.03 * (i % 3 == 0)))
    sfx.add(25.0, whoosh(0.35, 0.18)); sfx.add(25.05, pop(0.2))
    sfx.add(26.8, chime(84, 0.18, 1.2)); sfx.add(26.95, chime(91, 0.14, 1.2))
    sfx.add(29.9, riser(1.0, 0.2)); sfx.add(30.9, impact(0.5)); sfx.add(32.8, pop(0.25))
    mus.add(D - 1.4, pad(48, 1.4, 0.18))
    return mus, sfx, 0.74

def tuto(D, bpm, prog, taps, swipes, pops, marks, typing=None, cta=0.0):
    """Famille sonore du concept 4 : marimba, basse, kick léger, clics d'interface."""
    mus, sfx = Bus(D), Bus(D); beat = 60 / bpm
    def inst(b, t, ch, d, i):
        b.add(t, pad(ch[0], d, 0.1), 0.2)
        for k in range(8):
            if t + k * beat / 2 < D - 1.3: b.add(t + k * beat / 2, marimba(ch[[0, 2, 1, 2, 0, 2, 1, 2][k]] + 12 + (12 if k == 7 else 0), 0.5, 0.15), -0.35 + 0.7 * (k % 2))
        if t >= 3.6:
            for k in range(4): b.add(t + k * beat, bass(ch[0] - 24, beat * 0.6, 0.3))
    chords_play(mus, 0.0, D - 1.2, bpm, prog, 4, inst)
    t = 3.6
    while t < D - 1.3:
        mus.add(t, kick(0.45)); mus.add(t + beat / 2, hat(0.12))
        if int(round((t - 3.6) / beat)) % 2 == 1: mus.add(t, clap(0.18))
        t += beat
    sfx.add(0.05, pop(0.4)); sfx.add(0.08, impact(0.3))
    for i in range(5): sfx.add(1.2 + i * 0.12, tick(0.1))
    for at in taps: sfx.add(at, click(0.35))
    for at in swipes: sfx.add(at - 0.05, whoosh(0.45, 0.12), pan=0.4)
    for at in pops: sfx.add(at, pop(0.2))
    for at in marks: sfx.add(at, chime(88, 0.06, 0.8))
    sfx.add(cta - 1.0, riser(1.0, 0.2)); sfx.add(cta, impact(0.5)); sfx.add(cta + 2.0, pop(0.25))
    mus.add(D - 1.4, pad(48, 1.4, 0.18))
    return mus, sfx, 0.72

def c5(D):
    return tuto(D, 104, [[53, 57, 60], [48, 52, 55], [50, 53, 57], [55, 59, 62]],   # F C Dm G
        taps=[8.3, 26.8, 34.4], swipes=[6.6, 8.7, 10.7, 14.1, 17.1, 23.3, 25.3, 27.2, 29.5],
        pops=[4.6, 7.6, 8.1, 8.6, 11.7, 12.1, 12.5, 17.1, 18.7, 20.1, 23.3, 25.5, 27.2, 29.5, 32.0, 33.5, 34.1],
        marks=[14.6, 19.9, 32.0, 33.5], cta=35.7)

def c6(D):
    return tuto(D, 108, [[48, 52, 55], [57, 60, 64], [53, 57, 60], [55, 59, 62]],   # C Am F G
        taps=[6.8, 12.1, 15.75, 19.1, 21.4, 25.0, 28.6, 29.2, 35.1, 36.5],
        swipes=[7.4, 12.7, 17.5, 19.6, 20.6, 23.3, 25.6, 27.7, 29.9, 35.5, 36.9],
        pops=[3.7, 7.7, 13.0, 15.5, 17.6, 19.6, 21.5, 23.4, 27.8, 32.6, 33.5, 35.0, 37.0],
        marks=[4.6, 8.2, 9.3, 10.1, 11.1, 13.4, 15.3, 18.2, 24.0, 26.1, 28.2, 30.4, 33.2, 34.4, 37.3], cta=39.3)

DUR = {"c1": 42.5, "c2": 36.6, "c3": 41.0, "c4": 37.6, "c5": 41.8, "c6": 45.4}
FN = {"c1": c1, "c2": c2, "c3": c3, "c4": c4, "c5": c5, "c6": c6}

for c in sys.argv[1:]:
    D = DUR[c]
    mus, sfx, mlev = FN[c](D)
    m = reverb(mus.st(), wet=0.3 if c in ("c1", "c3") else 0.18)
    s = reverb(sfx.st(), secs=1.6, wet=0.2)
    vo, vsr = sf.read(f"audio/voix-{c}.wav")
    vo = np.interp(np.arange(int(len(vo) * SR / vsr)) / SR, np.arange(len(vo)) / vsr, vo)
    n = int(D * SR)
    def fit(x): y = np.zeros((n, 2)); k = min(n, len(x)); y[:k] = x[:k]; return y
    m, s = fit(m), fit(s)
    v = np.zeros(n); k = min(n, len(vo)); v[:k] = vo[:k]
    # sidechain : la musique baisse quand la voix parle
    a = np.abs(v); w = int(0.12 * SR); envv = np.convolve(a, np.ones(w) / w, "same")
    duck = 1 - 0.55 * np.clip(envv / 0.06, 0, 1)
    sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
    m /= np.abs(m).max() + 1e-9; s /= np.abs(s).max() + 1e-9
    mix = m * (mlev * 0.55) * duck[:, None] + s * 0.5 + np.stack([v, v], 1) * 0.95
    fade = int(0.8 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]; mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    rms = np.sqrt((mix ** 2).mean()); mix *= 10 ** (-15 / 20) / (rms + 1e-9)
    mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix *= 0.97 / max(1.0, np.abs(mix).max())
    sf.write(f"audio/mix-{c}.wav", mix.astype(np.float32), SR, subtype="PCM_24")
    print(c, "ok", round(20 * np.log10(np.sqrt((mix ** 2).mean())), 1), "dBFS RMS")
