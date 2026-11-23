#!/bin/bash
# Production complète des 6 vidéos LUMO IMMOBILIER (3 publicités × 9:16 et 16:9).
# Prérequis : pip install kokoro-onnx soundfile scipy ; modèles Kokoro dans assets/models (voir PRODUCTION.md).
set -e
cd "$(dirname "$0")/.."
VIDS=${VIDS:-"1 2 3"}
[ -f build/timeline1.json ] && [ -z "$REVOIX" ] || python3 scripts/make_voice.py
for n in $VIDS; do
  node scripts/render.mjs plan $n
  python3 scripts/music.py $n
  node scripts/render.mjs video $n v
  node scripts/render.mjs video $n h
done
ls -la export/
