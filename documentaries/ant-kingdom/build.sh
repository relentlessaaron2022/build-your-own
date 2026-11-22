#!/bin/sh
# The Ant Kingdom: board film + narration + synthesized sound effects and score → the-ant-kingdom.mp4
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd /root/lemo-opuscar; mkdir -p "$HERE/out"
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
/root/lemo-opuscar/.venv/bin/python "$HERE/tools/sfx.py" "$HERE/out/events.json" "$HERE/out/sfx.wav"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/audio/voice.wav" -i "$HERE/out/sfx.wav" -filter_complex "[0]adelay=1500:all=1,aformat=sample_rates=48000:channel_layouts=stereo,apad=pad_dur=20[v];[1]volume=0.5[s];[v][s]amix=inputs=2:duration=longest:normalize=0" -ar 48000 "$HERE/out/audio.wav"
sh /home/user/build-your-own/github-report/ep07/master.sh "$HERE/out/video.mp4" "$HERE/out/audio.wav" "$HERE/out/master.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 21 -tune film -c:a copy -movflags +faststart "$HERE/the-ant-kingdom.mp4"
