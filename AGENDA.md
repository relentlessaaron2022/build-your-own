# Relentless Video Agenda

The skills live in `.claude/skills/`. Every Claude Code session opened on this repo loads them. This page is the rhythm for using them: one skill a day, one piece of content a day, sound on everything, and a weekly review so the work keeps getting sharper.

| Skill | What it does | Needs |
|---|---|---|
| **bang-motion** | Motion graphics and kinetic type that play like a video, not a slideshow. Outputs one `index.html`, which can be rendered to MP4. | A browser. Node + puppeteer for MP4 export. |
| **vox-director** | One topic in, a finished documentary-style collage video out: script, voiceover, music, captions. | An **Atlas Cloud API key**. Each run spends credits. |
| **huashu-art-motion** | Turns a scene into a moving painting in dozens of art styles. | Node, Python, ffmpeg. |
| **claude-drawing** | Images drawn in code, stroke by stroke, with draw-on GIFs. 83 styles. No image model. | Python, numpy, Pillow. |
| **blender-\*** (28 skills) | Real 3D: scenes, lighting, camera moves, weather, cel-shaded looks, rendering, and cutting video in Blender's sequencer. Start any Blender job with `blender-core`. | **Blender 5.2 or newer**, run headless. |
| **earshot** + **real-sound** | Sound for every piece. earshot renders foley, whooshes, ambience and UI sounds in code and listens back to check sync and loudness. real-sound builds a full soundtrack from licensed recordings. | The `earshot` tool: `pip install "earshot @ git+https://github.com/Leonxlnx/earshot"` |

---

## The weekly rotation

Paste the day's prompt into a new session, then swap the bracketed part for that week's material.

**Every build day ends with the sound pass:**
> Use earshot to give this piece its sound: pick the cues off the picture (hits, whooshes, foley, a room tone under it all), listen back to check sync and loudness, then mux it into the final MP4.

### Monday: The Hook (bang-motion)
> Use bang-motion to build a 20-second 9:16 kinetic-typography opener from this line: "[a line from this week's chapter or article]". Calm and measured. Black, bone white, one accent color. Render it to MP4.

### Tuesday: The Sketch (claude-drawing)
> Use claude-drawing to draw [a scene from the work: a kitchen table at 3 a.m., a man reading a letter he won't answer] in the pencil-sketch style, with a draw-on GIF. Square format for a carousel cover.

### Wednesday: The Documentary (vox-director)
> Use vox-director to make a 60-second Vox-style collage explainer on "[topic: the history behind an idea in the book]". Narration in the Relentless voice: personal, precise, no hype.

### Thursday: The Painting (huashu-art-motion)
> Use huashu-art-motion to turn [one image or scene] into a 10-second moving painting. Try [ink wash / oil impasto / ukiyo-e] this week, and a different style every week.

### Friday: The Drop (bang-motion)
> Use bang-motion to build a 15-second promo bumper for [this week's release: chapter, article, episode]. End card: title, "Relentless", and where to find it.

### Saturday: The Set (Blender)
> Use the blender skills to build [one object or room from the work: a porch light in the rain, an empty chair under a single bulb]. Light it for blue hour, add rain with blender-weather-fx, and render a slow 8-second push-in at 1080×1920. Run blender-asset-qa before calling it done.

Every other Saturday, swap in **The Remix**: put the Blender render behind a bang-motion title card, or draw a scene with claude-drawing and animate it with huashu-art-motion. Then let real-sound score it.

### Sunday: The Review (no new build)
> Look at what went out this week. Which piece held attention? Which skill felt clumsy? Write three lines in `reviews/YYYY-MM-DD.md` and set next week's bracketed material.

---

## Ground rules

- **Truth first.** Use real lines, real scenes, real history. No invented biography, no costume.
- **One accent color a week.** It keeps the feed recognizable.
- **Save what ships.** Put finished files in `output/YYYY-MM-DD-skill/` and commit them, because cloud sessions are wiped.
- **Vox Director costs money.** If the Atlas Cloud key isn't set up, run Wednesday through bang-motion's explainer styles instead.
- **Silence reads as unfinished.** No piece ships without the earshot sound pass.
- **Blender and earshot need installing per machine.** Cloud sessions start clean, so install them at the start of the session, or ask Claude to add them to the environment's setup script so they're always there.

## Where these came from

All MIT-licensed. Showcase GIFs and MP4s were left out to keep the repo light. Every script, font, reference, and code example is intact.

- bang-motion: github.com/bangtutorial/bang-motion @ c1aa65e
- vox-director: github.com/Alisa0808/vox-director @ 6a85a7c
- huashu-art-motion: github.com/alchaincyf/huashu-art-motion @ a97c450
- claude-drawing: github.com/cloveric/claude-drawing-skill @ 6af36dc (skill renamed from `claude绘图` to `claude-drawing` so Claude Code accepts it)
- blender-\* (28 skills): github.com/EL4CTEO/blender-skills @ 1a1cc6c
- earshot, real-sound: github.com/Leonxlnx/earshot @ 7a7f7c5

To update one later: re-clone the upstream repo and copy it over its folder in `.claude/skills/`.
