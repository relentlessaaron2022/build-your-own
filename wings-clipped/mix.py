"""mix.py — original news theme (sampled, 120 BPM, D minor) + package foley + the host's own voiceover (vo.wav), ducked → mix.wav
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
BEAT = .5; T0 = .8
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
# bars of 2 s from 0.8 s: title full, the scam pads, the trip and the money drive, arrest drive, the case pads, the close full
def sect_at(t):
    for a, b, s in [(0, 10, 'full'), (10, 26, 'pads'), (26, 54.4, 'drive'), (54.4, 67.4, 'drive'), (67.4, 79, 'pads'), (79, 94, 'full')]:
        if a <= t < b: return s
    return None
SECT = {b: sect_at(T0 + b * 2) for b in range(46) if sect_at(T0 + b * 2)}
for b, sect in SECT.items(): bar(b, sect)
# sting tutti + end hit
for p in ['D3', 'A3', 'D4', 'F4']: note('horn', p, .2, 1.1, .7, .6, 0)
hit('timpani', 'drum1', .2, .9, 1.0); hit('crash', None, .2, .6, .5)
for p in ['D3', 'A3', 'D4', 'F4', 'A4']: note('horn', p, 92.8, 1.9, .7, .6, 0)
hit('timpani', 'drum1', 92.8, .9, 1.0); hit('crash', None, 92.8, .55, .45)
# one beat of silence before the biggest break (the DHS board), then the heaviest hit
i0, i1 = int((64.54 - .6) * SR), int(64.54 * SR); MUS[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 3   # silence before ARRESTED

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
    elif ty == 'ping': note('glockenspiel', 'A6', t, .8, .5, .4, .2)
    elif ty == 'ding': note('glockenspiel', 'D7', t, 1.2, .6, .45, .2); note('glockenspiel', 'A6', t + .12, 1.0, .5, .35, .2)
    elif ty == 'jet': add(FX, norm(bp(R.standard_normal(int(e['d'] * SR)), 150, 2500) * np.sin(np.pi * np.linspace(0, 1, int(e['d'] * SR))) ** 1.5), t, .2, -.3)
    elif ty == 'bigstamp': add(FX, thump(), t, .7); add(FX, clack(), t + .02, .4)
    elif ty == 'stamp': add(FX, thump(), t, .5); add(FX, clack(), t + .02, .3)
    elif ty == 'flap': add(FX, flap(), t, .25, .2)
    elif ty == 'paper': add(FX, paper(), t, .3, .3)
    elif ty == 'endhit': pass
hit('timpani', 'drum1', 64.54, 1.0, 1.1); hit('bass_drum', None, 64.54, .9, .8)   # the heaviest hit: ARRESTED

# ——— voice: HP 90 Hz, 3:1, levelled by RMS ———
mask = np.zeros(N)
y, sr = sf.read(os.path.join(HERE, 'vo.wav'))
if y.ndim > 1: y = y.mean(1)
if sr != SR: y = soxr.resample(y, sr, SR)
y = hp(y, 90); y = compress(norm(y, .9), .3, 3.0)
act = np.abs(y) > .02; y = y / (np.sqrt(np.mean(y[act] ** 2)) + 1e-9) * .12
add(VO, y, 0.0, 1.0)
env = uniform_filter1d(np.abs(y), int(.2 * SR)) > .01; mask[:len(env)] = env[:N]
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
