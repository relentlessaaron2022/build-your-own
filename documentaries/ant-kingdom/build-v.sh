#!/bin/sh
# The Ant Kingdom, vertical 9:16 (same narration and sound as the 16:9 film)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd /root/lemo-opuscar; mkdir -p "$HERE/out"
[ -f "$HERE/out/audio.wav" ] || { echo "run build.sh first (it makes out/audio.wav)"; exit 1; }
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --q fmt=v --size 1080x1920 --out "$HERE/out/video-v.mp4"
sh /home/user/build-your-own/github-report/ep07/master.sh "$HERE/out/video-v.mp4" "$HERE/out/audio.wav" "$HERE/out/master-v.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/master-v.mp4" -vf hqdn3d=1.5:1.5:6:6 -c:v libx264 -preset slow -crf 26 -tune film -c:a copy -movflags +faststart "$HERE/the-ant-kingdom-9x16.mp4"
