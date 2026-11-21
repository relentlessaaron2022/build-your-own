#!/bin/sh
# Conducting the Eagles: a seamless 12 s loop, vertical (9:16) and square (1:1). Silent: add music in CapCut.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd /root/lemo-opuscar
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-3} --q fmt=v --size 1080x1920 --out "$HERE/out/v.mp4"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-3} --q fmt=s --size 1080x1080 --out "$HERE/out/s.mp4"
for F in v s; do ffmpeg -v error -y -i "$HERE/out/$F.mp4" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$HERE/out/$F-enc.mp4"; done
mv "$HERE/out/v-enc.mp4" "$HERE/conducting-the-eagles-9x16.mp4"; mv "$HERE/out/s-enc.mp4" "$HERE/conducting-the-eagles-1x1.mp4"
# a 36 s version (three loops) for Reels/Shorts
ffmpeg -v error -y -stream_loop 2 -i "$HERE/conducting-the-eagles-9x16.mp4" -c copy "$HERE/conducting-the-eagles-9x16-36s.mp4"
