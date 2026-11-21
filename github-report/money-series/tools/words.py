# words.py <voice.wav> <script.txt> <out.json>: word timings from whisper, spelled as the script spells them
import sys, json, re, difflib
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True, language='en', condition_on_previous_text=False)
W = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words if w.word.strip()]
S = open(sys.argv[2]).read().split(); n = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
a, b, out = [n(w['w']) for w in W], [n(x) for x in S], []
for op, i0, i1, j0, j1 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if op == 'delete': continue
    if op == 'equal': out += [{'w': S[j0 + k], 's': W[i0 + k]['s'], 'e': W[i0 + k]['e']} for k in range(i1 - i0)]; continue
    s0 = W[i0]['s'] if i1 > i0 else (out[-1]['e'] if out else W[0]['s'])
    s1 = W[i1 - 1]['e'] if i1 > i0 else (W[i0]['s'] if i0 < len(W) else s0 + .3 * (j1 - j0))
    s1 = max(s1, s0 + .12 * (j1 - j0)); d = (s1 - s0) / (j1 - j0)
    out += [{'w': S[j0 + k], 's': round(s0 + k * d, 3), 'e': round(s0 + (k + 1) * d, 3)} for k in range(j1 - j0)]
json.dump({'words': out}, open(sys.argv[3], 'w')); print(len(out), 'words, last at', out[-1]['e'])
