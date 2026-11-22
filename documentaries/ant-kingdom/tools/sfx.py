"""sfx.py <events.json> <out.wav>: synthesized sound for The Ant Kingdom. Nothing sampled, nothing to license.
whoosh: camera moves · slam: titles landing · stamp: rubber-stamp thud · drop: a print pinned to the board ·
count: a fast ticker · string: a taut red string pulled tight. Under it all, a low two-chord score that breathes."""
import sys, json
import numpy as np, soundfile as sf
E = json.load(open(sys.argv[1])); SR = 48000; dur = E['dur'] + 1; mix = np.zeros((int(SR * dur), 2))
rng = np.random.default_rng(7)
def env(n, a, r): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
from scipy.signal import lfilter
def lp(x, k): return lfilter([k], [1, -(1 - k)], x)
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR); j = min(len(mix), i + len(x))
    if 0 <= i < len(mix): mix[i:j, 0] += x[:j - i] * g * (1 - pan); mix[i:j, 1] += x[:j - i] * g * (1 + pan)
n = lambda s: int(SR * s)
t_ = lambda s: np.arange(n(s)) / SR
WHOOSH = lp(rng.uniform(-1, 1, n(1.4)), .05) * np.sin(np.pi * np.clip(t_(1.4) / 1.4, 0, 1)) ** 2 * 1.6
SLAM = np.sin(2 * np.pi * 55 * t_(.9) * (1 - .3 * t_(.9))) * env(n(.9), .003, .25) * .9 + lp(rng.uniform(-1, 1, n(.9)), .3) * env(n(.9), .001, .05) * .5
STAMP = np.sin(2 * np.pi * 90 * t_(.4)) * env(n(.4), .002, .07) * .8 + lp(rng.uniform(-1, 1, n(.4)), .5) * env(n(.4), .001, .03) * .6
DROP = lp(rng.uniform(-1, 1, n(.3)), .25) * env(n(.3), .002, .04) * .5 + np.sin(2 * np.pi * 180 * t_(.3)) * env(n(.3), .002, .05) * .25
TICK = np.concatenate([np.sin(2 * np.pi * 2400 * t_(.012)) * env(n(.012), .0005, .004) * .25, np.zeros(n(.06))])
STRING = np.sin(2 * np.pi * (220 + 80 * t_(.9)) * t_(.9)) * env(n(.9), .01, .35) * .12
for e in E['ev']:
    k, t = e['kind'], e['t']
    if k == 'whoosh': put(WHOOSH, t - .5, .22, rng.uniform(-.3, .3))
    elif k == 'slam': put(SLAM, t, .5)
    elif k == 'stamp': put(STAMP, t, .6)
    elif k == 'drop': put(DROP, t, .5, rng.uniform(-.2, .2))
    elif k == 'count': [put(TICK, t + i * .07, .6) for i in range(30)]
    elif k == 'string': put(STRING, t, .6)
# the score: two minor chords that swell and fall every 16 s, a soft pulse, faded in and out
T = np.arange(len(mix)) / SR
chords = [[55, 82.4, 110, 130.8], [49, 73.4, 98, 116.5]]
which = (T // 16).astype(int) % 2
pad = np.zeros(len(mix))
for ci, ch in enumerate(chords):
    m = (which == ci).astype(float); m = lp(m, .0004)
    for f in ch: pad += m * (np.sin(2 * np.pi * f * T) + .3 * np.sin(2 * np.pi * 2 * f * T + 1)) / len(ch)
swell = .55 + .45 * np.sin(2 * np.pi * T / 16 - np.pi / 2) ** 2
pulse = .85 + .15 * np.sin(2 * np.pi * T * (72 / 60))
fade = np.clip(T / 4, 0, 1) * np.clip((dur - T) / 5, 0, 1)
score = pad * swell * pulse * fade * .07
mix[:, 0] += score; mix[:, 1] += score
mix = np.tanh(mix * 1.1) * .8
sf.write(sys.argv[2], mix, SR); print(f'sfx: {len(E["ev"])} cues, {dur:.1f} s')
