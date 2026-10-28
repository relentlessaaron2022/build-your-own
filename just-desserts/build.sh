#!/bin/sh
# Rebuild "Just Desserts": sh build.sh   (LIB = Lemo-Opuscar library with deps voice + vsco2ce/vcsl samples)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
cd "$LIB"
.venv/bin/python core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
.venv/bin/python core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en
node core/render/readcheck.mjs "$HERE"
node core/render/events.mjs "$HERE"
.venv/bin/python "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --out "$HERE/out/video.mp4"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/just-desserts.mp4" 30 0
.venv/bin/python core/render/srt.py "$HERE/cues.json" "$HERE/just-desserts.srt"
