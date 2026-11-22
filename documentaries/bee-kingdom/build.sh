#!/bin/sh
# The Honeybee File (Halftone Dossier): picture + narration + synthesized score/SFX → the-honeybee-file.mp4 (16:9, 30 fps)
set -e
LIB=/root/lemo-opuscar
HERE=$(cd "$(dirname "$0")" && pwd); mkdir -p "$HERE/out"; cd "$LIB"
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
"$LIB/.venv/bin/python" "$HERE/music.py" "$HERE/out/events.json" "$HERE/out/score.wav"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
# voice on top, score ducked under it (sidechain), voice starts 1.2 s in
ffmpeg -v error -y -i "$HERE/audio/voice.wav" -i "$HERE/out/score.wav" -filter_complex "[0]adelay=1200:all=1,aformat=sample_rates=48000:channel_layouts=stereo,apad=pad_dur=8,asplit=2[v][sc];[1]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];[v][md]amix=inputs=2:duration=longest:normalize=0" -ar 48000 "$HERE/out/audio.wav"
sh /home/user/build-your-own/github-report/ep07/master.sh "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/out/master.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 22 -tune animation -c:a copy -movflags +faststart "$HERE/the-honeybee-file.mp4"
