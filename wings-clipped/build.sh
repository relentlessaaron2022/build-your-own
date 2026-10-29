#!/bin/sh
# Rebuild "Her Wings Were Clipped": sh build.sh  (needs vo_full.wav = the original recording as 48 kHz WAV; LIB = Lemo-Opuscar)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
"$LIB/.venv/bin/python" "$HERE/cut_vo.py"
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/events.mjs "$HERE" --size 1080x1920
.venv/bin/python "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/her-wings-were-clipped.mp4" 30 0
