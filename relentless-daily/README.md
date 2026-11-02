# Relentless Daily

One finished, upload-ready vertical video a day. Your voice, your pictures, and the motion graphics you used to build in CapCut, all done by one command.

## What you send each day

1. **Your voice memo**: any format (m4a, mp3, wav), 20–60 seconds works best for Shorts and Reels. Talk naturally. Pauses are fine; they become the cut points.
2. **Your pictures**: 3–6 AI images or 10-second clips (VideoExpress, HeyGen and so on), in the order the story goes. Vertical is best; anything else is cropped to fill.
3. **A few notes**:
   - which look: **Be Nice**, **Daily Message** or **Relentless Times**
   - the title and episode number
   - the one line you want as the big quote card (copy it as you said it)
   - optional: a text card ("Start before you feel ready.") or a stat card ("$16.3B", "revenue in six months") to put between your pictures
   - optional: a music file you have the rights to (it's ducked under your voice automatically)
   - Relentless Times only: the straps (tab, headline, source) and the phrase each one starts on

Upload them in chat and say "make today's episode." That's it.

## What the template does on its own

| Your old CapCut step | Now |
|---|---|
| Cutting pictures to the voice | Cuts are spread across your recording and land in the pauses between words |
| Ken Burns / zooms | Every still gets a slow push, pull or drift; clips play full screen |
| Captions | Word-by-word, timed to your actual voice, the current word highlighted in the look's color |
| Title card | Series, episode and title in the first 2.5 seconds (the hook) |
| Quote overlay | Your quote line becomes a full card, revealed word by word as you say it |
| Transitions | Be Nice: storybook circle opening · Daily Message: light flash · Relentless Times: whip with a yellow bar |
| Overlays / B-roll feel | Drifting light, film grain, vignette and warm light leaks on every frame |
| End screen | Tagline, a pulsing follow button and @relentless |
| Sound | Voice cleaned and leveled, a whoosh on each cut, a riser into the title, an impact on stat cards, a chime on the end card, loudness set to −14 LUFS for the platforms |

## Making one by hand

```
episodes/2026-11-03-be-nice-ep3/
  episode.json
  voice.m4a
  media/01.jpg, 02.mp4, ...
```

```json
{
 "look": "be-nice",
 "series": "Be Nice", "episode": 3, "title": "The Empty Seat",
 "voice": "voice.m4a",
 "quote": "Nobody should eat lunch alone.",
 "scenes": [
  {"media": "media/01.jpg"},
  {"media": "media/02.mp4"},
  {"type": "text", "text": "One seat. One choice."},
  {"media": "media/03.jpg"}
 ],
 "cta": "Follow for Episode 4 tomorrow", "handle": "@relentless"
}
```

```
./make.sh 2026-11-03-be-nice-ep3              # vertical 1080×1920
./make.sh 2026-11-03-be-nice-ep3 1920x1080    # a 16:9 cut for YouTube or Facebook
```

The finished file is `episodes/<name>/<name>.mp4`.

Extra fields: `"music": "music.mp3"` and `"music_db": -17` (bed level); `"tagline"` (end-card line); `"spellings": {"Misheard": "Right"}` to fix a name the transcriber gets wrong; `"motion": "in" | "out" | "left" | "right" | "up"` on a scene; `"at": "a phrase"` on a scene to start it exactly on those words; `"weight": 2` to give a scene twice the time.

Without a voice file, `"script"` is read by an AI placeholder voice and the end card says so. That's how the three samples were made.
