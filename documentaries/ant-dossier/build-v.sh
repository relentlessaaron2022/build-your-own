#!/bin/sh
# 9:16 vertical cut (?fmt=v): same page, same mixed audio as build.sh (run build.sh first) → the-ant-kingdom-dossier-9x16.mp4
set -e
LIB=/root/lemo-opuscar
HERE=$(cd "$(dirname "$0")" && pwd); cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --q fmt=v --out "$HERE/out/video-v.mp4"
sh /home/user/build-your-own/github-report/ep07/master.sh "$HERE/out/video-v.mp4" "$HERE/out/audio.wav" "$HERE/out/master-v.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/master-v.mp4" -c:v libx264 -preset slow -crf 25 -tune animation -c:a copy -movflags +faststart "$HERE/the-ant-kingdom-dossier-9x16.mp4"
