"""Keep the Lights On, Ep. 1: original score. A sly hot-jazz trio, 90 BPM, 4/4, D minor.
Upright bass (jazz_bass), brushes (snare2 taps, sus_cymbal), muted trumpet with a plunger "wah", clarinet, trombone smear,
vibraphone, xylophone pings, woodblock. Times come from the same 90 BPM grid as story.js.
Run: $LIB/.venv/bin/python music/score.py  (with LIB set). Output: music/score.wav"""
import os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp

HERE = os.path.dirname(os.path.abspath(__file__))
BEAT = 60 / 90
def b(n): return n * BEAT
DUR = 30.0
N = int(DUR * SR)
mus = np.zeros((N, 2), np.float32)
S.seed(11)
rng = np.random.default_rng(5)
def hum(t, a=.006): return t + float(rng.uniform(-a, a))

def note(inst, p, t, d, v=.6, g=1., pan=0., **kw): add(mus, S.note(inst, p, d, vel=v, **kw), hum(t), g, pan)
def hit(inst, var, t, v=.6, g=1., pan=0.): add(mus, S.hit(inst, var, vel=v), hum(t, .004), g, pan)

def wah(x, d, open_at=.45):
    """plunger mute: closed (dark) → open (bright) over the note"""
    n = len(x); tt = np.arange(n) / SR
    o = np.clip(tt / max(.05, d * open_at), 0, 1) ** 1.5
    dark = lp(x, 700)
    return (dark + (x - dark) * o).astype(np.float32)
def trumpet_wah(p, t, d, v=.6, g=1., pan=.2):
    x = S.note('trumpet_mute', p, d, vel=v); add(mus, wah(x, d), hum(t) - .02, g, pan)
def glide(x, semis_end, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    ratio = 2 ** (np.interp(tt, [0, dur * .25, dur], [0, 0, semis_end]) / 12)
    pos = np.cumsum(ratio); pos = pos[pos < len(x) - 2]
    i = pos.astype(int); f = pos - i; y = x[i] * (1 - f) + x[i + 1] * f
    fade = min(len(y), int(.06 * SR)); y[-fade:] *= np.linspace(1, 0, fade)
    return y.astype(np.float32)

# ——— A: the bed, three pings (beats 0–15) ———
walk = [('D2', 'A1'), ('F2', 'C2'), ('G2', 'D2'), ('A1', 'E2')]
for bar in range(4):
    r, f = walk[bar % 4]
    note('jazz_bass', r, b(bar * 4), BEAT * 1.8, .62, 1.0, -.1)
    note('jazz_bass', f, b(bar * 4 + 2), BEAT * 1.8, .55, 1.0, -.1)
for k in range(15):
    hit('sus_cymbal', 'stick', b(k), .18, .35, .35)
    if k % 2 == 1: hit('snare2', 'taps', b(k), .34, .6, .15)
pings = [b(2), b(6), b(10)]
for t, (xp, tp, dd) in zip(pings, [('A5', 'A4', .55), ('C6', 'C5', .7), ('D6', 'D5', 1.1)]):
    note('xylophone', xp, t, .5, .85, .9, .25)
    trumpet_wah(tp, t + .12, dd, .62, .9, .2)
# third ping: the trumpet smears up into a little brag
x = S.note('trumpet_mute', 'D5', 1.4, vel=.6); add(mus, wah(glide(x, 3, 1.3), 1.3), b(10) + .9, .6, .2)
# clarinet: a sly two-bar motif between pings, then a trill as the phone eyes the bathroom
for i, (p, dt) in enumerate([('D4', 0), ('F4', .5), ('A4', 1), ('G#4', 1.5), ('A4', 2), ('F4', 2.75)]):
    note('clarinet', p, b(3) + dt * BEAT, BEAT * .45, .45, .7, -.25)
for k in range(10):
    note('clarinet', 'D5' if k % 2 == 0 else 'E5', b(12.5) + k * BEAT / 6, BEAT / 6 * .95, .38, .55, -.25)

# ——— B: lock, tuck (beats 15–19) ———
hit('woodblock', 'a', b(15), .85, 1.0, .1)
note('jazz_bass', 'D2', b(15), BEAT, .6, .9, -.1)
tb = S.note('trombone', 'D4', 1.2, vel=.55); add(mus, glide(tb, -5, BEAT * 1.0), b(16), .75, -.15)
note('jazz_bass', 'D1', b(17), BEAT * 1.5, .75, 1.1, -.1)
hit('snare2', 'off', b(17), .3, .5, 0)

# ——— C: tiptoe (beats 19–28) ———
for i, p in enumerate(['D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2']):
    note('jazz_bass', p, b(20 + i), BEAT * .35, .66, 1.0, -.1)
    hit('sus_cymbal', 'stick', b(20 + i) + BEAT / 2, .14, .3, .35)
sneak = ['D4', None, 'F4', None, 'A4', 'G#4', 'A4', None]
for bar in range(2):
    for k, p in enumerate(sneak):
        if p: note('clarinet', p, b(20 + bar * 4) + k * BEAT / 2, BEAT * .3, .42, .7, -.25)
note('clarinet', 'A4', b(28), BEAT * 2.0, .4, .65, -.25, attack=.15)
hit('sus_cymbal', 'cresc', b(28), .35, .35, .3)

# ——— D: the band stops dead (beats 30–35), then one low warm note ———
# (everything is gated to silence at beat 30 below)
note('trombone', 'D3', b(35), BEAT * 3, .42, .7, -.1, attack=.4)
for p in ['D4', 'F4', 'A4', 'C5', 'E5']: note('vibraphone', p, b(35) + .02, BEAT * 3, .35, .5, .2)

# ——— E: the pillow, the peek, the blink (beats 38–43) ———
for k, p in [(38, 'D2'), (40, 'A1'), (42, 'D2')]: note('jazz_bass', p, b(k), BEAT * 1.6, .5, .85, -.1)
for k in (39, 41): hit('snare2', 'taps', b(k), .28, .45, .15)
for k in range(8): note('clarinet', 'D5' if k % 2 == 0 else 'E5', b(41) + k * BEAT / 8, BEAT / 8 * .95, .36, .55, -.25)

# gates: hard stop at beat 30 (until beat 35), and at the blink everything stops but the last ping
def gate(a, c, fade=.012):
    i0, i1, nf = int(a * SR), int(c * SR), int(fade * SR)
    mus[i0:i0 + nf] *= np.linspace(1, 0, nf)[:, None]; mus[i0 + nf:i1] = 0
gate(b(30), b(35))
gate(b(43), DUR)
note('xylophone', 'D6', b(43), 1.2, .9, 1.0, .1)
note('xylophone', 'A6', b(43) + .01, 1.0, .5, .45, .1)

mus = np.stack([limit(mus[:, c], .95) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'score.wav'), mus.astype(np.float32), SR)
print('score.wav', mus.shape, 'peak', round(float(np.abs(mus).max()), 3))
open(os.path.join(HERE, 'CREDITS.txt'), 'w').write('\n'.join(S.credits(['jazz_bass', 'sus_cymbal', 'snare2', 'xylophone', 'trumpet_mute', 'clarinet', 'trombone', 'vibraphone', 'woodblock'])) + '\n')
