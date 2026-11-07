"""genimg.py <shots.json> <out dir>   — generate an episode's images with Google's Gemini image model (the model family behind Google Flow).

shots.json: {"style": "...", "characters": {"Rosa": "Latina waitress in her forties, ..."},
             "shots": [{"file": "ep5-1.jpg", "prompt": "...", "cast": ["Rosa"]}, ...]}
The key is added by the network proxy (environment secret for generativelanguage.googleapis.com, header x-goog-api-key);
it never appears here. A character's first generated shot is sent back as a reference image for their later shots, so faces stay the same.
"""
import sys, os, json, base64, subprocess, time
MODEL = os.environ.get('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash-image')
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'
spec, out = json.load(open(sys.argv[1])), sys.argv[2]; os.makedirs(out, exist_ok=True)
ref = {}                                                         # character → path of the first shot they appear in
def call(parts):
    body = json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '9:16'}}})
    for attempt in range(4):
        r = subprocess.run(['curl', '-sS', '--max-time', '180', '-H', 'Content-Type: application/json', '-H', 'x-goog-api-key: set-by-proxy', '-d', '@-', URL], input=body, capture_output=True, text=True)
        try: j = json.loads(r.stdout)
        except Exception: j = {'error': {'message': r.stdout[:300] or r.stderr[:300]}}
        if 'error' not in j:
            for c in j.get('candidates', []):
                for p in c.get('content', {}).get('parts', []):
                    if 'inlineData' in p: return base64.b64decode(p['inlineData']['data'])
            j = {'error': {'message': 'no image in the response: ' + json.dumps(j)[:300]}}
        print('  retry:', j['error'].get('message', '')[:200], file=sys.stderr); time.sleep(4 * (attempt + 1))
    sys.exit('genimg.py: giving up — ' + j['error'].get('message', '')[:300])
for s in spec['shots']:
    dst = os.path.join(out, s['file'])
    if os.path.exists(dst): print('have', s['file']); continue
    cast = s.get('cast', [])
    text = s['prompt'] + '. ' + ' '.join(f'{c}: {spec["characters"][c]}.' for c in cast) + ' ' + spec['style']
    parts = [{'text': text}]
    for c in cast:
        if c in ref: parts += [{'text': f'Reference for {c} — keep the same face, hair and clothing:'}, {'inlineData': {'mimeType': 'image/jpeg', 'data': base64.b64encode(open(ref[c], 'rb').read()).decode()}}]
    img = call(parts); open(dst, 'wb').write(img)
    for c in cast: ref.setdefault(c, dst)
    print('made', s['file'])
