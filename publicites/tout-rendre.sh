#!/bin/bash
# Rend les 4 concepts en 9:16 (1080x1920) et 4:5 (1080x1350) avec leur bande-son.
cd "$(dirname "$0")"
set -e
for c in c1 c2 c3 c4; do
  for h in 1920 1350; do
    node rendu.mjs $c $h --audio audio/mix-$c.wav
  done
done
echo TERMINE
