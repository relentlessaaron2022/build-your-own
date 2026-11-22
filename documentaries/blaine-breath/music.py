"""music.py <events.json> <out.wav>: score and SFX for Built Different: The 17-Minute Breath (Halftone Dossier sound palette).
Synth pop-print toolkit, 96 BPM: kick/snare/clap/hat, square-ish 8th-note bass, triangle pad, a marimba-like pluck (fundamental + ~4x
partial), pizzicato and finger snaps for the sneaking open, bass + snaps only for the heat ball, a one-bar silence before the verdict
stamp, a music-box bell tag on the drawer. SFX: stamp booms (+ crackle on the big one), camera shutter, whooshes into wipes, ticks,
a drawer slide. Fully synthesized, seeded: no samples."""
import sys, json
import numpy as np, soundfile as sf
E = json.load(open(sys.argv[1])); SR = 44100; DUR = E['dur'] + .5; N = int(SR * DUR); mix = np.zeros(N); rng = np.random.default_rng(5)
ev = {}; [ev.setdefault(e['kind'], []).append(e['t']) for e in E['ev']]
S = [ev[f'sect{i}'][0] for i in range(12)]; ESS = ev['ess'][0]
BPM = 96; B = 60 / BPM; BAR = 4 * B
def add(x, t, g=1.):
    i = int(t * SR); j = min(N, i + len(x))
    if 0 <= i < N: mix[i:j] += x[:j - i] * g
T = lambda d: np.arange(int(SR * d)) / SR
def env(d, a, r): t = T(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
kick = lambda: np.sin(2 * np.pi * (50 + 90 * np.exp(-T(.35) * 30)) * T(.35)) * env(.35, .002, .12)
snare = lambda: (rng.uniform(-1, 1, int(SR * .2)) * .6 + np.sin(2 * np.pi * 190 * T(.2)) * .4) * env(.2, .001, .06)
hat = lambda: rng.uniform(-1, 1, int(SR * .05)) * env(.05, .0005, .012) * .5
snap = lambda: rng.uniform(-1, 1, int(SR * .06)) * env(.06, .0005, .01) * .9
def pluck(f, d=.5): t = T(d); return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 18)) * env(d, .002, .18)
def pizz(f, d=.3): t = T(d); return np.sign(np.sin(2 * np.pi * f * t)) * .25 * env(d, .002, .07) + np.sin(2 * np.pi * f * t) * env(d, .002, .09) * .5
def bass(f, d): t = T(d); return np.tanh(2.2 * np.sin(2 * np.pi * f * t)) * env(d, .004, d * .6)
def pad(fs, d): t = T(d); x = sum(2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t)) for f in fs) / len(fs); return x * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)
def bell(f, d=1.2): t = T(d); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) + .25 * np.sin(2 * np.pi * f * 5.4 * t)) * env(d, .002, .4)
# chord loop (C – Am – F – G), roots and pad notes
CH = [(65.4, [261.6, 329.6, 392]), (55, [220, 261.6, 329.6]), (87.3, [349.2, 440, 523.3]), (98, [392, 493.9, 587.3])]
MEL = [523.3, 659.3, 784, 659.3, 587.3, 523.3, 440, 523.3]
def section_of(t): return max(i for i in range(12) if S[i] <= t)
t = 0.; bar = 0
while t < S[10]:
    sec = section_of(t); root, notes = CH[bar % 4]
    silent = ESS - BAR <= t < ESS          # the silence before the verdict stamp
    if not silent:
        if sec in (0, 1):                  # sneaking open: pizzicato + snaps
            for k in range(8): add(pizz(notes[k % 3] / 2), t + k * B / 2, .35)
            for k in (1, 3): add(snap(), t + k * B, .5)
        elif sec == 5:                     # the heat ball: bass + snaps only, dark
            for k in range(8): add(bass(root, B / 2), t + k * B / 2, .32)
            for k in (1, 3): add(snap(), t + k * B, .55)
        elif sec in (7, 8):                # winter and verdict: pad + marimba
            add(pad(notes, BAR), t, .12); [add(pluck(MEL[(bar * 4 + k) % 8]), t + k * B, .22) for k in range(4)]
        elif sec in (2, 3, 4, 6):          # exhibits: kick, clap, hat, bass, marimba theme
            for k in range(4): add(kick(), t + k * B, .55)
            for k in (1, 3): add(snare(), t + k * B, .28)
            for k in range(8): add(hat(), t + k * B / 2, .3); add(bass(root, B / 2 * .9), t + k * B / 2, .22)
            add(pad(notes, BAR), t, .06); [add(pluck(MEL[(bar * 4 + k) % 8]), t + k * B, .18) for k in range(4) if (bar + k) % 3]
    t += BAR; bar += 1
# bell tag on the drawer, then the end card
for k, f in enumerate([784, 659.3, 523.3, 784, 1046.5]): add(bell(f), S[9] + 1.6 + k * B / 2, .25)
# SFX
def stamp(big=False):
    x = np.sin(2 * np.pi * (60 + 120 * np.exp(-T(.6) * 14)) * T(.6)) * env(.6, .002, .16) + rng.uniform(-1, 1, int(SR * .6)) * env(.6, .001, .02) * .5
    return x + (rng.uniform(-1, 1, len(x)) * env(.6, .001, .25) * .25 if big else 0)
def shutter(): return np.concatenate([rng.uniform(-1, 1, int(SR * .02)) * .8, np.zeros(int(SR * .04)), rng.uniform(-1, 1, int(SR * .03)) * .6]) * .7
def whoosh(): x = np.cumsum(rng.uniform(-1, 1, int(SR * .5))); x = x - np.convolve(x, np.ones(60) / 60, 'same'); return x / np.abs(x).max() * np.sin(np.pi * T(.5) / .5) ** 2 * .5
def tick(): return np.sin(2 * np.pi * 1800 * T(.03)) * env(.03, .0005, .008) * .5
def buzz(d=3.): t = T(d); f = 180 + 40 * np.sin(2 * np.pi * 7 * t); return np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / .3) * .25
def drawer(): x = rng.uniform(-1, 1, int(SR * .7)); x = np.convolve(x, np.ones(30) / 30, 'same'); y = x * np.sin(np.pi * T(.7) / .7) * .6; k = np.sin(2 * np.pi * 90 * T(.08)) * env(.08, .001, .03); i = int(SR * .62); y[i:i + len(k)] += k[:len(y) - i]; return y
for k, f, g in [('stamp', lambda: stamp(), .9), ('bigstamp', lambda: stamp(True), 1.1), ('shutter', shutter, .8), ('whoosh', whoosh, .5), ('tick', tick, .5), ('buzz', buzz, .8), ('drawer', drawer, .9)]:
    for t0 in ev.get(k, []): add(f(), t0 - (.15 if k == 'whoosh' else 0), g)
x = mix / (np.abs(mix).max() + 1e-9) * 1.6; x = np.tanh(x) * .9
fade = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1); x *= fade
sf.write(sys.argv[2], np.stack([x, x], 1), SR); print('score', DUR, 's,', sum(len(v) for v in ev.values()), 'cues')
