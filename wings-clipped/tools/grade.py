"""grade.py in.jpg out.jpg — the Broadcast News Package plate grade: greyscale → 0.5/99.6 % levels → γ 1.05 → 35 % S-curve → black 8 / white 232 → duotone #0E1013 → #ECE7D8"""
import sys, numpy as np
from PIL import Image
im = np.asarray(Image.open(sys.argv[1]).convert('L')).astype(np.float32) / 255
lo, hi = np.percentile(im, [.5, 99.6]); x = np.clip((im - lo) / max(1e-6, hi - lo), 0, 1) ** (1 / 1.05)
s = x * x * (3 - 2 * x); x = x + .35 * (s - x)
x = (8 + x * (232 - 8)) / 255
a, b = np.array([0x0E, 0x10, 0x13]) / 255, np.array([0xEC, 0xE7, 0xD8]) / 255
rgb = a + (b - a) * x[..., None]
Image.fromarray((rgb * 255).astype(np.uint8)).save(sys.argv[2], quality=90)
print(sys.argv[2], rgb.shape)
