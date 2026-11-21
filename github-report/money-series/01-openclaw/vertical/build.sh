#!/bin/sh
# The GitHub Report, Money Series 01, vertical 9:16 cut.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/audio/voice.wav" -af "adelay=300:all=1,apad=pad_dur=3" -ar 48000 "$HERE/out/audio.wav"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/out/master.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 23 -tune grain -c:a copy -movflags +faststart "$HERE/../money-01-openclaw-9x16.mp4"
