#!/usr/bin/env python3
"""Go-live for batch 1. Run from the repo root on the deploy branch ONLY after Relentless approves.
Usage: python3 scripts/go_live.py [BASE_URL]
- removes the robots noindex tag from every page listed in launch/batch1-pages.txt
- strips draft banners / draft wording from those pages
- swaps the canonical placeholder for BASE_URL
- writes sitemap-batch1.xml with absolute URLs
- fails if any batch 1 page still contains the word "draft"
"""
import re,sys,os,datetime
BASE=(sys.argv[1] if len(sys.argv)>1 else 'https://YOUR-DOMAIN.example/').rstrip('/')+'/'
pages=[l.strip() for l in open('launch/batch1-pages.txt') if l.strip() and not l.startswith('#')]
PH=[ # exact phrase rules (case-sensitive), applied in order
(r'\s*\(Draft\)',''),(r'\s*\(draft\)',''),
(r'Draft home for Relentless Library:','Relentless Library:'),
(r'Draft hub for six','Hub for six'),
(r'Nothing is published\.\s*',''),

(r'"No\. They are drafts, hidden from search, awaiting Relentless’s approval\."','"Yes."'),
(r'No\. They are drafts, hidden from search, awaiting Relentless’s approval\.','Yes.'),
(r'Are these pages live\?','Are these pages live?'),
(r'These pages are drafts only — noindex, not live, waiting for his approval\.\s*',''),
(r'These pages are drafts only[^.<"]*\.\s*',''),
(r'\s*Nothing on this page is live\.',''),(r'\s*This page is a private draft\. It has not been deployed or published\.',''),
(r'<p>\s*</p>',''),
(r', used as a draft library image',''),
(r'Related draft pages','Related pages'),(r'Draft sections','Sections'),(r'Draft catalog','Catalog'),(r'Draft collection','Collection'),
(r'Draft pages in this section','Pages in this section'),(r'Draft pages','Pages'),
(r'Music Micro Pages \(drafts\)','Relentless Aaron Music'),
(r'Draft music micro page · Relentless Aaron catalog · no public URL · do not index','Relentless Aaron music · official catalog'),
(r'Sources used on this draft','Sources'),
(r'Musical project \(draft\)','Musical project'),
(r'KDP metadata draft','KDP metadata'),(r'KDP draft metadata','KDP metadata'),(r'KDP draft description','KDP description'),(r'in the KDP draft','in the KDP metadata'),
(r'draft metadata','publishing metadata'),(r'An early script draft','An early script version'),
(r'the draft story in the book plan','the story in the book plan'),
(r'A Relentless Library ([A-Za-z-]+ )?draft','A Relentless Library \\1page'),
(r'(?i)relentless library drafts','Relentless Library pages'),
(r'Relentless Library draft','Relentless Library'),
(r'library drafts','library pages'),
(r'first library draft','first library collection'),
(r'(?i)this draft page','this page'),(r'(?i)these draft pages','these pages'),
(r'This page is a draft only\.\s*',''),(r'This page is a draft and the book is Coming soon','This book is Coming soon'),
(r'This Relentless Library page is a draft and the book is marked Coming soon','This book is marked Coming soon'),
(r'This Relentless Library page is a draft catalog entry, not a new release','This Relentless Library page is a catalog entry, not a new release'),
(r'It is a draft catalog page','It is a catalog page'),(r'It is a Relentless Library draft','It is a Relentless Library page'),
(r'All of this is still a draft shelf','All of this is still a growing shelf'),
(r'this draft is not a published book','this book is not yet published'),
(r'This is a draft\.\s*',''),
(r'in this draft set','in this collection'),(r'this draft set','this collection'),(r'this draft track','this collection'),
(r'this draft’s','this page’s'),(r'these drafts','these pages'),(r'These drafts','These pages'),
(r'this draft','this page'),(r'This draft','This page'),(r'the draft','the page'),
(r'This task only drafts library pages','This collection covers library pages'),
(r'Used on this page only','Used on this page'),
(r'drafts','pages'),(r'Drafts','Pages'),(r'draft','page'),(r'Draft','Page'),
]
def prestrip(s):
    s=re.sub(r'<h2>Open questions already flagged in the pages</h2>\s*<p>.*?</p>','',s,flags=re.S)
    s=s.replace('The collection, in this batch, is','The collection is')
    s=re.sub(r'<h2>Separate from[^<]*(Missing Kids|missing-kids)[^<]*</h2>\s*<p>.*?</p>','',s,flags=re.S)
    s=re.sub(r'<details><summary>[^<]*Missing Kids[^<]*</summary><p>.*?</p></details>','',s,flags=re.S)
    s=re.sub(r',?\s*\{"@type": "Question", "name": "[^"]*Missing Kids[^"]*", "acceptedAnswer": \{"@type": "Answer", "text": "[^"]*"\}\}','',s)
    s=s.replace('"mainEntity": [, ','"mainEntity": [').replace('"mainEntity": [,','"mainEntity": [')
    s=re.sub(r'\s*Whether Black Missing Kids TV is the same project as Blacknificent Kids TV[^.]*\.','',s)
    return s
def strip(s,path):
    s=prestrip(s)
    s=re.sub(r'\s*<meta name="robots" content="[^"]*noindex[^"]*">','',s)
    s=re.sub(r'<div class="draft-banner">.*?</div>\s*','',s,flags=re.S)
    s=re.sub(r'<div class="draft">.*?</div>\s*','',s,flags=re.S)
    s=re.sub(r'\.draft-banner\{[^}]*\}','',s); s=re.sub(r'\.draft\{[^}]*\}','',s); s=re.sub(r'\s*--draft:[^;]*;','',s)
    s=re.sub(r'\s*"indexed": "[^"]*",?','',s)
    for a,b in PH: s=re.sub(a,b,s)
    d=os.path.dirname(path); d=(d+'/') if d else ''
    s=re.sub(r'https://YOUR-PUBLIC-DOMAIN\.example/([A-Za-z0-9._-]+)',lambda m: BASE+d+m.group(1),s)
    return s
bad=[]
for p in pages:
    s=open(p).read(); s=strip(s,p); open(p,'w').write(s)
    if re.search(r'(?i)draft|missing-kids',s) or 'noindex' in s: bad.append(p)
today=datetime.date.today().isoformat()
urls=''.join(f'  <url><loc>{BASE}{p if not p.endswith("/index.html") and p!="index.html" else p[:-10]}</loc><lastmod>{today}</lastmod></url>\n' for p in pages)
open('sitemap-batch1.xml','w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
print(f'go-live: {len(pages)} pages processed, base {BASE}; sitemap-batch1.xml written')
if bad: print('STILL CONTAINS draft/noindex:',*bad,sep='\n  '); sys.exit(1)
