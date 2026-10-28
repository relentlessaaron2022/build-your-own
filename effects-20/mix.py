"""mix.py — the original voice + a synthesised sound for every effect (from events.json) → mix.wav
Run: $LIB/.venv/bin/python mix.py   (after: node $LIB/core/render/events.mjs <this folder> --size 1080x1920)"""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add

HERE = os.path.dirname(os.path.abspath(__file__))
R = np.random.default_rng(20)
def nz(d): return R.standard_normal(len(t_(d)))
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; E = ev['ev']
N = int(round(DUR * SR))
v, sr = sf.read(os.path.join(HERE, 'voice.wav'))
if v.ndim == 1: v = np.stack([v, v], 1)
if sr != SR: v = soxr.resample(v, sr, SR)
voice = np.zeros((N, 2)); voice[:min(N, len(v))] = v[:N]
FX = np.zeros((N, 2))

def sweep(f0, f1, d): tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def whoosh(d=.45, lo=400, hi=5000):
    tt = t_(d); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2; return norm(bp(nz(d), lo, hi) * e)
def riser(d, f0=300, f1=1800): tt = t_(d); return norm((bp(nz(d), 800, 6000) * .6 + sweep(f0, f1, d) * .4) * (tt / d) ** 1.6)
def popc(f=900): d = .12; return norm(sweep(f, f * 1.8, d) * env_exp(d, .03))
def tick(): d = .05; return norm(np.sin(2 * np.pi * 2400 * t_(d)) * env_exp(d, .008) + hp(nz(d), 3000) * env_exp(d, .003) * .5)
def slam(): d = .5; tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(70 * (1 + 1.5 * np.exp(-tt / .03))) / SR) * env_exp(d, .12) + lp(nz(d), 900) * env_exp(d, .04) * .8)
def shutter(): d = .16; x = np.zeros(len(t_(d))); c = hp(nz(.02), 2500) * env_exp(.02, .003); x[:len(c)] += c; x[int(.07 * SR):int(.07 * SR) + len(c)] += c * .8; return norm(x)
def shatter():
    d = 1.0; out = np.zeros(len(t_(d)))
    for k in range(40):
        s = int((k / 40) ** 1.6 * .7 * SR); b = .15; tt = t_(b); f = 2500 + R.random() * 5000
        c = (np.sin(2 * np.pi * f * tt) + .6 * np.sin(2 * np.pi * f * 1.47 * tt)) * np.exp(-tt / .03) * (.4 + R.random() * .6); out[s:s + len(c)] += c[:len(out) - s]
    out[:int(.25 * SR)] += lp(nz(.25), 600) * env_exp(.25, .05) * 2
    return norm(out)
def glass(): d = 1.0; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / .35) for f in [1568, 2349, 3136]) + whoosh(1.0, 1500, 8000) * .6)
def dive(d): return norm(riser(d * .9, 200, 900) * .7 + whoosh(d * .9, 200, 2000) * .5)
def paper(): d = .35; return norm(bp(nz(d), 1500, 7000) * np.sin(np.pi * t_(d) / d) * (.6 + .4 * np.sin(2 * np.pi * 30 * t_(d))))
def digi(): d = .18; tt = t_(d); return norm(np.sign(np.sin(2 * np.pi * 880 * tt)) * env_exp(d, .05) * .5 + sweep(600, 1400, d) * env_exp(d, .06))

def place(x, t, g, pan=0.): add(FX, np.asarray(x, dtype=np.float64), t, g, pan)
for e in E:
    ty, t, d = e['type'], e['t'], e.get('d', 1.2)
    if ty == 'orbit': place(whoosh(.9, 300, 3000), t, .35, -.3); place(whoosh(.7, 400, 4000), t + .45, .3, .3)
    elif ty == 'pop': place(popc(), t, .3)
    elif ty == 'bubble': place(popc(1200), t, .22, .2)
    elif ty == 'whoosh': place(whoosh(.45), t - .1, .35)
    elif ty == 'snap': place(whoosh(.18, 800, 7000), t - .05, .45); place(X.thump(.8, 110), t + .05, .3)
    elif ty == 'tick': place(tick(), t, .25, .2)
    elif ty == 'slam': place(slam(), t, .3, R.random() - .5)
    elif ty == 'portal': place(riser(min(d, 1.3), 200, 1400), t, .3); place(glass(), t + .2, .15)
    elif ty == 'rise': place(riser(min(d, 1.2)), t, .25)
    elif ty == 'wipe': place(whoosh(.5, 600, 6000), t, .35, -.4)
    elif ty == 'slide': place(whoosh(.4, 300, 3000), t, .3); place(tick(), t + .3, .2)
    elif ty == 'paper': place(paper(), t, .35)
    elif ty == 'dolly': place(riser(min(d, 1.3), 120, 500), t, .28)
    elif ty == 'shutter': place(shutter(), t, .45)
    elif ty == 'glass': place(glass(), t, .25)
    elif ty == 'dive': place(dive(min(d, 1.6)), t + .2, .35)
    elif ty == 'key': place(digi(), t, .3); place(whoosh(.5), t + .4, .3)
    elif ty == 'shatter': place(shatter(), t + .18, .4)
    elif ty == 'zoom': place(digi(), t, .28)
    elif ty == 'ticks':
        for i in range(20): place(tick(), t + .2 + i * .055, .16, (i % 2 - .5) * .4)

# keep effects under the voice: duck FX ~6 dB while he talks
env = np.abs(voice.mean(1)); from scipy.ndimage import uniform_filter1d
env = uniform_filter1d(env, int(.08 * SR)); talk = np.clip(env / (env.max() * .15), 0, 1)
FX *= (10 ** (-6 * talk / 20))[:, None]
mix = voice + FX * .9
for c in range(2): mix[:, c] = X.limit(mix[:, c], .95)
mix = mix / np.abs(mix).max() * .89
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
print('mix.wav', mix.shape)
