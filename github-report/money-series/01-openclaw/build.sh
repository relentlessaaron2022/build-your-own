#!/bin/sh
# The GitHub Report, Money Series 01: the board (1920x1080) over the voiceover, the avatar host opens on the studio.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/audio/voice.wav" -af "adelay=1000:all=1,apad=pad_dur=4" -ar 48000 "$HERE/out/audio.wav"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/out/master.mp4" 30 0
# the paper texture is hard to compress: re-encode under GitHub's 100 MB limit
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 25 -tune grain -c:a copy -movflags +faststart "$HERE/money-01-openclaw-16x9.mp4"
# split into two halves for CapCut only when the full episode is over 100 MB
if [ "$(stat -c %s "$HERE/money-01-openclaw-16x9.mp4")" -gt 100000000 ]; then
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$HERE/money-01-openclaw-16x9.mp4")
  ffmpeg -v error -y -i "$HERE/money-01-openclaw-16x9.mp4" -c copy -map 0 -f segment -segment_times "$(echo "$D / 2" | bc -l)" -reset_timestamps 1 -movflags +faststart "$HERE/out/half%d.mp4"
  mv "$HERE/out/half0.mp4" "$HERE/money-01-openclaw-16x9-A.mp4"; mv "$HERE/out/half1.mp4" "$HERE/money-01-openclaw-16x9-B.mp4"
fi
