#!/bin/sh
# The GitHub Report, Ep. 02: the board (1920x1080) over the voiceover, with a 2.2 s title sting before the first word.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/audio/ep02.mp3" -af "adelay=2200:all=1,apad=pad_dur=4" -ar 48000 "$HERE/out/audio.wav"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/github-report-ep02.mp4" 30 0
