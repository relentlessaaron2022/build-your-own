"""Glass widgets v3 - full episode render for The GitHub Report EP 08.
Usage: python3 glass3.py <input> <output> <avatar.png> [start dur]
"""
import sys, subprocess, glob, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
INK = (22, 22, 28); GREY = (72, 72, 82); LIGHT = (0, 0, 0, 30)
RED = (226, 62, 45); ORANGE = (242, 120, 70); GREEN = (52, 199, 89)
RAD = 42
_fc = {}
def font(weight, size):
    k = (weight, size)
    if k not in _fc:
        p = glob.glob(f"/usr/share/fonts/**/Inter-{weight}.otf", recursive=True)
        _fc[k] = ImageFont.truetype(p[0], size)
    return _fc[k]

def clamp(x): return max(0.0, min(1.0, x))
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_back(x): x = clamp(x); c = 1.4; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def fit(d, txt, weight, size, maxw):
    while size > 14 and d.textlength(txt, font=font(weight, size)) > maxw: size -= 2
    return font(weight, size)
def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

# ---------------- painters: f(d, img, w, h, p, **kw) ----------------
def p_brand(d, img, w, h, p):
    d.ellipse((34, 40, 52, 58), fill=ORANGE)
    d.text((64, 49), "The GitHub Report", font=font("SemiBold", 30), fill=INK, anchor="lm")
    ep = "Episode " + f"{int(round(8 * ease_out(p))):02d}"; d.text((30, 80), ep, font=fit(d, "Episode 08", "Black", 84, w - 60), fill=INK)
    d.text((36, h - 38), "New tools every day", font=font("Medium", 30), fill=GREY, anchor="lm")

AVATAR = None
def circle_mask(s):
    m = Image.new("L", (s * 4, s * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, s * 4, s * 4), fill=255)
    return m.resize((s, s), Image.LANCZOS)
def p_profile(d, img, w, h, p):
    s = h - 56; cy = h // 2
    img.paste(AVATAR.resize((s, s), Image.LANCZOS), (28, 28), circle_mask(s))
    d.ellipse((28, 28, 28 + s, 28 + s), outline=(255, 255, 255, 230), width=3)
    d.text((s + 52, cy - 22), "Stormi Diamondz", font=font("Bold", 34), fill=INK, anchor="lm")
    d.text((s + 52, cy + 24), "Your host · EP 08", font=font("Medium", 27), fill=GREY, anchor="lm")

def p_bignum(d, img, w, h, p):
    d.ellipse((34, 40, 52, 58), fill=ORANGE)
    d.text((64, 49), "On the board", font=font("SemiBold", 30), fill=INK, anchor="lm")
    d.text((26, 72), str(int(round(129 * ease_out(p)))), font=font("Black", 116), fill=INK)
    d.text((36, h - 36), "tools on the board", font=font("Medium", 29), fill=GREY, anchor="lm")

def p_progress(d, img, w, h, p):
    blink = 255 if (int(p * 8) % 2 == 0 or p >= 1) else 110
    d.ellipse((34, 42, 52, 60), fill=RED + (blink,))
    d.text((66, 51), "Vetting today" if p < 1 else "Vetted today", font=font("SemiBold", 32), fill=INK, anchor="lm")
    d.rounded_rectangle((34, 92, w - 34, 106), 7, fill=LIGHT)
    q = ease_out(p); d.rounded_rectangle((34, 92, 34 + max(14, (w - 68) * q), 106), 7, fill=ORANGE)
    d.text((36, 138), f"+{int(round(7 * q))} tools  ·  {int(round(100 * q))}%", font=font("Medium", 28), fill=GREY, anchor="lm")

def p_minring(d, img, w, h, p):
    cy = h // 2; r = h // 2 - 26; cx = 28 + r
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=LIGHT, width=14)
    q = ease_out(p)
    if q > 0.01: d.arc((cx - r, cy - r, cx + r, cy + r), -90, -90 + 360 * q, fill=GREEN, width=14)
    d.text((cx, cy + 2), "$0", font=font("ExtraBold", 40), fill=INK, anchor="mm")
    d.text((cx + r + 30, cy - 20), "Spent today", font=font("Bold", 32), fill=INK, anchor="lm")
    d.text((cx + r + 30, cy + 22), "0 installs", font=fit(d, "0 installs", "Medium", 27, w - (cx + r + 30) - 30), fill=GREY, anchor="lm")

BOARD = [68606, 282781, 53415, 8240, 8038, 60803, 12938]
def p_stars(d, img, w, h, p, n, meta, idx):
    star(d, 50, 52, 16, ORANGE)
    d.text((76, 52), "GitHub stars", font=font("SemiBold", 30), fill=INK, anchor="lm")
    d.text((30, 84), f"{int(round(n * ease_out(p))):,}", font=fit(d, f"{n:,}", "ExtraBold", 78, w - 60), fill=RED)
    d.text((36, 186), meta, font=font("Medium", 26), fill=GREY, anchor="lm")
    base, top = h - 34, 222; n_ = len(BOARD); gap = 14; bw = (w - 72 - gap * (n_ - 1)) / n_; x = 36
    mx = max(BOARD)
    for i, s in enumerate(BOARD):
        q = ease_out(p * 1.7 - i * 0.08)
        bh = max(8, (base - top) * (s / mx) ** 0.42 * q)
        col = (RED if i == idx else (0, 0, 0, 38))
        d.rounded_rectangle((x, base - bh, x + bw, base), 6, fill=col)
        x += bw + gap

def p_repo(d, img, w, h, p, cat, name, desc):
    d.text((34, 46), cat.upper(), font=font("Bold", 24), fill=ORANGE, anchor="lm")
    d.text((32, 92), name, font=fit(d, name, "ExtraBold", 46, w - 64), fill=INK, anchor="lm")
    d.text((34, 140), desc, font=fit(d, desc, "Medium", 28, w - 68), fill=GREY, anchor="lm")

def p_topic(d, img, w, h, p, i, total=6):
    d.text((34, 44), f"Tool {i} of {total}", font=font("Bold", 30), fill=INK, anchor="lm")
    seg_w = (w - 68 - 10 * (total - 1)) / total; x = 34
    for k in range(1, total + 1):
        d.rounded_rectangle((x, 82, x + seg_w, 96), 7, fill=LIGHT)
        if k < i: d.rounded_rectangle((x, 82, x + seg_w, 96), 7, fill=ORANGE)
        elif k == i:
            q = ease_out(p); d.rounded_rectangle((x, 82, x + max(14, seg_w * q), 96), 7, fill=ORANGE)
        x += seg_w + 10

def p_trend(d, img, w, h, p):
    d.text((34, 44), "Trending today", font=font("Bold", 30), fill=INK, anchor="lm")
    d.text((w - 34, h // 2 + 2), "#1", font=font("Black", 76), fill=RED, anchor="rm")
    d.text((34, 96), "Top repo of the day", font=font("Medium", 27), fill=GREY, anchor="lm")

def p_copycats(d, img, w, h, p):
    d.text((34, 46), "COPYCAT REPOS", font=font("Bold", 24), fill=RED, anchor="lm")
    d.text((28, 70), f"x{int(round(10 * ease_out(p)))}", font=font("Black", 120), fill=INK)
    d.text((36, h - 36), "Blender ring · still collecting", font=fit(d, "Blender ring · still collecting", "Medium", 28, w - 70), fill=GREY, anchor="lm")

def p_caution(d, img, w, h, p):
    d.polygon([(34, 60), (52, 28), (70, 60)], fill=RED)
    d.text((52, 52), "!", font=font("Black", 22), fill=(255, 255, 255), anchor="mm")
    d.text((84, 46), "One caution", font=font("Bold", 30), fill=INK, anchor="lm")
    d.text((32, 96), "LoopForge", font=font("ExtraBold", 44), fill=INK, anchor="lm")
    d.text((34, 140), "All rights reserved · not open", font=fit(d, "All rights reserved · not open", "Medium", 27, w - 68), fill=RED, anchor="lm")

def p_bullets(d, img, w, h, p, lines):
    lh = (h - 64) / 3
    for i, txt in enumerate(lines):
        q = ease_out(p * 2.2 - i * 0.3)
        if q <= 0: continue
        col = RED if ("stars" in txt and txt[0].isdigit()) else INK
        cy = 32 + lh * i + lh / 2; dx = int((1 - q) * 26); al = int(255 * q)
        d.ellipse((46 + dx, cy - 10, 66 + dx, cy + 10), fill=ORANGE + (al,))
        d.text((88 + dx, cy), txt, font=font("SemiBold", 54), fill=col + (al,), anchor="lm")

# ---------------- layout ----------------
L_TALL = (56, 56, 500, 400); L_MID = (56, 56, 500, 316)
R1 = (1420, 56, 1864, 226); R2 = (1420, 246, 1864, 386); R1P = (1420, 56, 1864, 196)

def repo_scene(cat, name, desc, n, meta, idx, topic):
    right2 = (R2, p_trend, {}) if topic == 0 else (R2, p_topic, dict(i=topic))
    return [(L_TALL, p_stars, dict(n=n, meta=meta, idx=idx)),
            (R1, p_repo, dict(cat=cat, name=name, desc=desc)), right2]
STATS = [(L_MID, p_bignum, {}), (R1, p_progress, {}), (R2, p_minring, {})]
SCENES = [  # key, spans, cards
    ("intro", [(4.3, 10.2)], [(L_MID, p_brand, {}), (R1P, p_profile, {})]),
    ("stats", [(18.7, 24.9)], STATS),
    ("l30", [(25.1, 30.0), (38.4, 52.1), (60.3, 66.0)],
     repo_scene("Headline", "last30days", "Reads the room before it reads you", 68606, "MIT · pushed Nov 17", 0, 0)),
    ("deepseek", [(72.4, 78.3), (85.4, 88.4)],
     repo_scene("1 · Agents", "DeepSeek Harness", "Plugin-based agent harness", 282781, "MIT · pushed Nov 13", 1, 1)),
    ("ocr", [(88.6, 93.4), (100.6, 106.3)],
     repo_scene("2 · Code review", "open-code-review", "Deterministic checks + LLM agent", 53415, "Apache 2.0 · pushed Nov 17", 2, 2)),
    ("bug", [(106.5, 111.3), (118.6, 122.1)],
     repo_scene("3 · Security", "claude-bughunter", "82 skills for bug hunting", 8240, "MIT · pushed Nov 16", 3, 3)),
    ("film", [(122.3, 128.1), (136.4, 143.2)],
     repo_scene("4 · Film", "OpenFilm", "Your coding agent becomes a video", 8038, "MIT · pushed Nov 16", 4, 4)),
    ("voice", [(143.4, 150.6), (158.6, 164.5)],
     repo_scene("5 · Voice", "Voicebox", "Local voice studio · 23 languages", 60803, "MIT · Intel Mac installer", 5, 5)),
    ("books", [(170.5, 176.4), (184.9, 190.6)],
     repo_scene("6 · Books", "cangjie-skill", "Books into agent skills", 12938, "MIT · books · video · podcasts", 6, 6)),
    ("caution", [(190.8, 197.9), (206.0, 210.7)], [(L_MID, p_copycats, {}), (R1, p_caution, {})]),
    ("wrap", [(216.1, 222.8), (232.1, 242.2)], STATS),
]
BUL = {
    "A": ["Researches any topic, anywhere", "68,606 stars", "#1 trending repo of the day"],
    "B": ["Grounded in real conversation", "Free with no key at all", "Receipts, not editors"],
    "C": ["One control room for agents", "282,781 stars", "Local web UI, MCP starters"],
    "D": ["Deterministic checks, free", "53,415 stars", "Line-level comments"],
    "E": ["82 skills for bug hunting", "8,240 stars", "Built from 681 reports"],
    "F": ["Coding agent as video agent", "8,038 stars", "Render is free"],
    "G": ["Local voice studio", "60,803 stars", "Runs on your machines"],
    "H": ["Books into agent skills", "12,938 stars", "Your shelf, working knowledge"],
    "I": ["Trending is a signal, not a verdict", "LoopForge: no open license", "Blender ring still collecting stars"],
    "J": ["129 tools on the board", "$0 spent", "Nothing without your word"],
}
# original dark box x-extent per set (1920 px), from frame measurements
BOXX = {"A": (330, 1590), "B": (370, 1550), "C": (400, 1516), "D": (470, 1480), "E": (470, 1450),
        "F": (400, 1524), "G": (490, 1430), "H": (360, 1560), "I": (320, 1610), "J": (430, 1490)}
BULLET_SPANS = [("A", 24.8, 30.1), ("A", 38.3, 45.8), ("B", 45.9, 52.3), ("B", 60.2, 66.2), ("C", 73.0, 78.4), ("C", 85.2, 88.1), ("D", 88.0, 93.6), ("D", 100.5, 106.2), ("E", 106.1, 111.4), ("E", 118.5, 122.9), ("F", 122.8, 128.3), ("F", 136.3, 144.3), ("G", 144.2, 150.6), ("G", 158.5, 164.6), ("H", 171.3, 176.6), ("H", 184.8, 191.5), ("I", 191.6, 198.1), ("I", 205.8, 210.9), ("J", 216.6, 223.0), ("J", 232.0, 242.2)]

def bullet_box(k):
    x0, x1 = BOXX[k]
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    tw = max(d.textlength(s, font=font("SemiBold", 54)) for s in BUL[k]) + 88 + 56
    cw = max(x1 - x0 + 56, tw); cx = 960
    return (int(cx - cw / 2), 676, int(cx + cw / 2), 1006)

def card_mask(w, h, rnd=False):
    m = Image.new("L", (w * 2, h * 2), 0); dr = ImageDraw.Draw(m)
    if rnd: dr.ellipse((0, 0, w * 2 - 1, h * 2 - 1), fill=255)
    else: dr.rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), RAD * 2, fill=255)
    return m.resize((w, h), Image.LANCZOS)
_masks = {}
def get_mask(w, h):
    if (w, h) not in _masks: _masks[(w, h)] = card_mask(w, h)
    return _masks[(w, h)]
_sheen = {}
def get_sheen(w, h):
    if (w, h) not in _sheen:
        s = Image.new("RGBA", (w, h), (0, 0, 0, 0)); sd = ImageDraw.Draw(s)
        for i in range(h // 2): sd.line((0, i, w, i), fill=(255, 255, 255, int(70 * (1 - i / (h / 2)))))
        sd.rounded_rectangle((1, 1, w - 2, h - 2), RAD, outline=(255, 255, 255, 210), width=3)
        _sheen[(w, h)] = s
    return _sheen[(w, h)]

def draw_card(out, bg, box, painter, kw, a, sc, p):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    g = np.asarray(bg.crop(box)).astype(np.float32) * 0.48 + 255 * 0.52
    card = Image.fromarray(g.clip(0, 255).astype(np.uint8)).convert("RGBA")
    card = Image.alpha_composite(card, get_sheen(w, h))
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    painter(ImageDraw.Draw(lay), lay, w, h, p, **kw)
    card = Image.alpha_composite(card, lay); mask = get_mask(w, h)
    nw, nh = w, h
    if abs(sc - 1) > 0.002:
        nw, nh = max(2, int(w * sc)), max(2, int(h * sc))
        card = card.resize((nw, nh), Image.BILINEAR); mask = mask.resize((nw, nh), Image.BILINEAR)
    X = x0 + (w - nw) // 2; Y = y0 + (h - nh) // 2
    sh = Image.new("L", (nw + 100, nh + 100), 0); sh.paste(mask.point(lambda v: int(v * 0.40 * a)), (50, 62))
    sh = sh.filter(ImageFilter.GaussianBlur(20))
    out.paste((0, 0, 0), (X - 50, Y - 50, X - 50 + sh.width, Y - 50 + sh.height), sh)
    out.paste(card.convert("RGB"), (X, Y), mask.point(lambda v: int(v * a)))

# Drop-in schedule: cards pop in for a few seconds, leave, then a different card returns
GROUPS = {"intro": [[1], [0]], "caution": [[1], [0]]}
BEAT, GAP, MIN_BEAT = 4.2, 2.4, 2.6
def build_beats():
    beats = []
    for key, spans, cards in SCENES:
        groups = GROUPS.get(key, [[0], [1, 2]]); g = 0
        for (t0, t1) in spans:
            cur = t0 + 0.25
            while t1 - cur >= MIN_BEAT:
                end = min(cur + BEAT, t1)
                if t1 - end < MIN_BEAT * 0.6: end = t1 if t1 - cur <= BEAT + 1.2 else end
                beats.append((cur, end, [cards[i] for i in groups[g % len(groups)]])); g += 1
                cur = end + GAP
    return beats
BEATS = build_beats()
def render(fr, t):
    out = fr; soft = None; heavy = None
    def bgs():
        nonlocal soft, heavy
        if soft is None:
            soft = fr.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
            heavy = fr.resize((W // 8, H // 8), Image.BILINEAR).filter(ImageFilter.GaussianBlur(7)).resize((W, H), Image.BILINEAR)
        return soft, heavy
    for k, t0, t1 in BULLET_SPANS:
        if t0 <= t <= t1:
            a = min(clamp((t - t0) / 0.12), clamp((t1 - t) / 0.3))
            first = min(s for kk, s, _ in BULLET_SPANS if kk == k)
            p = 1.0 if t0 != first else clamp((t - t0 - 0.1) / 1.0)
            draw_card(out, bgs()[1], bullet_box(k), p_bullets, dict(lines=BUL[k]), a, 1.0, p)
    for (b0, b1, cards) in BEATS:
        if not (b0 <= t <= b1): continue
        for ci, (box, painter, kw) in enumerate(cards):
            tin = b0 + ci * 0.16; tout = b1 - (len(cards) - 1 - ci) * 0.08
            if t < tin: continue
            a_in = (t - tin) / 0.45; a_out = (tout - t) / 0.32
            a = clamp(min(a_in, a_out))
            if a <= 0: continue
            sc = 0.84 + 0.16 * ease_back(a_in) if a_in < 1 else 1.0
            if a_out < 1: sc = min(sc, 0.92 + 0.08 * ease_out(a_out))
            p = clamp((t - tin - 0.2) / 1.4)
            draw_card(out, bgs()[0], box, painter, kw, a, sc, p)
    return out

def main():
    global AVATAR
    src, dst, av = sys.argv[1], sys.argv[2], sys.argv[3]
    ss = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    dur = float(sys.argv[5]) if len(sys.argv) > 5 else None
    AVATAR = Image.open(av).convert("RGB")
    cut = ["-ss", str(ss)] + (["-t", str(dur)] if dur else [])
    dec = subprocess.Popen(["ffmpeg", "-v", "error"] + cut + ["-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
                           + cut + ["-i", src, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                           "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", dst],
                           stdin=subprocess.PIPE)
    n = 0; fs = W * H * 3
    while True:
        buf = dec.stdout.read(fs)
        if len(buf) < fs: break
        t = ss + n / FPS
        enc.stdin.write(render(Image.frombuffer("RGB", (W, H), buf).copy(), t).tobytes()); n += 1
        if n % 900 == 0: print("t=", round(t, 1), flush=True)
    enc.stdin.close(); enc.wait(); dec.wait(); print("frames", n)

if __name__ == "__main__":
    main()
