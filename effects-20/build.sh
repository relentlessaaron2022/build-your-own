#!/bin/sh
# Rebuild "20 effects": sh build.sh /path/to/original.mov
# Needs the Lemo-Opuscar library (LIB, default ~/lemo-opuscar, with `setup.sh deps voice`) and a Python with mediapipe 0.10.21 + opencv for SEGPY.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); SRC="$1"
LIB=${LIB:-$HOME/lemo-opuscar}; SEGPY=${SEGPY:-python3}; export LIB
if [ -n "$SRC" ]; then
  mkdir -p "$HERE/frames" "$HERE/masks"
  ffmpeg -v error -y -i "$SRC" -vf fps=30 -q:v 3 "$HERE/frames/f%04d.jpg"          # 1020 frames, 720x1280
  ffmpeg -v error -y -i "$SRC" -vn -c:a pcm_s16le -ar 48000 "$HERE/voice.wav"
  "$SEGPY" -I "$HERE/segment.py" "$HERE/frames" "$HERE/masks"                      # person mask per frame
  "$SEGPY" -I "$HERE/track.py" "$HERE/masks" "$HERE/track.json"                   # head track
  "$SEGPY" -I "$HERE/alpha.py" "$HERE/masks"                                       # masks → alpha PNGs
fi
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/claude-20-effects.mp4" 30 0
