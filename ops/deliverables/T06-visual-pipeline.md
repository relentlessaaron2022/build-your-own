# T06: Story-to-Series AI Scouting

You have a shelf of stories that already play like television in the reader's head. The corner at dusk. The clang of a cell door. The quiet in a room right before somebody makes a power move. Right now those scenes live on the page. You want them on a screen without a studio deal, without a crew, and without spending money you can't win back. This report closes that gap. It tells you what the tools can do in November 2026, what they cost, and how to build one pilot episode step by step.

## Verdict

**Partly. Yes on the pilot, no on a flawless broadcast-grade series. Not yet.**

You can make one ~10-minute pilot from a Relentless Aaron story for roughly **$300 to $550 in subscriptions and API fees** (math below, every figure dated and sourced, gaps marked). That is low cost. Nobody would have believed that number three years ago.

Here is why the answer is "partly" and not a clean "yes":

1. **Clip length is short.** Most video models still produce 5 to 15 seconds per generation. A 10-minute episode is 600 seconds of finished picture. That means somewhere between 60 and 120 separate shots, each one generated, judged, and often regenerated. The work is real. Plan on 40 to 80 hours of human time for one episode [VERIFY: estimate, no published benchmark; track your actual hours on the pilot].
2. **Consistent characters are now possible, not guaranteed.** Kling's Element Library lets you lock a character with 2 to 4 reference images and even bind a voice to that character. That is the single biggest change of the last year. Drift still happens across lighting changes and wide shots. You will throw away takes.
3. **Content filters.** Street lit lives in guns, prison violence, drugs and sex. Commercial video models refuse or soften some of that. You will have to stage some beats by implication: the sound off-screen, the aftermath, the face. That can be stronger storytelling, but it is a constraint you should know before you start [VERIFY: test your three hardest scenes on each platform before paying for a full month].
4. **Dialogue is the weak spot.** Lip-sync tools work well on close-ups of one speaker. Two people arguing across a table in a wide shot is still hard. Write the pilot so the heavy talk sits in close-ups and over-the-shoulder shots.

So the honest call: a stylized, cinematic-looking pilot that proves the world and gets people asking for episode two is within reach this month. A full season that looks like premium cable is not, at this budget, today. Start with the pilot. Let the pilot pay for the next step.

## Tool Stack

One tool per job. Fewer logins, fewer bills, fewer places for a character's face to drift.

**1. Script to shot list (you plus a chat model).** Adapt the chapter into a teleplay, then break it into numbered shots: shot size, angle, who is in frame, line of dialogue, duration. This is writing work, not a tool purchase. Your existing AI chat subscription covers it.

**2. Storyboard and look development: Nano Banana 2 (Google Gemini API) or LTX Studio.** Generate one still per shot first. Stills are cheap, video is not. Google's AI Studio pricing page lists Nano Banana 2 (`gemini-3.1-flash-image`) at $0.067 per 1K image and Nano Banana 2 Lite at $0.0336 per 1K image. If you'd rather work inside a storyboard app, LTX Studio's Standard plan ($28/mo per Toolradar, verified Nov 9, 2026) is the first tier with AI Storyboards and a commercial license. The Lite tier at $12 is personal-use only, so it does not fit a pilot you plan to sell or monetize.

**3. Character lock: Kling Element Library.** Per Kling's own guide, each character element takes a front-facing main image plus 1 to 3 supplementary images, or a 3 to 8 second video clip of the character. Video 3.0 lets you bind up to 3 elements to a start frame. Omni mode accepts up to 7 elements without a video input. Creating elements is free. Character elements in 3.0 Omni can carry a bound voice from 5 to 30 seconds of clean audio. Build your lead, your rival and your key location as elements before you generate a single shot.

**4. Video generation: Kling (main), Veo 3.1 Lite or Fast (backup).** Kling handles the bulk because of the element system. Keep Google Veo 3.1 Lite in your back pocket for establishing shots and B-roll: per WaveSpeed's pricing guide (Sept 28, 2026), Veo 3.1 Lite runs $0.05/sec at 720p and $0.08/sec at 1080p, with audio included. Runway is a strong option too. Its Max plan ($95/mo, 9,500 credits) supports Gen-4.5 at 12 credits per second and also resells Kling 4.0 and Seedance 2.0 Pro. But 9,500 credits only buys about 791 seconds of Gen-4.5. That is barely more than one finished episode with zero retakes.

**5. Voice: ElevenLabs.** Cast each character a distinct voice. Creator plan, $22/mo, about 121 minutes of TTS, Professional Voice Cloning included. If Aaron narrates the cold open himself, a professional clone of his own voice (with his consent and his recording) gives the series a signature sound. [AARON: would you voice a narrator or opening monologue? Your call, your voice.]

**6. Lip-sync: Hedra Character-3.** Feed it a start frame and the audio track and it animates the face. Hedra's model page lists 2.5¢/sec at 540p, 5¢/sec at 720p and 6.25¢/sec at 1080p, with clips up to 10 minutes. Use it for close-up dialogue. Use Kling's native audio for everything else.

**7. Music: Suno.** Score cues, a theme, a closing track. Suno Pro is $8/mo billed yearly ($96/yr) with commercial rights. The free tier does not include commercial rights, so don't score a pilot on it. Better still, put the circle on the soundtrack. A real Atlanta Music Alliance track over the end credits is worth more than any generated cue, and it lifts the circle with the books. [AARON: which AMA, CoCo Kity or Bobby Monroe tracks are cleared for use?]

**8. Edit, captions, color: CapCut Pro.** $19.99/mo or $179.99/yr per CapCut's pricing page, with the note that final prices show after sign-in. If you already own another editor you know cold, use that. Familiarity beats features in the edit.

## Cost Breakdown

Assumptions: 600 seconds of finished picture, a 3-to-1 generation ratio (1,800 seconds generated to keep 600) [VERIFY: shooting ratio is an estimate; measure it during the pilot], about 120 storyboard stills, about 300 seconds of lip-synced close-up dialogue generated (2 takes of 150 seconds), one month on each subscription.

| Line item | Plan / rate | Source date | Pilot cost |
|---|---|---|---|
| Storyboard stills | Nano Banana 2, $0.067 per 1K image, ~120 to 300 images | AI Studio pricing page, read Nov 22, 2026 | $8 to $20 |
| Storyboard app (optional) | LTX Studio Standard, $28/mo | Toolradar, verified Nov 9, 2026 | $0 to $28 |
| Main video | Kling Ultra, $180/mo, 26,000 credits. Video 3.0 at 1080p with native audio = 12 credits/sec, so 1,800 sec = 21,600 credits | eesel.ai, last edited June 5, 2026 | $180 [VERIFY: Kling rates on kling.ai before buying; third-party data is from mid-2026] |
| Backup B-roll | Veo 3.1 Lite, $0.08/sec at 1080p, ~300 sec | WaveSpeed, Sept 28, 2026 | ~$24 |
| Voices | ElevenLabs Creator, $22/mo (~121 min TTS) | ElevenLabs pricing page, read Nov 22, 2026 | $22 [VERIFY: first-month $11 promo] |
| Lip-sync | Hedra Character-3, $0.0625/sec at 1080p, ~300 sec | Hedra model page, read Nov 22, 2026 | ~$19 [VERIFY: whether this rate needs a paid Hedra plan; third-party sources list plans from $20/mo] |
| Music | Suno Pro, $8/mo billed yearly | Suno pricing page, read Nov 22, 2026 | $8 to $96 [VERIFY: monthly-only price; the page showed the annual figure] |
| Editing | CapCut Pro, $19.99/mo | CapCut pricing page, read Nov 22, 2026 | $20 |
| **Total** | | | **~$281 to ~$409** |

Add a 30% cushion for retakes, wasted generations and a second month on the video tool if you run long. That puts the realistic ceiling near **$550** [VERIFY: cushion is a planning estimate].

**Cheaper path.** Drop to 720p on Kling (9 credits/sec with audio, so 16,200 credits). Kling Premier at $92/mo gives 8,000 credits, which is not enough on its own, so the cheaper path really means Kling Premier plus about 900 seconds of Veo 3.1 Lite at $0.05/sec ($45). That trims the video line to about $137 and the total to the low $200s [VERIFY: add-on credit pack prices on kling.ai could beat this].

**What this does not include:** your time, cover art, marketing spend, and any lawyer review of music or likeness rights. Use only characters and stories Aaron owns outright. Never prompt a tool with a real person's name or face.

**Watch the clock.** Subscription credits on Kling and Suno do not roll over. Buy the month only when your storyboard is locked, so every credit goes to shots you already planned.

## Pilot Episode Rollout

1. **Pick the story.** Choose one self-contained chapter or novella opening with two or three lead characters, a small number of locations, and a hard cliffhanger at the 10-minute mark. A Push series or Last Kingpin opener fits that shape. [AARON: which title and chapter do you want as the pilot? Pick the one you'd want a stranger to see first.]
2. **Write the teleplay.** 10 pages, roughly one page per minute. Push the heavy dialogue into close-ups. Stage violence through sound, shadows and aftermath so the content filters don't stall you.
3. **Break it into a shot list.** Number every shot. For each: shot size, angle, characters, line, seconds. Aim for 70 to 100 shots.
4. **Test the hard scenes first (free tiers).** Before you pay for anything, run your three hardest beats through Kling's free daily credits and Veo. If a platform refuses them, you know now, not on day 20.
5. **Design the characters.** Generate a front-facing portrait plus 3 angles of each lead with Nano Banana 2. Keep wardrobe fixed. Save every winning image with a version number.
6. **Build Kling Elements.** Upload each character and each key location as an element. Bind voices to the leads once you've cast them in ElevenLabs.
7. **Storyboard every shot as a still.** Fix composition, light and color at the still stage. It costs cents per frame. It costs dollars to fix in video.
8. **Record the voice track.** Generate every line in ElevenLabs. Cut a radio-play version of the full episode first. If the audio alone holds you for 10 minutes, the episode will work.
9. **Buy the video month and generate.** Image-to-video from your approved stills, elements bound, in shot-list order. Keep the takes that match. Log the shot number on every file.
10. **Lip-sync the close-ups.** Run dialogue close-ups through Hedra Character-3 with the matching audio.
11. **Score it.** Theme and cues from Suno, or better, cleared tracks from the circle.
12. **Edit.** Assemble in CapCut. Lock picture first, then sound, then color, then burned-in captions for the vertical cutdowns.
13. **Cut the trailer and three vertical clips.** 30 to 60 seconds each for IG @relentlessaaron, TikTok @relentlessaaron1 and FB relentless.aaron. Every clip ends on the book: title, where to buy, "read what happens next."
14. **Release and measure.** Post the full pilot on YouTube, the clips on short-form. Watch completion rate and book clicks, not likes. [VERIFY: set your success threshold before launch, for example book sales lift during the 14 days after release, measured against the 14 days before.]
15. **Decide on episode two.** If the pilot moves books, roll its revenue into episode two. If it doesn't, you've spent a few hundred dollars to learn what a studio would have charged you a fortune to find out.

The tools are finally good enough to show people the world you've been building on the page. Your next step is small. Pick the chapter and run three test shots on the free tiers this week.

## Sources

Every page below was read for this report on Nov 22, 2026. Prices change. Re-check before you buy.

- ElevenLabs pricing: https://elevenlabs.io/pricing
- Suno pricing: https://suno.com/pricing
- Runway pricing: https://runway.com/pricing
- Google AI Studio / Gemini API pricing (Nano Banana image prices): https://aistudio.google.com/docs/pricing
- Veo 3.1 per-second prices (WaveSpeed, Sept 28, 2026): https://wavespeed.ai/blog/cost-and-billing/google-veo-3-pricing/
- Veo 3.1 Lite launch coverage (The Decoder, Mar 31, 2026): https://the-decoder.com/googles-veo-3-1-lite-cuts-video-generation-costs-by-more-than-half/
- Google blog, Veo 3.1 Lite: https://blog.google/innovation-and-ai/technology/ai/veo-3-1-lite/
- Kling plans and credit rates (eesel.ai, edited June 5, 2026): https://www.eesel.ai/blog/kling-ai-pricing
- Kling Element Library user guide: https://kling.ai/quickstart/klingai-element-library-3-user-guide
- Hedra Character-3 model page: https://www.hedra.com/video-models/hedra-character-3
- LTX Studio pricing (Toolradar, verified Nov 9, 2026): https://toolradar.com/tools/ltx-studio/pricing
- CapCut pricing: https://www.capcut.com/pricing
