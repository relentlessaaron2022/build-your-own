# srt.py <words.json> <offset_s> <out.srt>: subtitles from the narration word timings (groups of up to 8 words, split at punctuation)
import sys, json, re
W = json.load(open(sys.argv[1]))['words']; off = float(sys.argv[2])
G, g = [], []
for w in W:
    if g and (len(g) >= 8 or re.search(r'[.,!?:;]$', g[-1]['w']) or w['s'] - g[-1]['e'] > .45): G.append(g); g = []
    g.append(w)
if g: G.append(g)
ts = lambda x: '%02d:%02d:%02d,%03d' % (x // 3600, x % 3600 // 60, x % 60, round((x % 1) * 1000) % 1000)
with open(sys.argv[3], 'w') as f:
    for i, g in enumerate(G, 1): f.write(f"{i}\n{ts(g[0]['s'] + off)} --> {ts(g[-1]['e'] + off + .3)}\n{' '.join(w['w'] for w in g)}\n\n")
print(len(G), 'cues')
