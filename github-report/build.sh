#!/bin/sh
# The GitHub Report, Ep. 01: frames from the board, the voiceover as recorded, mastered to -14 LUFS.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/audio/ep01.mp3" "$HERE/github-report-ep01.mp4" 30 0
