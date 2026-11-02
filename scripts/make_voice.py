"""Génère voix{n}.wav + timeline{n}.json avec Kokoro (voix fr ff_siwis), hors ligne."""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, sys.argv[2]); from scripts_vo import VIDEOS
from kokoro_onnx import Kokoro
D, OUT = sys.argv[1], sys.argv[3]
k = Kokoro(f"{D}/kokoro-v1.0.onnx", f"{D}/voices-v1.0.bin")
SR = 24000
def trim(a, th=0.01):
    idx = np.where(np.abs(a) > th)[0]
    return a[max(idx[0]-240,0): idx[-1]+1200] if len(idx) else a
for n, v in VIDEOS.items():
    t, audio, tl = 0.35, [np.zeros(int(0.35*SR))], []
    prev = None
    for b in v["blocks"]:
        kind, disp, say = b[0], b[1], (b[2] or b[1])
        gap = 0.0 if prev is None else (0.18 if kind == prev == "ben" else 0.4)
        if gap: audio.append(np.zeros(int(gap*SR))); t += gap
        s, sr = k.create(say, voice="ff_siwis", speed=v["speed"], lang="fr-fr")
        s = trim(s.astype(np.float32)); d = len(s)/SR
        audio.append(s); tl.append(dict(kind=kind, text=disp, start=round(t,3), end=round(t+d,3))); t += d; prev = kind
    a = np.concatenate(audio); a = a/np.max(np.abs(a))*0.89
    sf.write(f"{OUT}/voix{n}.wav", a, SR)
    json.dump(tl, open(f"{OUT}/timeline{n}.json","w"), ensure_ascii=False, indent=1)
    print(n, round(t,2), [(x['kind'], x['start'], x['end']) for x in tl])
