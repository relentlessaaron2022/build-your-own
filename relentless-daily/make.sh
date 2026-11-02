#!/bin/sh
# make.sh <episode-slug> [size]   →  episodes/<slug>/<slug>.mp4  (default 1080x1920; pass 1920x1080 for a 16:9 cut)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; export LIB
EP="$HERE/episodes/$1"; SIZE=${2:-1080x1920}; [ -f "$EP/episode.json" ] || { echo "no episode.json in $EP"; exit 1; }
cd "$LIB"
.venv/bin/python "$HERE/tools/prepare.py" "$EP"
node core/render/events.mjs "$HERE" --size $SIZE --q "ep=$1" --out "$EP/events.json"
.venv/bin/python "$HERE/tools/mix.py" "$EP"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size $SIZE --q "ep=$1" --out "$EP/out/video.mp4"
SUF=$( [ "$SIZE" = "1080x1920" ] && echo "" || echo "-$SIZE" )
sh "$HERE/master.sh" "$EP/out/video.mp4" "$EP/mix.wav" "$EP/$1$SUF.mp4" 30 3
