"""mixkit.py search "<words>" ...   → candidate free clips (id · title) for each search
   mixkit.py get <id> <out.mp4>      → download the 720p file
Mixkit's free licence allows commercial use (including YouTube) without attribution; clips can't be resold as stock."""
import sys, re, subprocess, urllib.parse
UA = 'Mozilla/5.0 (compatible; relentless-daily)'
def fetch(url): return subprocess.run(['curl', '-sSL', '-A', UA, '--max-time', '30', url], capture_output=True, text=True).stdout
if sys.argv[1] == 'search':
    for q in sys.argv[2:]:
        h = fetch('https://mixkit.co/free-stock-video/discover/' + urllib.parse.quote(q.strip().lower().replace(' ', '-')) + '/')
        seen = []
        for slug, title in re.findall(r'<a href="/free-stock-video/([a-z0-9-]+)/">([^<]+)</a>', h):
            m = re.search(r'-(\d+)$', slug)
            if m and m.group(1) not in [s[0] for s in seen]: seen.append((m.group(1), title.strip()))
        print(f'## {q}'); [print(f'  {i}  {t}') for i, t in seen[:14]]
elif sys.argv[1] == 'get':
    i, out = sys.argv[2], sys.argv[3]
    for q in ('720', '1080', '360'):
        r = subprocess.run(['curl', '-sSL', '-A', UA, '--max-time', '120', '-f', '-o', out, f'https://assets.mixkit.co/videos/{i}/{i}-{q}.mp4'])
        if r.returncode == 0: print(out, q); break
    else: sys.exit(f'could not download {i}')
