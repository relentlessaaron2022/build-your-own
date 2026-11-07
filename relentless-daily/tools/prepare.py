"""prepare.py <episode folder> — turn a recording, media and a few notes into build.json for the renderer.

  1. voice: your recording (any format) → voice.wav. With no recording, a clearly marked AI placeholder is read from "script".
  2. words: transcribed with word timings (faster-whisper), so captions and cards land on the word.
  3. scenes: cut points spread over the narration and snapped to the pauses between words; video clips → frame sequences.
  4. quote card: the "quote" line is found in what you actually said.
  5. straps (Relentless Times look): each one starts on the phrase it names.
"""
import sys, os, json, re, glob, shutil, subprocess, difflib
import soundfile as sf
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
EP = os.path.abspath(sys.argv[1]); E = json.load(open(os.path.join(EP, 'episode.json')))
FPS, V0 = 30, .35
def sh(*a): subprocess.run([str(x) for x in a], check=True)
def norm(w): return re.sub(r"[^a-z0-9%$.]", '', w.lower()).strip('.')

# ---------- 1. voice ----------
src = E.get('voice'); placeholder = False
if src and os.path.exists(os.path.join(EP, src)):
    sh('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(EP, src), '-af', 'highpass=f=70,silenceremove=start_periods=1:start_threshold=-45dB' + (f",atempo={E['voice_speed']}" if E.get('voice_speed') else ''), '-ac', '1', '-ar', '48000', os.path.join(EP, 'voice.wav'))
else:
    placeholder = True
    sents = [s.strip() for s in re.findall(r'[^.!?]+[.!?]*', E['script']) if s.strip()]
    tmp = os.path.join(EP, '_tts'); os.makedirs(tmp, exist_ok=True)
    json.dump([{'id': f's{i:02d}', 'text': s, 'voice': E.get('ai_voice', 'am_michael'), 'speed': E.get('ai_speed', 1.0)} for i, s in enumerate(sents)], open(os.path.join(tmp, 'lines.json'), 'w'))
    sh(os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/tts/tts.py'), os.path.join(tmp, 'lines.json'), tmp)
    import numpy as np
    parts = []
    for i in range(len(sents)):
        y, sr = sf.read(os.path.join(tmp, f's{i:02d}.wav')); parts += [y, np.zeros(int(sr * .28))]
    sf.write(os.path.join(tmp, 'all.wav'), np.concatenate(parts), sr)
    sh('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(tmp, 'all.wav'), '-ac', '1', '-ar', '48000', os.path.join(EP, 'voice.wav'))
vdur = sf.info(os.path.join(EP, 'voice.wav')).duration

# ---------- 2. words ----------
from faster_whisper import WhisperModel
model = WhisperModel(E.get('asr_model', 'base.en'), device='cpu', compute_type='int8')
segs, _ = model.transcribe(os.path.join(EP, 'voice.wav'), word_timestamps=True, language='en', initial_prompt=E.get('vocab'), condition_on_previous_text=False)
words = [{'w': w.word.strip(), 's': round(w.start + V0, 3), 'e': round(w.end + V0, 3)} for sg in segs for w in sg.words if w.word.strip()]
for k, v in (E.get('spellings') or {}).items():                 # your corrections: {"misheard": "Right"}
    for w in words:
        if norm(w['w']) == norm(k): w['w'] = re.sub(re.escape(w['w'].strip('.,!?')), v, w['w'])
merged = []                                                     # whisper splits "$16.3", "co-founders", "50.1%": join the pieces
for w in words:
    if merged and (re.match(r"^[.,%'\-]", w['w']) or merged[-1]['w'].endswith('-')): merged[-1]['w'] += w['w']; merged[-1]['e'] = w['e']
    else: merged.append(dict(w))
words = merged
if E.get('script') and not placeholder:                        # captions use the script's words; the transcript gives only the timing
    S_ = E['script'].split(); a, b = [norm(w['w']) for w in words], [norm(x) for x in S_]; out = []
    for op, i0, i1, j0, j1 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == 'delete': continue
        if op == 'equal': out += [{'w': S_[j0 + k], 's': words[i0 + k]['s'], 'e': words[i0 + k]['e']} for k in range(i1 - i0)]; continue
        s0 = words[i0]['s'] if i0 < len(words) and i1 > i0 else (out[-1]['e'] if out else words[0]['s'])
        s1 = words[i1 - 1]['e'] if i1 > i0 else (words[i0]['s'] if i0 < len(words) else s0 + .3 * (j1 - j0))
        s1 = max(s1, s0 + .12 * (j1 - j0)); d = (s1 - s0) / (j1 - j0)
        out += [{'w': S_[j0 + k], 's': round(s0 + k * d, 3), 'e': round(s0 + (k + 1) * d, 3)} for k in range(j1 - j0)]
    words = out
if not words: sys.exit('prepare.py: no speech found in the recording')
vend = words[-1]['e']

def find(phrase):                                               # best-matching run of words → (i0, i1)
    q = [norm(x) for x in phrase.split() if norm(x)]; toks = [norm(w['w']) for w in words]; best = (0, None)
    for n in range(max(1, len(q) - 2), len(q) + 3):
        for i in range(0, len(toks) - n + 1):
            r = difflib.SequenceMatcher(None, q, toks[i:i + n]).ratio()
            if r > best[0]: best = (r, (i, i + n - 1))
    return best[1] if best[0] >= .55 else None

# ---------- 3. quote card (found first, so scenes are laid out around it) ----------
quote = None
if E.get('quote'):
    f = find(E['quote'])
    if f: quote = {'t0': round(words[f[0]]['s'] - .15, 3), 't1': round(words[f[1]]['e'] + 1.1, 3), 'i0': f[0], 'i1': f[1]}
    else: print('prepare.py: the quote line was not found in the recording; no quote card', file=sys.stderr)

# ---------- 4. scenes ----------
SC = E['scenes']; n = len(SC); wts = [s.get('weight', 1) for s in SC]; total = sum(wts)
gaps = [(words[i]['e'] + words[i + 1]['s']) / 2 for i in range(len(words) - 1)]
span0, span1 = 0, vend + .4; cuts, acc = [span0], 0
ql = (quote['t1'] - quote['t0']) if quote else 0
real = lambda x: x if not quote or x < quote['t0'] else x + ql   # scene time skips the quote card
inq = lambda g: quote and quote['t0'] - .4 < g < quote['t1']
for i in range(n - 1):
    acc += wts[i]; target = real(span0 + (span1 - ql - span0) * acc / total)
    near = [g for g in gaps if abs(g - target) < 1.3 and g > cuts[-1] + 1.2 and not inq(g)]
    cuts.append(min(near, key=lambda g: abs(g - target)) if near else target)
cuts.append(span1)
scenes = []
for i, s in enumerate(SC):
    o = {'t0': round(cuts[i], 3), 't1': round(cuts[i + 1], 3), 'motion': s.get('motion', E.get('motion', 'push'))}
    if 'at' in s:                                               # optional: start this scene on a phrase
        f = find(s['at'])
        if f: o['t0'] = round(words[f[0]]['s'] - .1, 3)
    m = s.get('media')
    if m and re.search(r'\.(mp4|mov|m4v|webm)$', m, re.I):
        fd = os.path.join(EP, '_frames', os.path.splitext(os.path.basename(m))[0]); shutil.rmtree(fd, ignore_errors=True); os.makedirs(fd)
        sh('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(EP, m), '-vf', f"fps={FPS},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920", '-q:v', '3', os.path.join(fd, '%05d.jpg'))
        o.update(kind='video', frames=os.path.relpath(fd, EP), nframes=len(glob.glob(os.path.join(fd, '*.jpg'))))
    elif m: o.update(kind='image', src=m)
    else: o.update(kind=s.get('type', 'text'), text=s.get('text', ''), value=s.get('value', ''), label=s.get('label', ''))
    scenes.append(o)
for i in range(1, n): scenes[i - 1]['t1'] = scenes[i]['t0']    # keep scenes contiguous after any "at"

# ---------- 5. straps, captions ----------
straps = []
for st in E.get('straps', []):
    f = find(st['at']) if st.get('at') else (0, 0)
    if f: straps.append({**st, 't0': round(words[f[0]]['s'] - .1, 3)})
straps.sort(key=lambda s: s['t0'])
for i, st in enumerate(straps): st['t1'] = round(min(straps[i + 1]['t0'] - .15 if i + 1 < len(straps) else vend + .3, st['t0'] + st.get('hold', 9)), 3)
caps, g = [], []
for i, w in enumerate(words):
    if quote and quote['i0'] <= i <= quote['i1']: continue
    if g and (len(g) >= 3 or re.search(r'[.,!?;:]$', g[-1]['w']) or w['s'] - g[-1]['e'] > .4 or sum(len(x['w']) for x in g) + len(w['w']) > 18):
        caps.append(g); g = []
    g.append({**w, 'i': i})
if g: caps.append(g)
caps = [{'t0': c[0]['s'] - .06, 't1': c[-1]['e'] + .12, 'words': c} for c in caps]
for i in range(len(caps) - 1): caps[i]['t1'] = min(caps[i]['t1'] + .25, caps[i + 1]['t0'])

dur = vend + .55 + 3.4
B = {k: E.get(k) for k in ('look', 'series', 'episode', 'title', 'cta', 'handle', 'tagline', 'sources', 'music', 'music_db')}
B.update(dur=round(dur, 3), v0=V0, vend=round(vend, 3), end0=round(vend + .55, 3), placeholder=placeholder, words=words, caps=caps, scenes=scenes, quote=quote, straps=straps,
         quote_words=[words[i] for i in range(quote['i0'], quote['i1'] + 1)] if quote else [])
json.dump(B, open(os.path.join(EP, 'build.json'), 'w'), indent=1)
print(f"prepared {os.path.basename(EP)}: {len(words)} words, {n} scenes, {dur:.1f} s{' (AI PLACEHOLDER VOICE)' if placeholder else ''}{', quote card' if quote else ''}")
