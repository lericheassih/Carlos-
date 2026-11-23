#!/bin/bash
# Version de diffusion Meta : H.264 ≤ 10 Mb/s, son normalisé à -14 LUFS. Remplace export/*.mp4 (les masters partent dans masters/).
cd "$(dirname "$0")"
mkdir -p masters
for f in export/c?-*.mp4; do
  b=$(basename "$f")
  [ -f "masters/$b" ] || mv "$f" "masters/$b"
  ffmpeg -y -v error -i "masters/$b" -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -profile:v high -level 4.1 \
    -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "export/$b"
  echo "$b $(du -h export/$b | cut -f1)"
done
