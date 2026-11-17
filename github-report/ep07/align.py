# whisper word timings + the manuscript's spelling → audio/ep07-words.json
import json, re, difflib, sys
W = json.load(open('audio/ep07-whisper.json'))['words']; S = open('manuscript.txt').read().split()
n = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
a, b, out = [n(w['w']) for w in W], [n(x) for x in S], []
for op, i0, i1, j0, j1 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if op == 'delete': continue
    if op == 'equal': out += [{'w': S[j0 + k], 's': W[i0 + k]['s'], 'e': W[i0 + k]['e']} for k in range(i1 - i0)]; continue
    s0 = W[i0]['s'] if i1 > i0 else (out[-1]['e'] if out else W[0]['s'])
    s1 = W[i1 - 1]['e'] if i1 > i0 else (W[i0]['s'] if i0 < len(W) else s0 + .3 * (j1 - j0))
    s1 = max(s1, s0 + .12 * (j1 - j0)); d = (s1 - s0) / (j1 - j0)
    out += [{'w': S[j0 + k], 's': round(s0 + k * d, 3), 'e': round(s0 + (k + 1) * d, 3)} for k in range(j1 - j0)]
    if op != 'equal': print(op, ' '.join(x['w'] for x in W[i0:i1]), '→', ' '.join(S[j0:j1]), file=sys.stderr)
json.dump({'words': out}, open('audio/ep07-words.json', 'w')); print(len(out), 'words; first', out[0], 'last', out[-1])
