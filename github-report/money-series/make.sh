#!/bin/sh
# make.sh <episode folder> <outfit: black|red|gold> [16x9|9x16|both]
# Builds a Money Series episode from its script.txt, script-vertical.txt and episode.json, with the avatar in that outfit.
# Narration (Kokoro, the avatar's voice) is generated once and kept in audio/; delete audio/ to re-voice.
set -e
MS=$(cd "$(dirname "$0")" && pwd); EP=$(cd "$1" && pwd); OUTFIT=${2:-black}; WHICH=${3:-both}; NAME=money-$(basename "$EP")
P=/root/lemo-opuscar/.venv/bin/python; VOICE=${VOICE:-af_heart}
mkdir -p "$EP/audio"
[ -f "$EP/audio/voice.wav" ] || $P "$MS/tools/voice.py" "$EP/script.txt" "$EP/audio/voice.wav" $VOICE
[ -f "$EP/audio/voice-v.wav" ] || $P "$MS/tools/voice.py" "$EP/script-vertical.txt" "$EP/audio/voice-v.wav" $VOICE
[ -f "$EP/audio/words.json" ] || $P "$MS/tools/words.py" "$EP/audio/voice.wav" "$EP/script.txt" "$EP/audio/words.json" 2>/dev/null
[ -f "$EP/audio/words-v.json" ] || $P "$MS/tools/words.py" "$EP/audio/voice-v.wav" "$EP/script-vertical.txt" "$EP/audio/words-v.json" 2>/dev/null
HJ="$MS/assets/host-$OUTFIT.json"; PHOTO=$(python3 -c "import json;print(json.load(open('$HJ'))['file'])")
for CUT in 16x9 9x16; do
  [ "$WHICH" = both ] || [ "$WHICH" = $CUT ] || continue
  B="$EP/build-$CUT"; rm -rf "$B"; mkdir -p "$B/assets" "$B/audio" "$B/out"
  cp -r "$MS/engine/fonts" "$MS/engine/sketch.js" "$MS/engine/master.sh" "$B/"; cp "$MS/engine/main-$CUT.js" "$B/main.js"; cp "$MS/engine/index-$CUT.html" "$B/index.html"
  cp "$EP/episode.json" "$B/"; cp "$HJ" "$B/assets/host.json"; cp "$MS/assets/$PHOTO" "$MS/assets/ru-logo.jpg" "$B/assets/"
  if [ $CUT = 16x9 ]; then SZ=1920x1080; V=voice.wav; WJ=words.json; DL=1000; PAD=4; CRF=25; else SZ=1080x1920; V=voice-v.wav; WJ=words-v.json; DL=300; PAD=3; CRF=23; fi
  cp "$EP/audio/$WJ" "$B/audio/words.json"
  (cd /root/lemo-opuscar && node core/render/video.mjs "$B" --fps 30 --workers ${WORKERS:-4} --size $SZ --out "$B/out/video.mp4")
  ffmpeg -v error -y -i "$EP/audio/$V" -af "adelay=$DL:all=1,apad=pad_dur=$PAD" -ar 48000 "$B/out/audio.wav"
  sh "$B/master.sh" "$B/out/video.mp4" "$B/out/audio.wav" "$B/out/master.mp4" 30 0
  ffmpeg -v error -y -i "$B/out/master.mp4" -c:v libx264 -preset slow -crf $CRF -tune grain -c:a copy -movflags +faststart "$EP/$NAME-$CUT.mp4"
  rm -rf "$B/out"; echo "built $EP/$NAME-$CUT.mp4"
done
