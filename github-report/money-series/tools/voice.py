# voice.py <script.txt> <out.wav> [voice] [speed]: the avatar reads the script (Kokoro), sentence by sentence, with natural pauses
import sys, os, re, json, subprocess, tempfile
import numpy as np, soundfile as sf
src, out = sys.argv[1], sys.argv[2]; voice = sys.argv[3] if len(sys.argv) > 3 else 'af_heart'; speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
paras = [p.strip() for p in open(src).read().split('\n') if p.strip()]
lines, gaps = [], []
for pi, p in enumerate(paras):
    ss = [s.strip() for s in re.findall(r'[^.!?]+[.!?]*', p) if s.strip()]
    for si, s in enumerate(ss): lines.append(s); gaps.append(.7 if si == len(ss) - 1 else .28)
tmp = tempfile.mkdtemp(); json.dump([{'id': f's{i:03d}', 'text': s, 'voice': voice, 'speed': speed} for i, s in enumerate(lines)], open(f'{tmp}/l.json', 'w'))
subprocess.run(['/root/lemo-opuscar/.venv/bin/python', '/root/lemo-opuscar/core/tts/tts.py', f'{tmp}/l.json', tmp], check=True, stdout=subprocess.DEVNULL)
parts = []
for i, g in enumerate(gaps):
    y, sr = sf.read(f'{tmp}/s{i:03d}.wav'); parts += [y, np.zeros(int(sr * g))]
sf.write(out, np.concatenate(parts), sr); print(f'{len(lines)} sentences, {sum(len(p) for p in parts) / sr:.1f} s')
