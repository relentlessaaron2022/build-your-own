#!/bin/sh
# One-command rebuild of Keep the Lights On, Ep. 1 (needs the Lemo-Opuscar library: sh <skill>/scripts/setup.sh deps)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
OUT=${OUT:-$HERE/out}; mkdir -p "$OUT"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920                       # timeline → events.json
"$LIB/.venv/bin/python" "$HERE/music/score.py"                              # original score → music/score.wav (needs: fetch.sh instruments vcsl karoryfer vsco2ce)
"$LIB/.venv/bin/python" "$HERE/mix.py"                                      # foley + score + optical ageing → mix.wav
node core/render/readcheck.mjs "$HERE" --size 1080x1920                     # title cards stay up long enough to read
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$OUT/video.mp4"
sh "$HERE/master.sh" "$OUT/video.mp4" "$HERE/mix.wav" "$HERE/keep-the-lights-on-ep1.mp4" 24 3
