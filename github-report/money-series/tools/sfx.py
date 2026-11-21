"""sfx.py <episode.json> <words.json> <16x9|9x16> <out.wav>: game sound effects, timed to the same moments as the game skin.
Level-up on each section, a chime when an item card drops, a hit on badges and boxes, a blip per quest line, coins, a fanfare
on the banner and the mission-complete screen. All synthesized here (no samples), mixed low under the voice by make.sh."""
import sys, json, re
import numpy as np, soundfile as sf
EP, WJ, CUT, OUT = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3], sys.argv[4]
OFF = 1.0 if CUT == '16x9' else .3
W = [{**w, 's': w['s'] + OFF} for w in json.load(open(WJ))['words']]
n = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
def at(p, d=0):
    if isinstance(p, (int, float)): return p
    q = [n(x) for x in p.split() if n(x)]
    for i in range(len(W)):
        if all(i + j < len(W) and n(W[i + j]['w']) == x for j, x in enumerate(q)): return W[i]['s'] + d
    raise SystemExit(f'sfx.py: phrase not found: {p}')
SR = 48000; end = W[-1]['e'] + 6; mix = np.zeros(int(SR * end))
def env(n_, a=.005, r=.2): t = np.arange(n_) / SR; return np.minimum(1, t / a) * np.exp(-t / r)
def tone(f, dur, wave='sq', a=.005, r=.15, sweep=0):
    t = np.arange(int(SR * dur)) / SR; ph = 2 * np.pi * np.cumsum(f * (1 + sweep * t / dur)) / SR
    x = np.sign(np.sin(ph)) * .5 if wave == 'sq' else np.sin(ph) if wave == 'sin' else 2 * (ph / (2 * np.pi) % 1) - 1
    return x * env(len(t), a, r)
def noise(dur, r=.08, lp=.3):
    x = np.random.default_rng(int(dur * 1e4)).uniform(-1, 1, int(SR * dur)); y = np.copy(x)
    for i in range(1, len(y)): y[i] = y[i - 1] + lp * (x[i] - y[i - 1])
    return y * env(len(y), .002, r)
def put(x, t, g=1.0):
    i = int(t * SR); j = min(len(mix), i + len(x))
    if 0 <= i < len(mix): mix[i:j] += x[:j - i] * g
def sum_shift(notes, step, dur, wave, g):
    L = int(SR * (step * (len(notes) - 1) + dur)) + 1; y = np.zeros(L)
    for k, f in enumerate(notes): x = tone(f, dur, wave, r=dur * .5); i = int(SR * step * k); y[i:i + len(x)] += x
    return y * g
LEVEL = sum_shift([523, 659, 784, 1047], .07, .16, 'sq', .30)           # level start
CHIME = sum_shift([1319, 1568, 2093, 2637], .05, .22, 'sin', .45)       # item drop
HIT = noise(.18, .06, .5) * .55 + tone(110, .18, 'sin', r=.06) * .7     # badge / box
BLIP = tone(1760, .07, 'sq', r=.03) * .22                                # quest line
COIN = sum_shift([1976, 2637], .06, .14, 'sq', .22)                      # coin
WHOOSH = noise(.35, .12, .05) * .5                                       # big text
FANFARE = sum_shift([523, 659, 784, 1047, 784, 1047, 1319], .09, .3, 'sq', .30)
def els(es):
    for e in es:
        ty = e['type']
        if 'items' in e:
            for it in e['items']: put(BLIP if ty == 'checks' else HIT * .5, at(it['at'], it.get('d', 0)))
            continue
        if 'at' not in e: continue
        a = at(e['at'], e.get('d', 0))
        if ty == 'card': put(CHIME, a + .15)
        elif ty in ('stamp', 'box'): put(HIT, a)
        elif ty == 'big': put(WHOOSH, a - .1)
        elif ty == 'banner': put(FANFARE, a)
        elif ty == 'stack': [put(COIN, a + i * .25) for i in range(e['n'])]
        elif ty == 'phone': put(BLIP * 2, a)
if CUT == '16x9':
    for o in EP['open']: put(HIT, at(o['at'], o.get('d', 0)))
    for s in EP['sections']: put(LEVEL, at(s['at']) - .2); els(s['els'])
    put(FANFARE, at(EP['recap']['at']) + .2)
else:
    for b in EP['vertical']['beats']: els(b['els'])
    put(FANFARE * .7, at(EP['vertical']['outro']) + .8)
mix = np.tanh(mix * 1.2) * .5
sf.write(OUT, np.stack([mix, mix], 1), SR); print(f'sfx: {OUT} {end:.1f} s')
