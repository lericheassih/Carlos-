#!/bin/bash
# Version « motion design pur » : sans voix off, sans photo. 3 publicités × (9:16 + 16:9).
set -e
cd "$(dirname "$0")/.."
for n in ${VIDS:-1 2 3}; do
  CUT=motion node scripts/render.mjs plan $n
  python3 scripts/music.py $n motion
  CUT=motion node scripts/render.mjs video $n v
  CUT=motion node scripts/render.mjs video $n h
done
ls -la export/
