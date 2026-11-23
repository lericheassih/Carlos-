"""Synthèse des voix off (Kokoro, voix française ff_siwis, hors ligne) + chronologie des phrases.
Usage : python3 lumo/scripts/make_voice.py   ->  lumo/build/voix{n}.wav + lumo/build/timeline{n}.json"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from voix_off import VIDEOS
from kokoro_onnx import Kokoro

M = os.path.join(ROOT, "assets", "models"); B = os.path.join(ROOT, "build"); os.makedirs(B, exist_ok=True)
SR = 24000
LEAD = 0.40                       # silence avant la première phrase (le hook visuel démarre à 0)
GAP_SAME, GAP_SECTION = 0.34, 1.0


def trim(a, th=0.008):
    i = np.where(np.abs(a) > th)[0]
    return a[max(i[0] - 200, 0): i[-1] + 1600] if len(i) else a


def polish(a):
    """Léger traitement « studio » : passe-haut 80 Hz, présence +2 dB vers 3 kHz, compression douce."""
    a = sosfilt(butter(2, 80, "hp", fs=SR, output="sos"), a)
    pres = sosfilt(butter(2, [2200, 4500], "bp", fs=SR, output="sos"), a)
    a = a + 0.25 * pres
    env = np.sqrt(np.convolve(a ** 2, np.ones(480) / 480, "same")) + 1e-6
    g = np.minimum(1.0, (env / 0.12) ** -0.35)  # compression ~ 1.5:1 au-dessus du seuil
    return a * g


def main(only=None):
    k = Kokoro(os.path.join(M, "kokoro-v1.0.onnx"), os.path.join(M, "voices-v1.0.bin"))
    for n, v in VIDEOS.items():
        if only and n not in only:
            continue
        t, chunks, tl, prev = LEAD, [np.zeros(int(LEAD * SR))], [], None
        for sec, disp, say in v["phrases"]:
            if prev is not None:
                g = GAP_SAME if sec == prev else GAP_SECTION
                chunks.append(np.zeros(int(g * SR))); t += g
            s, _ = k.create(say or disp, voice="ff_siwis", speed=v["speed"], lang="fr-fr")
            s = trim(s.astype(np.float32)); d = len(s) / SR
            chunks.append(s); tl.append(dict(section=sec, text=disp, start=round(t, 3), end=round(t + d, 3)))
            t += d; prev = sec
        a = polish(np.concatenate(chunks)); a = a / np.max(np.abs(a)) * 0.9
        sf.write(os.path.join(B, f"voix{n}.wav"), a.astype(np.float32), SR)
        json.dump(dict(duration=round(t, 3), phrases=tl), open(os.path.join(B, f"timeline{n}.json"), "w"),
                  ensure_ascii=False, indent=1)
        print(f"vidéo {n}: voix {t:.1f} s")
        for x in tl:
            print(f"   {x['start']:6.2f}-{x['end']:6.2f}  {x['section']:9s} {x['text']}")


if __name__ == "__main__":
    main([int(x) for x in sys.argv[1:]] or None)
