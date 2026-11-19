import subprocess, sys, json
import numpy as np
src, out = sys.argv[1], sys.argv[2]
w, h = 480, 270
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps=10,scale={w}:{h}",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
rows = []; n = 0
while True:
    b = p.stdout.read(w * h * 3)
    if len(b) < w * h * 3: break
    f = np.frombuffer(b, np.uint8).reshape(h, w, 3).astype(np.int16)
    lum = f.mean(2)
    strips = [float((lum[:, i*60:(i+1)*60] < 32).mean()) for i in range(8)]
    # bullet text region (1920 coords /4): x 330-1600, y 700-990
    reg = f[175:248, 82:400]
    r, g, bb = reg[..., 0], reg[..., 1], reg[..., 2]
    cream = float(((r > 200) & (g > 190) & (bb > 160) & ((r - bb) < 70)).mean())
    dots = float(((r > 200) & (g > 150) & (bb < 120)).mean())
    # bullet dot column x~370-395 (1920) -> 92-99
    dotcol = f[175:248, 90:101]; dc = float(((dotcol[..., 0] > 190) & (dotcol[..., 1] > 140) & (dotcol[..., 2] < 130)).mean())
    t = f[105:165, 70:410]
    gold = float(((t[..., 0] > 200) & (t[..., 1] > 150) & (t[..., 2] < 120)).mean())
    rows.append(dict(t=n / 10, strips=strips, cream=cream, dotcol=dc, gold=gold))
    n += 1
json.dump(rows, open(out, "w"))
print(n)
