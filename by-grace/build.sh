#!/bin/sh
# Render both films: ./build.sh  (silent 1920x1080 30 fps; the songs go underneath in your editor)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/root/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
for f in ${FILMS:-mosaic window}; do
  [ -f "$HERE/$f/paper.jpg" ] || "$LIB/.venv/bin/python" "$HERE/paper.py" "$HERE/$f/paper.jpg"
  node core/render/video.mjs "$HERE/$f" --fps 30 --workers ${WORKERS:-4} --out "$HERE/$f/out/video.mp4"
  ffmpeg -v error -y -i "$HERE/$f/out/video.mp4" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart "$HERE/by-grace-$f.mp4"
  ffmpeg -v error -y -ss 160 -i "$HERE/by-grace-$f.mp4" -frames:v 1 -q:v 2 "$HERE/poster-$f.jpg"
done
