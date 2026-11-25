# Relentless Video Agenda

Four skills live in `.claude/skills/`. Every Claude Code session opened on this repo loads them. This page is the rhythm for using them: one skill a day, one piece of content a day, and a weekly review so the work keeps getting sharper.

| Skill | What it does | Needs |
|---|---|---|
| **bang-motion** | Motion graphics and kinetic type that play like a video, not a slideshow. Outputs one `index.html`, which can be rendered to MP4. | A browser. Node + puppeteer for MP4 export. |
| **vox-director** | One topic in, a finished documentary-style collage video out: script, voiceover, music, captions. | An **Atlas Cloud API key**. Each run spends credits. |
| **huashu-art-motion** | Turns a scene into a moving painting in dozens of art styles. | Node, Python, ffmpeg. |
| **claude-drawing** | Images drawn in code, stroke by stroke, with draw-on GIFs. 83 styles. No image model. | Python, numpy, Pillow. |

---

## The weekly rotation

Paste the day's prompt into a new session, then swap the bracketed part for that week's material.

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

### Saturday: The Remix (two skills, one piece)
> Draw a scene with claude-drawing, then animate it with huashu-art-motion. Or put a bang-motion title card in front of Wednesday's documentary.

### Sunday: The Review (no new build)
> Look at what went out this week. Which piece held attention? Which skill felt clumsy? Write three lines in `reviews/YYYY-MM-DD.md` and set next week's bracketed material.

---

## Ground rules

- **Truth first.** Use real lines, real scenes, real history. No invented biography, no costume.
- **One accent color a week.** It keeps the feed recognizable.
- **Save what ships.** Put finished files in `output/YYYY-MM-DD-skill/` and commit them, because cloud sessions are wiped.
- **Vox Director costs money.** If the Atlas Cloud key isn't set up, run Wednesday through bang-motion's explainer styles instead.

## Where these came from

All MIT-licensed. Showcase GIFs and MP4s were left out to keep the repo light. Every script, font, reference, and code example is intact.

- bang-motion: github.com/bangtutorial/bang-motion @ c1aa65e
- vox-director: github.com/Alisa0808/vox-director @ 6a85a7c
- huashu-art-motion: github.com/alchaincyf/huashu-art-motion @ a97c450
- claude-drawing: github.com/cloveric/claude-drawing-skill @ 6af36dc (skill renamed from `claude绘图` to `claude-drawing` so Claude Code accepts it)

To update one later: re-clone the upstream repo and copy it over its folder in `.claude/skills/`.
