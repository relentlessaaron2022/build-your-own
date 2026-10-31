#!/bin/sh
# Render all five Relentless Times videos: events → mix (no music) → frames → master. LIB = the Lemo-Opuscar library.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
cd "$LIB"
for k in ${STORIES:-bronx cobee miami pg callaway}; do
  node core/render/events.mjs "$HERE" --size 1080x1920 --q "story=$k" --out "$HERE/events_$k.json"
  .venv/bin/python "$HERE/mix.py" "$k"
  node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --q "story=$k" --out "$HERE/out/video_$k.mp4"
  sh "$HERE/master.sh" "$HERE/out/video_$k.mp4" "$HERE/mix_$k.wav" "$HERE/relentless-times-$k.mp4" 30 0
  echo "RENDERED $k"
done
echo "ALL DONE"
