#!/bin/sh
# The GitHub Report, Ep. 05: the board (1920x1080) over the voiceover, with a 2.2 s title sting before the first word.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/audio/ep05.mp3" -af "apad=pad_dur=4" -ar 48000 "$HERE/out/audio.wav"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/out/master.mp4" 30 0
# the paper texture is hard to compress: re-encode under GitHub's 100 MB limit
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 25 -tune grain -c:a copy -movflags +faststart "$HERE/github-report-ep05.mp4"
# split into two halves for CapCut only when the full episode is over 100 MB
if [ "$(stat -c %s "$HERE/github-report-ep05.mp4")" -gt 100000000 ]; then
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$HERE/github-report-ep05.mp4")
  ffmpeg -v error -y -i "$HERE/github-report-ep05.mp4" -c copy -map 0 -f segment -segment_times "$(echo "$D / 2" | bc -l)" -reset_timestamps 1 -movflags +faststart "$HERE/out/half%d.mp4"
  mv "$HERE/out/half0.mp4" "$HERE/github-report-ep05-A.mp4"; mv "$HERE/out/half1.mp4" "$HERE/github-report-ep05-B.mp4"
fi
