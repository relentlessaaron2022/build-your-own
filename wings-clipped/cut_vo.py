"""cut_vo.py — the 90 s cut of the host's voiceover: segments of vo_full.wav joined with short pauses → vo.wav + vo_segments.json"""
import os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
SEGS = [  # (start, end) in the full recording, each a whole sentence or phrase
    ('hook', 0.00, 9.10), ('call', 22.60, 31.80), ('gift', 38.65, 45.05), ('who', 84.70, 88.75), ('flight', 89.50, 95.80),
    ('note', 129.65, 139.65), ('total', 185.95, 193.20), ('arrest', 200.85, 213.55), ('sheriff', 220.20, 226.15),
    ('innocent', 230.70, 236.30), ('close', 276.75, 288.80)]
GAP = {'flight': .12}            # pause before a segment (default .22 s)
LEAD = .8                       # sting before the first word
x, sr = sf.read(os.path.join(HERE, 'vo_full.wav'))
out = [np.zeros(int(LEAD * sr))]; t = LEAD; table = []
for name, a, b in SEGS:
    if table: g = GAP.get(name, .22); out.append(np.zeros(int(g * sr))); t += g
    y = x[int(a * sr):int(b * sr)].copy(); f = int(.02 * sr); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    table.append({'id': name, 'src': [a, b], 't': round(t, 3), 'dur': round(len(y) / sr, 3)}); out.append(y); t += len(y) / sr
y = np.concatenate(out); sf.write(os.path.join(HERE, 'vo.wav'), y.astype(np.float32), sr)
json.dump(table, open(os.path.join(HERE, 'vo_segments.json'), 'w'), indent=1)
print('vo.wav', round(len(y) / sr, 2), 's'); [print(s['id'], s['t'], s['dur']) for s in table]
