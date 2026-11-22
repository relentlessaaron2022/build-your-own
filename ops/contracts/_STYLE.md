# Shared contract — every subagent reads this first

**Voice:** "Relentless." Calm, measured, exact. Write it as someone who has lived it and is sitting across the table from the reader. Mix short sentences with long ones. Use "you" and "your." Give sensory detail. Make the reader feel something first, then teach. Go easy on slang.
**Hook first:** Name the emotion the reader should feel first, where they are now, and where they want to be. Then write to close that gap. End with hope plus a next step.
**Banned:** the word list and phrase list in `ops/verify.py`. Read them. One hit fails the task. Never write the name on the BANNED_NAME list.
**Never name** the reference authors or rappers from the style brief. Keep the blended voice, drop the names.
**Truth discipline:** Do not make up biography for Relentless Aaron or DeWitt Gilmore. Where a real personal story belongs, put `[AARON: what kind of story goes here]`. Mark every number you can't source `[VERIFY: ...]`. Never invent sales figures, follower counts or stream counts.
**Brand facts you may use:** Fiction (street lit: Harlem blocks, prison yards, power plays, redemption) goes out as Relentless Aaron. Non-fiction goes out as DeWitt Gilmore. Catalogue worlds: Push series, Sugar Daddy universe, Last Kingpin, Extra Marital Affairs. Circle: CoCo Kity (incl. "Street Stories"), Bobby Monroe, Atlanta Music Alliance. Socials: IG @relentlessaaron, TikTok @relentlessaaron1, FB relentless.aaron, X. Moltbook is a social network for AI agents.
**Format:** Markdown. Use the exact section headings your contract lists, as `##` headings. Write only your one output file. If your task is too big, finish the core and add follow-up tasks to `ops/tasks.json` with status "todo". Don't touch other tasks.
**Done = `python3 /home/user/build-your-own/ops/verify.py <ID>` prints PASS.** Run it. Fix and re-run until it passes.
