"""Voix off française (Kokoro, voix ff_siwis, hors ligne) + horodatage des sous-titres.
Usage : python3 voix.py <dossier_modele_kokoro> <sortie>"""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, OUT = sys.argv[1], sys.argv[2]
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
SR = 24000
def trim(a, th=0.008):
    i = np.where(np.abs(a) > th)[0]
    return a[max(i[0] - 200, 0): i[-1] + 900] if len(i) else a
cfg = json.load(open(sys.argv[3] if len(sys.argv) > 3 else "voix.json"))
for c, v in cfg.items():
    total = 46.0
    track = np.zeros(int(total * SR), np.float32)
    caps = []
    for i, (start, shown, said) in enumerate(v["lines"]):
        s, _ = k.create(said, voice="ff_siwis", speed=v["speed"], lang="fr-fr")
        s = trim(s.astype(np.float32))
        d = len(s) / SR
        nxt = v["lines"][i + 1][0] if i + 1 < len(v["lines"]) else total
        flag = "  <-- DÉBORDE" if start + d > nxt - 0.1 else ""
        print(f"{c} {start:5.2f}+{d:4.2f}={start+d:5.2f} (suivante {nxt:5.2f}){flag}  {shown}")
        a = int(start * SR); track[a:a + len(s)] += s
        caps.append({"start": round(start, 2), "end": round(start + d, 2), "text": shown})
    track /= max(1e-6, np.abs(track).max()); track *= 0.9
    sf.write(f"{OUT}/voix-{c}.wav", track, SR)
    json.dump(caps, open(f"{OUT}/sous-titres-{c}.json", "w"), ensure_ascii=False, indent=1)
