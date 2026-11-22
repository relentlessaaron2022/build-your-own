# commons.py: search Wikimedia Commons, take the first freely licensed image per query, save it with its credit
import sys, json, urllib.request, urllib.error, urllib.parse, re, os, time
OUT = sys.argv[1]; Q = json.load(open(sys.argv[2])); credits = []
UA = {'User-Agent': 'documentary-research/1.0 (personal project)'}
def fetch(url, tries=6):
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1: raise
            time.sleep(8 * (i + 1))
def get(url): return json.loads(fetch(url))
ok = re.compile(r'^(cc0|cc[- ]by|cc[- ]by[- ]sa|public domain|pd)', re.I)
for key, query in Q.items():
    u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': query + ' filetype:bitmap', 'gsrlimit': 12, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1920})
    pages = sorted(get(u).get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    got = None
    for p in pages:
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {}); lic = m.get('LicenseShortName', {}).get('value', '')
        if not ok.match(lic) or ii.get('width', 0) < 1000: continue
        got = (p, ii, m, lic); break
    if not got: print('NONE', key, query); continue
    p, ii, m, lic = got; url = ii.get('thumburl') or ii['url']; ext = os.path.splitext(url.split('?')[0])[1].lower() or '.jpg'
    fn = f'{key}{ext}'
    if not os.path.exists(os.path.join(OUT, fn)): open(os.path.join(OUT, fn), 'wb').write(fetch(url)); time.sleep(4)
    artist = re.sub('<[^>]+>', '', m.get('Artist', {}).get('value', 'unknown')).strip()
    credits.append({'key': key, 'file': fn, 'title': p['title'], 'author': artist, 'license': lic, 'source': ii.get('descriptionurl')})
    print('OK  ', key, '|', p['title'][:60], '|', lic, '|', artist[:40])
json.dump(credits, open(os.path.join(OUT, 'credits.json'), 'w'), indent=1)
