"""mix.py <episode folder> — your voice up front, an optional music bed ducked under it, and a light sound-design layer
(riser into the title, a whoosh on every cut, an impact on stat cards, a soft pop on the quote card, a chime on the end card) → mix.wav."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add, compress, limit
EP = os.path.abspath(sys.argv[1]); B = json.load(open(os.path.join(EP, 'build.json'))); E = json.load(open(os.path.join(EP, 'events.json')))['ev']
N = int(round(B['dur'] * SR)); R = np.random.default_rng(3); VO = np.zeros((N, 2)); FX = np.zeros((N, 2)); MU = np.zeros((N, 2))
def noise(d): return R.standard_normal(len(t_(d)))
def whoosh(d=.45): tt = t_(d); return norm(bp(noise(d), 300, 6000) * np.sin(np.pi * tt / d) ** 2)
def rise(d=.9): tt = t_(d); return norm(bp(noise(d), 800, 9000) * (tt / d) ** 2 * np.exp(-((tt - d) / .08) ** 2 * 0 + 0))
def hit(): d = .6; tt = t_(d); return norm(np.sin(2 * np.pi * 55 * tt) * env_exp(d, .18) + lp(noise(d), 900) * env_exp(d, .04) * .6)
def pop(): d = .18; tt = t_(d); f = 600 + 900 * np.exp(-tt / .02); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .05))
def chime(): d = 1.6; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * env_exp(d, .5 / (j + 1)) / (j + 1) for j, f in enumerate([880, 1320, 1760, 2640])))
y, sr = sf.read(os.path.join(EP, 'voice.wav')); y = y.mean(1) if y.ndim > 1 else y
y = soxr.resample(y, sr, SR); y = hp(y, 80); y = compress(norm(y, .9), .25, 3.0); add(VO, y, B['v0'], 1.0)
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'cut': add(FX, whoosh(), t - .22, .22, (R.random() - .5) * .5)
    elif ty == 'rise': add(FX, rise(), 0, .18)
    elif ty == 'hit': add(FX, hit(), t, .45)
    elif ty == 'pop': add(FX, pop(), t, .25)
    elif ty == 'chime': add(FX, chime(), t, .22)
if B.get('music') and os.path.exists(os.path.join(EP, B['music'])):
    m, msr = sf.read(os.path.join(EP, B['music'])); m = m if m.ndim > 1 else np.stack([m, m], 1); m = soxr.resample(m, msr, SR)
    m = np.tile(m, (int(np.ceil(N / len(m))), 1))[:N]
    env = np.abs(VO[:, 0]); k = int(.25 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); duck = 1 - .6 * np.clip(env / (env.max() * .35 + 1e-9), 0, 1)
    fade = np.clip(np.arange(N) / (SR * 1.0), 0, 1) * np.clip((N - np.arange(N)) / (SR * 2.0), 0, 1)
    MU = m / (np.abs(m).max() + 1e-9) * 10 ** (B.get('music_db', -17) / 20) * (duck * fade)[:, None]
room = lp(R.standard_normal(N), 300) * .003; FX[:, 0] += room; FX[:, 1] += room
mix = VO + FX + MU
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
mix = mix / np.abs(mix).max() * .89
sf.write(os.path.join(EP, 'mix.wav'), mix.astype(np.float32), SR); print('mix', round(B['dur'], 2), 's')
