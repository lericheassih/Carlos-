#!/bin/bash
# Extrait les images de vérification (0, 1, 2.5, 4, 5 s puis toutes les 3 s) et en fait une planche
f=$1; out=$2; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)
tmp=$(mktemp -d); i=0
for t in 0 1 2.5 4 5 $(seq 8 3 $(printf %.0f $d)) $(echo "$d-0.2"|bc); do
  ffmpeg -v error -y -ss $t -i $f -frames:v 1 -vf "scale=270:-2,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='t=$t':fontsize=18:fontcolor=yellow:box=1:boxcolor=black:x=4:y=4" $tmp/$(printf %02d $i).png; i=$((i+1))
done
ffmpeg -v error -y -pattern_type glob -i "$tmp/*.png" -vf "tile=8x2:padding=4" -frames:v 1 $out; rm -r $tmp
echo "$f : durée ${d}s"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate -of compact=p=0 $f
