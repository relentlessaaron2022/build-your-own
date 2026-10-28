"""mix.py — original news theme (sampled, 120 BPM, D minor) + package foley + Kokoro narration, ducked → mix.wav
Run after `node $LIB/core/render/events.mjs <this folder>`. LIB = the Lemo-Opuscar library."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB); sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from core.audio import sampler as S
import sfx as X
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add, compress, limit
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; E = ev['ev']
N = int(round(DUR * SR))
MUS = np.zeros((N, 2)); FX = np.zeros((N, 2)); VO = np.zeros((N, 2))
S.seed(3); R = np.random.default_rng(9)
BEAT = .5; T0 = 1.5
def bt(n): return T0 + n * BEAT
def note(inst, p, t, d, v=.6, g=1., pan=0., **kw):
    if 0 <= t < DUR: add(MUS, S.note(inst, p, d, vel=v, **kw), t, g, pan)
def hit(inst, var, t, v=.6, g=1., pan=0.):
    if 0 <= t < DUR: add(MUS, S.hit(inst, var, vel=v), t, g, pan)

# ——— theme: root–fifth–octave spiccato eighths, pizz bass on the beat, horn pads, kick 1 & 3, snare 2 & 4 ———
PROG = [('D', 'D3', 'A3', 'D4', ['D3', 'F3', 'A3']), ('Bb', 'Bb2', 'F3', 'Bb3', ['D3', 'F3', 'Bb3']), ('G', 'G2', 'D3', 'G3', ['D3', 'G3', 'Bb3']), ('A', 'A2', 'E3', 'A3', ['C#3', 'E3', 'A3'])]
def bar(b, sect):
    name, root, fifth, octv, pad = PROG[b % 4]; t = bt(b * 4)
    up = lambda p: S.name(S.midi(p) + 12)
    pat = [root, fifth, octv, fifth] * 2
    if sect in ('full', 'drive'):
        for i, p in enumerate(pat): note('violins_spic', up(p), t + i * BEAT / 2, .2, .55 if i % 2 == 0 else .42, .55, .25)
    for k in range(4): note('contrabass_pizz', S.name(S.midi(root) - 12), t + k * BEAT, .4, .7, .9, -.1)
    if sect in ('full', 'pads'):
        for p in pad: note('horn', p, t, BEAT * 3.8, .38, .35, -.2, attack=.25)
    if sect in ('full', 'drive'):
        hit('bass_drum', None, t, .6, .7); hit('bass_drum', None, t + 2 * BEAT, .55, .6)
        hit('snare', 'on', t + BEAT, .45, .35, .1); hit('snare', 'on', t + 3 * BEAT, .45, .35, .1)
    # 16th saw pulse, low-passed
    if sect != 'pads':
        f = S.hz(root) * 2; n = int(4 * BEAT * SR); tt = np.arange(n) / SR
        saw = (2 * ((tt * f) % 1) - 1) * (0.5 + 0.5 * (np.floor(tt / (BEAT / 4)) % 2 == 0)) * np.exp(-((tt % (BEAT / 4)) / .05))
        add(MUS, lp(saw, 900) * .12, t, 1., 0)

# sections (bars of 2 s from 1.5 s): full under the rundown, pads under commentary, drive under the record
SECT = {0: 'full', 1: 'full', 2: 'full', 3: 'pads', 4: 'pads', 5: 'drive', 6: 'drive', 7: 'drive', 8: 'pads', 9: 'pads', 10: 'drive', 11: 'drive', 12: 'drive',
        13: 'drive', 14: 'drive', 15: 'pads', 16: 'pads', 17: 'drive', 18: 'drive', 19: 'drive', 20: 'drive', 21: 'pads', 22: 'pads', 23: 'drive', 24: 'drive', 25: 'full', 26: 'full', 27: 'full'}
for b, sect in SECT.items(): bar(b, sect)
# sting tutti + end hit
for p in ['D3', 'A3', 'D4', 'F4']: note('horn', p, .32, 1.1, .7, .6, 0)
hit('timpani', 'drum1', .32, .9, 1.0); hit('crash', None, .32, .6, .5)
for p in ['D3', 'A3', 'D4', 'F4', 'A4']: note('horn', p, 58.75, 2.4, .7, .6, 0)
hit('timpani', 'drum1', 58.75, .9, 1.0); hit('crash', None, 58.75, .55, .45)
# one beat of silence before the biggest break (the DHS board), then the heaviest hit
i0, i1 = int((27.0 - .5) * SR), int(27.0 * SR); MUS[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 3

# ——— foley ———
def whoosh(d=.4): tt = t_(d); return norm(bp(R.standard_normal(len(tt)), 400, 6000) * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2)
def flap(): d = .04; return norm(hp(R.standard_normal(len(t_(d))), 2000) * env_exp(d, .006))
def thump(): d = .35; tt = t_(d); return norm(np.sin(2 * np.pi * 70 * tt) * env_exp(d, .07) + lp(R.standard_normal(len(tt)), 600) * env_exp(d, .02) * .5)
def clack(): d = .08; return norm(lp(bp(R.standard_normal(len(t_(d))), 800, 3000), 2500) * env_exp(d, .01))
def paper(): d = .5; tt = t_(d); return norm(bp(R.standard_normal(len(tt)), 1500, 7000) * np.sin(np.pi * tt / d) * (.6 + .4 * np.sin(2 * np.pi * 26 * tt)))
for e in E:
    ty, t = e['type'], e['t']
    if ty == 'whoosh': add(FX, whoosh(.45), t - .05, .35)
    elif ty == 'timp': hit('timpani', 'drum2', t, .75, .8)
    elif ty == 'glock': note('glockenspiel', ['A5', 'D6', 'F6'][[2.5, 3.0, 3.5].index(round(t, 1))], t, .8, .55, .5, .2)
    elif ty == 'tick': note('glockenspiel', ['D6', 'F6', 'A6'][e['i']], t, .8, .5, .45, .2); add(FX, flap(), t, .2)
    elif ty == 'stamp': add(FX, thump(), t, .5); add(FX, clack(), t + .02, .3)
    elif ty == 'flap': add(FX, flap(), t, .25, .2)
    elif ty == 'paper': add(FX, paper(), t, .3, .3)
    elif ty == 'endhit': pass
hit('timpani', 'drum1', 27.0, 1.0, 1.1); hit('bass_drum', None, 27.0, .9, .8)   # the heaviest hit on the board

# ——— voice: HP 90 Hz, 3:1, levelled by RMS ———
mask = np.zeros(N)
for e in E:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR); y = hp(y, 90); y = compress(norm(y, .9), .3, 3.0)
    y = y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * .12
    add(VO, y, e['t'], 1.0); s = int(e['t'] * SR); mask[max(0, s - 2400):s + len(y) + 2400] = 1
duck = uniform_filter1d(mask, int(.15 * SR))
MUS *= (10 ** (-7 * duck / 20))[:, None]
mid = np.stack([bp(MUS[:, c], 1200, 5000) for c in range(2)], 1); MUS -= mid * (.4 * duck)[:, None]
mix = MUS * .85 + FX * .6 + VO
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
mix = mix / np.abs(mix).max() * .89
nf = int(.025 * SR); mix[:nf] *= np.linspace(0, 1, nf)[:, None]
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
m = mask[:N] > 0
print('mix.wav', round(DUR, 2), 's · voice', round(db(VO[m]), 1), 'dB · music under voice', round(db((MUS * .85)[m]), 1), 'dB')
