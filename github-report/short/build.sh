#!/bin/sh
# The GitHub Report · Ep. 01 Short (9:16): host video + board, voice fades under the end card.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/source.mp4" -vn -af "afade=t=out:st=57.2:d=2.6" -ar 48000 "$HERE/out/audio.wav"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/github-report-ep01-short.mp4" 30 0
