# Relentless Times — Style Prompt

Based on Broadcast News Package (news-package) from Lemo-Opuscar; borrows from Urban Sketch · Pen & Wash (urban-sketch) and 60s Spy Title Sequence (spy-titles).
Default size: 1080×1920 (vertical feed). English only.

> A television newsroom's on-air package, built entirely in code: a sting that becomes the channel bug, a rundown of today's stories that opens and closes the bulletin, a lower-third strap that never leaves the bottom of the frame, and full-frame graphics (split-flap price boards, a line breaking a threshold, explainer maps, documents flying out of a city, quote cards, spec cards with proportion bars, stamps) that carry the facts. The style is the **package system plus its cutting rules**, not a drawing style. Vertical 9:16, a clean frame: no burned-in subtitles, no news crawl.
> References (grammar only): evening network news headline menus, financial-channel market graphics, European news channels' explainer maps, tech-desk spec cards. Never copy a broadcaster's logo, set, fonts, colours, music or idents, and never name them in the film.

## 1. Essence, and what it is not

1. **One package system, used consistently.** Every graphic is built from the same few parts: a brand plate (parallelogram), a tab in the accent colour, a paper strap, ink cards with an accent top edge, mono datelines, stamps. Viewers read the system before they read the words.
2. **The bulletin's order.** Sting → rundown ("today we have four stories") → item → item → … → back to the rundown, ticked off → sign-off. Each item opens with its category on the strap's tab and its date on the first graphic.
3. **One fact per screen.** A full-frame graphic states one thing: the price, the break, the two stocks, the place, the two letters, the quote, the verdict.
4. **The strap holds the headline.** One lower-third strap is on screen from the first story to the recap and changes its words with a vertical flip; the picture above it is free for the graphic.
5. **Clean panel.** No crawl, no burned-in subtitles; subtitles ship as a separate `.srt`. The frame is the graphic, the strap, the bug and a source line.

Not **Caption News** (that is captions-first social video: huge slammed captions are the lead, no rundown, no strap; here type is small and orderly and the graphics lead). Not **Data Storytelling** (one chart per beat, never a dashboard; the chart is an insert in a bulletin). Not a keynote: no centred title-and-bullets, no page turns. Not a studio show: no virtual set, no anchor, no fly-throughs — the package is flat graphics over ink.


6. **The picture is drawn, not photographed.** Places, buildings and documents are pen & wash reportage sketches made in code (a sepia fineliner that wobbles and overshoots, transparent washes laid on top slightly off the line). People are 60s-spy cut-paper silhouettes in profile, faceless. Nothing on screen pretends to be a photograph of the event.
## 2. Frame and layout (1920×1080)
| Zone | Position (1080×1920) | Content |
|---|---|---|
| Channel bug | plate centre (880, 140), scale 0.36, `REPORT` to its left | the brand plate |
| Corner tag | x 48 y 210, 470×64 | `SKETCH · Illustration, not a photo` on drawn scenes; `SCHEMATIC` on maps; flips in and out 0.2 s |
| Eyebrow band | y 290–370 | date · place in mono caps on an ink band (drawn scenes) or directly on the ground |
| Content | x 48–1032, y 380–1330 | the full-frame graphic or the sketch |
| Source line | right-aligned at x 1032, y 1334 | `SOURCE: …` mono 15 px, ≤ 36 characters |
| Strap | tab x 48 y 1352 (48 high); strap x 48 y 1400, 864×108 + 120 px ink end block | category tab, headline Barlow Condensed 800 ≤ 48 px, one sub-line 600 ≤ 24 px |
| Platform zone | y > 1530 | nothing important (captions and buttons of the feed) |
## 3. Package parts (specs)

| Part | Spec | Rules |
|---|---|---|
| Sting | 0–3 s (spy title) | the headline is built from cut-paper letters as the set (type as architecture, each line a building), a cut-paper silhouette and one cut-paper object move through it, a paper slap per landing letter, one stop-time freeze on the reveal, then the plate takes the corner and **becomes the bug**. Ground ink black, letters cream / lemon / one red band. The old base sting (slashes, plate slam) is replaced; the plate→bug move is kept |
| (base sting, replaced) | 0–1.5 s | two accent slashes (0.04, 0.10 s) → the plate slams in with an overshoot, an impact ring and shake (0.16–0.42) → letters drop in one by one → wordmark and dateline open from the centre → a glint → the plate flies to the top right and **becomes the bug** while a vertical band wipes into the first shot. A hit within 0.4 s |
| Brand plate | parallelogram 520×180, accent gradient, ink and gold bars at the left, name in condensed 800 | the same object is the sting, the bug, the desk front and the end card |
| Rundown | left: date block (big numerals, month, week); right: three rows, 1024×140, number block in accent | rows flip in vertically on the beat (back ease) with a glint; at the close the same object returns and each row is ticked |
| Lower-third strap | see §2 | enters with the first story, flips (new words up from below, old up and out, 0.32 s; the tab flashes white when the category changes), leaves with a slide when the recap starts. A **profile** version (tab `人物 PROFILE`) names a speaker |
| Split-flap board | tiles 220×130, top and bottom halves clipped separately | old value and new value on the same board, so the change reads in one look; ×2 / +x % called out to the right |
| Threshold chart | line from the peak, the threshold as a dashed gold line | the line head advances one trading day per step; the last step crosses the threshold in accent with a shake and a ring; the readout panel slides in after; axes show only what the data supports |
| Bars | grow from a zero line downward for losses, values roll | a reference line at the shared threshold plus a badge |
| Explainer map | the same projection, one long take | members light in order of distance from the city; the city label, the institution label with leader, a stamp; the camera pushes, then pans to make room |
| Documents | 380×490 paper, ink header | fly out of the city dot on an arc (0.5 s, scale 0.08 → 1, rotation settles); check boxes tick on the voice's key words |
| Quote card | ink background with the package's light streaks, a large accent quotation mark lands first, lines push up one by one (0.18 s apart), then the Chinese gist, a gold rule, name, occasion and date | the official wording, in the language it was said; never paraphrase inside quotation marks; an underline sweeps the key word as the voice says it |
| Spec card | eyebrow (source · date), the product name pushed up from a mask, a category stamp, proportion bars on one scale (the whole vs the part, values rolling), a percentage badge, a context chip; a second group on the right for the hardware or the place, filling cell by cell, joined by a bracket to its total | one scale for every bar, so the proportion is true; every number from the source page |
| Stamps | accent fill or ink with a double accent frame, −6° to −10° | land from 1.9× in 0.16 s with an expanding ellipse; one per story at most |
| Transitions | vertical band wipe (accent 84 px + ink 5 px + gold 14 px edge, 0.3 s) between stories and programme parts; hard cut + timpani inside a story; slanted wipe into the end card | nothing else: no dissolves, no 3D flips, no page turns, no fly-throughs. **The package layer travels with its picture**: under a wipe each side draws its own strap words, tab, source line and corner tag (old state on the old side, new state on the new side), so the band brushes the headline over; on a hard cut they change on the same frame. Strap words never flip or overlap. The incoming picture's entry animation starts under the band, so its first revealed frame already has content |


| Sketch scene | a pen & wash page: ink first (stroke-order draw-on, ~0.7 s per layer), colour arriving through a ragged front from one point ~1.2 s later, a handwritten note (Caveat) with place and date in the margin | the picture for a place or an object; always tagged `SKETCH`; never a person's likeness |
| Silhouette | 60s-spy cut-paper figure in profile, ~7 heads, hat / coat / one colour accent (spy red for the person the story is about), pieces with a cached scissor-cut edge, cut gap in the ground colour, small paper shadow, poses on twos | stands in for people; faceless; never a caricature of a real person |
## 4. Colour

| Role | Value | Use |
|---|---|---|
| ink | `#121417` | backgrounds, panels, strap end block |
| ink2 / ink3 | `#1B1E23` / `#22262C` | cards, land on maps |
| accent (lemon) | `#F2CF1D` (light `#F8DE4A`, dark `#D8B30C`) | plate, tabs, band wipe, bars, stamps, the line that breaks |
| gold | `#D4B064` | thresholds, datelines, source lines, light fins, badges |
| paper | `#F4F1E8` | strap, documents, the chart line |
| breaking | `#FE6B3D` | only for BREAKING and LIVE. A weekly round-up has neither, so it never appears |

Structure to keep when you change the brand: one accent + one gold-like secondary + paper + ink, and a reserved alarm colour. Ink text on the accent; on paper, English secondary lines in a dark olive (`#6E5A1E`) because gold is too weak there.


Additions (this style):

| Role | Value | Use |
|---|---|---|
| sepia ink | `#3B2A1E` | every sketch line; never changes |
| sketch paper | `#F1E8D6` | ground of sketch scenes (paper white is reserved, never painted) |
| washes | local colour, light (e.g. sky `#9FBCD6`, stone `#D8C6A0`, glass `#7FA6B8`, foliage `#7FA04A`/`#A7B85C`), shadow side mixed toward violet `#8C87A6` | sketch scenes only |
| spy black / cream | `#1B1714` / `#EFE4C9` | spy title grounds and silhouettes |
| spy red | `#D23A22` | the accused's accent and danger only; one band per title |

The package's lemon and gold stay the brand colours. Gold on cream paper is too weak: on sketch scenes the eyebrow sits on an ink band, and the source line is dark olive `#6E5A1E`.
## 5. Type
- Latin only (English films): Barlow Condensed 800 (headlines, numbers, the plate, cut-paper title letters), 600 (secondary lines, quotes), 600 italic (end card); IBM Plex Mono 500 for datelines, sources, tags; **Caveat 600** for handwriting on sketch pages (place, date, a short note).
- All OFL, self-hosted in `fonts/`.
- Cut-paper title letters: each letter placed separately with ±0.8° rotation, ±1.5 px baseline jitter, a 5 px cut gap in the ground colour and a small paper shadow; letters land one by one from above.
## 6. Picture layer and grade
- **Default: drawn.** The picture layer is pen & wash sketches drawn in code (`sketch.js`): cream paper with mottling and tooth; one sepia ink line (1.4–3 px, wobble ~1 px, overshoot 2–8 px, about half the long strokes with one small gap), drawn on in stroke order; 2–3 transparent wash layers in multiply, offset 1–3 px off the line, dried darker rim, granulation; colour arrives through a ragged circular front. No grain on sketches (the paper is the texture).
- People are cut-paper silhouettes (`cutpaper.js`), never drawn faces, never photographs of private individuals.
- **Photos are the exception**, used only when the user supplies them or when an openly licensed photo is clearly better (a specific building): then the base grade applies (duotone, tagged `PHOTO` with credit).

<!-- base §6, kept for reference -->
> - When there is no footage, the picture layer is data graphics drawn in code plus, at most, a few **illustrative plates** (generated or stock), each tagged `ILLUSTRATION` for as long as it is on screen. They set a mood (a server room behind a model launch, a wafer behind chip stocks); they never stand in for the event, the place or the people.
> - One grade for every plate: greyscale → auto black/white points (0.5 / 99.6 percentile) → γ 1.05 → 35 % S-curve → black 8, white 232 → duotone `#0E1013` → `#ECE7D8` (`tools/prep.py: grade()`), plus a left-dark ink gradient for type, a 50–55 % vignette and 7 % overlay grain cycling through six tiles. Graphics and the package are never grained.
> - Real footage, if you have it, takes the same grade path; modern footage ≤ 1.5× scale, archive ≤ 2.5× after deblocking; crop out station logos.
## 7. Editing grammar

- **120 BPM grid**, beat 0 at the end of the sting (1.5 s). Every cut and wipe on a beat or half-beat.
- **Shot lengths**: sting 1.5 s; rundown 4–5 s; story shots 3–7 s; a map long take (6–12 s) as the bulletin's breath; a comparison stays until every item has been fully on screen ≥ 2.5 s.
- **A package action every 0.5–1 s** inside a shot (flip, count, stamp, tick, strap change, map light, line step). No frame flat for more than 1 s; a strong action within 0.5 s of every cut.
- **Date every story**: a weekly bulletin's items happen on different days; the date sits in the rundown row, the eyebrow line, the readout or the document.
- **The order inside an item**: what (the name or the number) → how big (the line, the bars, the price board) → who it hits or who said it (bars, documents, a quote) → the verdict stamp.

## 8. Sound palette
**No music** (this style's default). The edit runs on the voice and sound alone.

| Layer | What | Level |
|---|---|---|
| Voice | the host's own recording, or one narrator; HP 90 Hz, 3:1 compression | the lead |
| Paper | a paper slap per landing title letter and on every hard cut; a paper whoosh on band wipes | under the voice |
| Pen | a fineliner scratch while sketch lines draw on; a soft brush swish as colour arrives | low |
| Package | flap clicks, stamp thump + clack, map pings, typewriter ticks on documents | as in the base |
| Stop-time | one dead-silent freeze (0.5–1 beat) before the biggest reveal, then the heaviest stamp | |
| Room | very low air under sketches, so silence is never digital zero | |

Master −14 LUFS, true peak −1.2 dB.

<!-- base §8 (with music), kept for reference -->
> | Layer | What | Level |
> |---|---|---|
> | Anchor voice | one narrator, one sentence per graphic, starting 0.1 s after the cut; HP 90 Hz, 3:1 compression. Default: the library's Kokoro (`core/tts/tts.py`, free, Apache 2.0) in English or Chinese. The user's own recording, or another TTS they have a key for (for example Doubao, as in the demo), replaces it — never required | music ducked ≈ −7 dB and its 1.2–5 kHz band thinned under speech |
> | News theme | 120 BPM, minor key: spiccato violins in root–fifth–octave eighths, pizzicato bass on the beat, horn pads, a low-passed 16th-note saw pulse, kick on 1 and 3, snare on 2 and 4 | full under the rundown and the first story |
> | Section moods | markets: violins down an octave, tremolo, four-on-the-floor kick (heartbeat); policy: pizzicato and horns only | |
> | Signature hits | sting tutti; glockenspiel notes as the rundown rows land; timpani on hard cuts and story changes; one beat of silence before the biggest break, then the heaviest hit of the film; a held drone after the verdict stamp; a major-key lift for the last story; tutti on the end card | |
> | Foley | whoosh on wipes, flap clicks on split-flaps, stamp thump + clack, trading-room ticks under market charts, map clicks per lit country, a sonar ping on a city, paper and typewriter ticks on documents, click + glockenspiel on ticks | |
> | Room | server-room hum under a tech plate, soft air under maps | very low |
> 
> Master −14 LUFS, true peak −1.2 dB (`core/render/mux.sh`). Samples: VSCO 2 CE and VCSL (CC0); foley synthesised (`core/audio/sfx.py`).
## 9. Native moves

1. **Sting becomes the bug** — the brand plate slams in, then flies to the corner and stays there for the whole bulletin; opening and programme are one object.
2. **Strap tab = category** — the strap's tab changes category (模型 MODELS, 市场 MARKETS, 监管 POLICY …) with a white flash when a new story starts; no separate item cards between stories.
3. **Rundown, then ticked off** — the same list opens and closes the bulletin; at the end each row gets its tick.
4. **Spec card** — a launch reduced to its proportions: the whole and the part on one scale, then what it runs on, joined by a bracket to the total.
5. **Strap that never leaves** — one strap group from the first story to the recap; words flip, the strap itself never exits mid-programme.
6. **Split-flap before/after** — old and new value on one board, each tile flipping from the old to the new.
7. **Breaking the threshold** — a line advances one period per step towards a dashed threshold; the music stops for one beat before the last step and the crossing gets the heaviest hit.
8. **Date in the eyebrow** — every graphic's eyebrow line carries source and date in mono caps, so a weekly round-up never blurs which day each item happened.
9. **City sends the letters** — on a map long take, documents fly out of the sending city to their addressees; one world→screen function keeps labels and documents attached through push and pan.
10. **Quote card + verdict stamp** — the official's own words in type, with name, occasion and date; an underline on the key word as the voice says it; one stamp.

Where each move lives in the demo's code: [DEMO.md](DEMO.md) (build notes).


11. **The headline is the set** (from spy titles) — the cold open builds the story's title out of cut-paper letters; a silhouette walks across them; one stop-time freeze; the plate takes the corner.
12. **Colour arrives with the fact** (from pen & wash) — a sketch is ink-only until the voice names the place or the thing; then colour blooms from it.
## 10. Material

1. **Facts first.** Every on-screen number and every sentence of the voice comes from an official source (the company's own page, the exchange's data, the institution's press release or speech), recorded in `demo/FACTS.md` with claim, URL, quoted wording and any arithmetic. When a fact exists only in a news report, attribute it on screen and in the voice ("据…报道 / … reports") and keep to the plain claim; never put a single report's allegations about a real company or person on screen.
2. **Data.** Draw charts from real series only; when you have just a few reported numbers, draw a *schematic* line, tag it `SCHEMATIC`, and label only what you know. Exchange closes: the exchange itself, the central bank's statistics portal, or a market-data file whose source you log.
3. **Pictures: ask in this order.**
   a. **The user's own images** — photos, b-roll stills, their logo and colours (the package is rebuilt around their brand). Use these first.
   b. **Generated illustrative plates**, if the user wants them. Before generating, tell the user how many images and what each shows (one line per plate). With the Codex CLI installed and able to generate images, `demo/tools/gen_image.py` (driven by `demo/tools/gen_plates.sh`) makes them and saves JPEGs to `demo/assets/plates/`. With any other image tool (an API or a web app), give the user the prompts and the target file names; they generate the images and drop them into `demo/assets/plates/`. Prompts ask for no text, letters, logos, flags or people.
   c. **No generated images**: public-domain, CC0 or CC BY photographs (licences below), or abstract backgrounds drawn in code (gradients, grids, light fins — the package already carries the frame).
   Whatever the source: every word on screen is typeset in code, never baked into an image; a generated plate is only ever an illustration behind a graphic, tagged `ILLUSTRATION / 示意` for as long as it is visible, and never stands in for the event, a place in the news, or a person. No generated anchor.
4. **Photo and footage licences** (judge each file on its own page, not the search result):
   - **Wikimedia Commons**: CC0, public domain or CC BY (credit author, title, licence on the end card and in `CREDITS`). Not used: CC BY-SA, "no known restrictions", unclear licences, YouTube re-uploads, colourised or "restored" versions.
   - **U.S. federal agencies** (NASA, NOAA, NARA, USGS…): public domain; check the page does not credit a contractor or third party.
   - **Internet Archive**: only items whose page states public domain, CC0 or CC BY; U.S. works published before 1931 are public domain.
   - **Library of Congress / national archives**: read each rights statement; "no known restrictions" is not enough.
   - **Institutions' audiovisual services** (for example the European Commission's): read their reuse terms per item; many require attribution and forbid implying endorsement.
   - **Maps**: Natural Earth (public domain), via `world-atlas` TopoJSON.
5. **Before downloading, tell the user** what you will fetch, from where and under which licence. The finder copied into this style, `demo/tools/footage.py` (`search commons|archive|nasa`, `fetch`, `used`, `md`), logs licence, author, page and the seconds used into `SOURCES.jsonl` and writes `SOURCES.md`. Keep `raw/` under ~1.5 GB.
6. **Logos**: never use a company's logo for a company in the news; set its name in type.
7. **People**: public figures in the news can be named on a profile strap; no close-up or slow motion of private individuals.
8. **Voice and music**: ask whether the user has a recorded anchor, a preferred voice or a theme of their own before synthesising one.

## 11. Pitfalls

- **Package left behind.** If the strap, source line or tags are drawn once on top of everything, a wipe changes the picture under yesterday's headline and the strap catches up 0.3–0.5 s later. Draw them per picture, inside the wipe's clip.
- **Leftover layout.** Removing subtitles or a crawl without moving the content down leaves a dead band above the strap.
- **Masked type peeking in.** A push-in title clipped by a mask shows its top edge before it moves if the travel distance doesn't clear the mask; start it fully below and don't draw at progress 0.
- **Words stronger than the source.** "Request for information" is not "investigation" or "penalty"; write "no fine, no case opened" or "for the first time" only if a source says so — and check the institution's own pages, which can contradict a report ("first requests" may have gone out months earlier).
- **Thresholds depend on the reference.** "Bear market" = −20 % from *which* high? Name the reference on the axis; from a different peak the claim can be false.
- **Attribute what only a report says.** When the official source does not name the companies, the graphic carries "据… 报道 / reported by …" and so does the voice.
- **A schematic posing as data.** Rolling counters on a close price flash values that never existed; set the close with a mask push instead. Don't label axes the data doesn't support.
- **Source lines under the strap.** Right-aligned mono 13 px: ≤ 36 characters.
- **Stamps over key words.** A stamp hit can mask the voice ("fines"); take the brass off the stamp and low-pass its clack.
- **Gold on paper** has too little contrast: use ink or dark olive.
- **Generated plates** carry stray corner marks: crop them in `prep.py`.
- **Short preview text.** Rundown rows are previews of the stories; `readcheck` flags them as short in the opening — they return in the recap and as straps, so accept the flag or leave them out of `TEXTS`.
- **Names in synthetic speech.** Spell brand names, model numbers and abbreviations the way they should sound in the TTS text (a respelling, a number written as a word, an abbreviation without dots) while the strap and subtitles keep the real spelling; when speech-to-text mishears an unusual name, put the expected transcript in the line's `asr` field instead of rewriting the line.


- **A sketch read as evidence.** Tag every drawn scene `SKETCH · Illustration, not a photo`; never draw a real person's face or a likeness.
- **Gold or yellow on cream paper** disappears: eyebrow on an ink band, source line in dark olive.
- **Silhouettes crossing type**: keep figures on a baseline or in clear space; a black figure in front of a black letter needs its cut-gap outline.
- **No music means no glue**: keep a sound on every cut and a quiet room tone under everything; plan the one silence.
## 12. Variation space

Decide per film: the channel's name, plate and accent colour; how many items (one lead with a long package, three or four equal items, a five-item round-up); which full-frame graphics each item needs; where the long take goes; the anchor's voice.

- **Three structures:** rundown → items → rundown ticked (round-up); one lead package with a correspondent two-box and a short "also today" grid; a countdown of items (election-night, sports results).
- **Three openings:** sting → rundown; cold open on the biggest graphic, then the sting; sting straight into the first story with the rundown as a recap only.
- **Three endings:** rundown ticked → end card; a "coming up next week" teaser card; the last stamp freezing into the end card.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
