"""track.py masks_dir out.json — per frame: head centre (x, y) and head top, in source pixels (720x1280), smoothed."""
import sys, os, glob, json, cv2, numpy as np
files = sorted(glob.glob(os.path.join(sys.argv[1], 'f*.png')))
raw = []
for f in files:
    m = cv2.imread(f, 0) > 128
    ys = np.where(m.any(1))[0]
    if len(ys) == 0: raw.append(raw[-1] if raw else (360, 420, 200)); continue
    top = ys[0]; band = m[top:top + 260]
    cols = np.where(band.any(0))[0]
    xs = np.nonzero(band)[1]
    raw.append((float(xs.mean()), float(top + 150), float(top)))
a = np.array(raw)
k = 7; pad = np.pad(a, ((k, k), (0, 0)), mode='edge')
sm = np.stack([pad[i:i + 2 * k + 1].mean(0) for i in range(len(a))])
json.dump([[round(x, 1) for x in r] for r in sm.tolist()], open(sys.argv[2], 'w'))
print(len(sm), 'frames; sample', sm[300].round(1), sm[600].round(1))
