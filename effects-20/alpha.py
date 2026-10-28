"""alpha.py masks_dir — rewrite each grayscale mask as white RGBA with alpha = mask (so the page can use it with destination-in)."""
import sys, os, glob, cv2, numpy as np
for f in sorted(glob.glob(os.path.join(sys.argv[1], 'f*.png'))):
    m = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    if m.ndim == 3: continue
    rgba = np.dstack([np.full_like(m, 255)] * 3 + [m])
    cv2.imwrite(f, rgba)
print('ok')
