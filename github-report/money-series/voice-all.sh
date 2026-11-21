#!/bin/sh
# voice-all.sh <episode folder>...: narrate and word-time each episode (no render)
MS=$(cd "$(dirname "$0")" && pwd); P=/root/lemo-opuscar/.venv/bin/python; VOICE=${VOICE:-af_heart}
for E in "$@"; do mkdir -p "$E/audio"
  [ -f "$E/audio/voice.wav" ] || $P "$MS/tools/voice.py" "$E/script.txt" "$E/audio/voice.wav" $VOICE
  [ -f "$E/audio/voice-v.wav" ] || $P "$MS/tools/voice.py" "$E/script-vertical.txt" "$E/audio/voice-v.wav" $VOICE
  [ -f "$E/audio/words.json" ] || $P "$MS/tools/words.py" "$E/audio/voice.wav" "$E/script.txt" "$E/audio/words.json" 2>/dev/null
  [ -f "$E/audio/words-v.json" ] || $P "$MS/tools/words.py" "$E/audio/voice-v.wav" "$E/script-vertical.txt" "$E/audio/words-v.json" 2>/dev/null
  echo "voiced $E"; done
