"""mix.py <story> — narration + paper/pen/stamp foley, no music → mix_<story>.wav.  Run after:
node $LIB/core/render/events.mjs <this folder> --size 1080x1920 --q story=<story> --out events_<story>.json"""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add, compress, limit
HERE = os.path.dirname(os.path.abspath(__file__)); K = sys.argv[1]
ev = json.load(open(os.path.join(HERE, f'events_{K}.json'))); DUR = ev['dur']; E = ev['ev']
N = int(round(DUR * SR)); R = np.random.default_rng(7)
FX = np.zeros((N, 2)); VO = np.zeros((N, 2))
def nz(d): return R.standard_normal(len(t_(d)))
def slap(soft=0): d = .12; x = lp(nz(d), 2200) * env_exp(d, .012) + np.sin(2 * np.pi * 120 * t_(d)) * env_exp(d, .03) * .5; return norm(x) * (.6 if soft else 1)
def pen(d):   # fineliner scratch: band-limited noise in short strokes
    tt = t_(d); am = (np.sin(2 * np.pi * 3.1 * tt + R.random()) > -.2) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * tt))); return norm(bp(nz(d), 2500, 7000) * lp(am.astype(float), 40))
def stamp(): d = .35; tt = t_(d); return norm(np.sin(2 * np.pi * 70 * tt) * env_exp(d, .07) + lp(nz(d), 600) * env_exp(d, .02) * .5)
def whoosh(d=.5): tt = t_(d); return norm(bp(nz(d), 400, 5000) * np.sin(np.pi * tt / d) ** 2)
for e in E:
    ty, t = e['type'], e['t']
    if ty == 'cut' and t > .5: add(FX, slap(), t, .35)
    elif ty == 'slap': add(FX, slap(1), t, .3, (R.random() - .5) * .4)
    elif ty == 'pen': add(FX, pen(e['d']), t + .1, .09, .2)
    elif ty == 'stamp': add(FX, stamp(), t, .5)
    elif ty == 'whoosh': add(FX, whoosh(.5), t - .1, .3)
    elif ty == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'vo', K, e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, SR); y = hp(y, 90); y = compress(norm(y, .9), .3, 3.0); add(VO, y, t, 1.0)
room = lp(R.standard_normal(N), 300) * .004; FX[:, 0] += room; FX[:, 1] += room
mix = VO + FX * .8
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
mix = mix / np.abs(mix).max() * .89; nf = int(.025 * SR); mix[:nf] *= np.linspace(0, 1, nf)[:, None]
sf.write(os.path.join(HERE, f'mix_{K}.wav'), mix.astype(np.float32), SR); print(K, 'mix', round(DUR, 2), 's')
