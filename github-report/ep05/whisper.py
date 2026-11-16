import sys, json
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True, language='en', condition_on_previous_text=False)
json.dump({'words': [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words if w.word.strip()]}, open(sys.argv[2], 'w'))
