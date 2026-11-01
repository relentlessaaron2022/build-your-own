#!/bin/sh
# Relentless Times · Anthropic IPO (vertical): narration → events → mix (no music) → frames → master.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; export LIB
cd "$LIB"
[ -f "$HERE/vo/dur.json" ] || .venv/bin/python core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$HERE/events_ipo.json"
.venv/bin/python "$HERE/mix.py" ipo
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/mix_ipo.wav" "$HERE/relentless-times-anthropic-ipo.mp4" 30 0
