"""mix.py — foley (synthesised) + score + 1930s optical-soundtrack ageing → mix.wav
Recipes adapted from styles/rubber-hose/demo/mix.py. Run after `node core/render/events.mjs <this folder>` and music/score.py."""
import os, sys, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add

HERE = os.path.dirname(os.path.abspath(__file__))
R = np.random.default_rng(1931)
def nz(d): return R.standard_normal(len(t_(d)))
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; E = ev['ev']
N = int(round(DUR * SR))
FX = np.zeros((N, 2)); BED = np.zeros((N, 2))

def sine_sweep(f0, f1, d, curve=1.0):
    tt = t_(d); f = f0 + (f1 - f0) * (tt / d) ** curve; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def partials(fs, d, taus, amps=None):
    tt = t_(d); amps = amps or [1] * len(fs)
    return sum(a * np.sin(2 * np.pi * f * tt + R.random() * 6) * np.exp(-tt / tau) for f, tau, a in zip(fs, taus, amps))
def woodblock(f=2400, d=.09):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .018) + .5 * np.sin(2 * np.pi * f * 1.52 * tt) * np.exp(-tt / .01)
    return norm(x + hp(nz(d), 2000) * env_exp(d, .0015) * .4)
def boing(f=210, d=.6, depth=.35):
    tt = t_(d); f_ = f * (1 + depth * np.sin(2 * np.pi * 13 * tt) * np.exp(-tt * 4)); ph = 2 * np.pi * np.cumsum(f_) / SR
    return norm((np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph)) * np.exp(-tt * 4.5))
def rubber_creak(d, f0=90, f1=260):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return norm(bp(saw, 300, 2500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 17 * tt))) * np.sin(np.pi * tt / d) ** .5)
def shower(d, muffle):
    tt = t_(d); x = bp(nz(d), 900, 9000) * (.85 + .15 * lp(R.random(len(tt)), 8)) + lp(nz(d), 500) * .4
    if muffle: x = lp(x, 900) * 1.6
    e = np.minimum(1, tt / .15) * np.minimum(1, (d - tt) / .15)
    return norm(x * e)
def swish(d=.4, lo=700, hi=6000):
    tt = t_(d); return norm(bp(nz(d), lo, hi) * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5)
def pomf():
    d = .4; tt = t_(d); return norm(lp(nz(d), 400) * env_exp(d, .06) + np.sin(2 * np.pi * 70 * tt) * env_exp(d, .07) * .7)
def tiptoe(): return norm(woodblock(3000, .05) * .7 + hp(nz(.05), 3000) * env_exp(.05, .006) * .3)
def steam_hiss(d):
    tt = t_(d); return norm(bp(nz(d), 2500, 9000) * np.clip(tt / d, 0, 1) ** 1.3 * np.minimum(1, (d - tt) / .3))
def smack(): d = .05; return norm(bp(nz(d), 700, 3000) * env_exp(d, .006))

def place(x, t, g, pan=0.): add(FX, np.asarray(x, dtype=np.float64), t, g, pan)
for e in E:
    ty, t = e['type'], e['t']
    if ty == 'showerFar': place(shower(e['d'], True), t, .16, .5)
    elif ty == 'showerNear': place(shower(e['d'], False), t, .14, .25)
    elif ty == 'ping': place(sine_sweep(2600, 3400, .05) * env_exp(.05, .02), t, .12, .2)
    elif ty == 'hop': place(boing(300 + 60 * e.get('i', 0), .3, .3), t, .16, .1)
    elif ty == 'click': place(np.concatenate([hp(nz(.02), 3000) * env_exp(.02, .002), np.zeros(800)]), t, .35, .2)
    elif ty == 'swish': place(swish(.6, 600, 5000), t, .3, -.1)
    elif ty == 'pomf': place(pomf(), t, .45, -.15)
    elif ty == 'crouch': place(rubber_creak(.25, 160, 110), t, .14, 0)
    elif ty == 'tiptoe': place(tiptoe(), t, .2, .1)
    elif ty == 'stretch': place(rubber_creak(e['d'], 80, 320), t, .35, -.1)
    elif ty == 'smack': place(smack(), t, .35, 0)
    elif ty == 'whoosh': place(X.whoosh(.3), t, .35, .1)
    elif ty == 'curtain': place(swish(.5, 1200, 7000), t, .3, .2)
    elif ty == 'steam': place(steam_hiss(e['d']), t, .16, 0)
    elif ty == 'peek': place(rubber_creak(.22, 150, 220), t, .2, -.1)
    elif ty == 'iris': place(np.concatenate([X.thump(1, 90)]), t, .45, 0)

mus, msr = sf.read(os.path.join(HERE, 'music', 'score.wav'))
if mus.ndim == 1: mus = np.stack([mus, mus], 1)
mus = np.pad(mus[:N], ((0, max(0, N - len(mus))), (0, 0)))

def optical(x):
    y = np.stack([hp(lp(x[:, c], 6200, 2), 110, 2) for c in range(2)], 1)
    tt = np.arange(N) / SR; dl = (.00035 * np.sin(2 * np.pi * .6 * tt) + .00008 * np.sin(2 * np.pi * 7 * tt)) * SR
    idx = np.clip(np.arange(N) - 40 + dl, 0, N - 1); i0 = idx.astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, N - 1)
    y = y[i0] * (1 - fr)[:, None] + y[i1] * fr[:, None]
    return np.tanh(y * 1.4) / np.tanh(1.4)
bus = optical(mus * 1.0 + FX * .9)
hiss = bp(R.standard_normal(N), 800, 6000) * .0035
crk = np.zeros(N); pos = R.random(int(DUR * 9)) * (N - 200)
for p in pos.astype(int): L_ = R.integers(8, 60); crk[p:p + L_] += R.standard_normal(L_) * np.exp(-np.arange(L_) / 10) * (.02 + R.random() * .05)
crk = hp(crk, 900)
proj = np.zeros(N); per = SR / 24
for k in range(int(DUR * 24)): s = int(k * per); c = hp(R.standard_normal(200), 1500) * np.exp(-np.arange(200) / 30); proj[s:s + 200] += c[:max(0, min(200, N - s))] * .012
proj += np.sin(2 * np.pi * 50 * np.arange(N) / SR) * .002 + lp(R.standard_normal(N), 180) * .006
BED[:, 0] = hiss + crk + proj; BED[:, 1] = hiss * .9 + crk + proj * .95
mix = bus + BED
for c in range(2): mix[:, c] = X.limit(mix[:, c], .95)
mix = mix / np.abs(mix).max() * .89
nf = int(.025 * SR); mix[:nf] *= np.linspace(0, 1, nf)[:, None]    # no hit on sample 0
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
for a, c, n in [(0, 10, 'pings'), (10, 12.67, 'tuck'), (12.67, 18.67, 'tiptoe'), (18.67, 20, 'curtain'), (20, 23.33, 'STOP'), (23.33, 25.33, 'steam'), (25.33, 28.67, 'peek'), (29, 30, 'tail')]:
    print(f'{n:8s} {db(mix[int(a * SR):int(c * SR)]):6.1f} dB')
