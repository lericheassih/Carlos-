#!/bin/bash
# Normalise l'audio d'un export (-14 LUFS) sans réencoder la vidéo
f=$1; tmp=${f%.mp4}.tmp.mp4
ffmpeg -v error -y -i "$f" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 128k -movflags +faststart "$tmp" && mv "$tmp" "$f"
