---
name: claude-animation-base
description: Hand-drawn character animation videos of Clawd (or a swapped-in character) built in p5.js + p5.brush and rendered headlessly to MP4. Use when the user asks for an animated character short, a cartoon clip, a music-video style scene, new emotions/costumes for the character, or anything mentioning ClaudeAnimationBase, Clawd animation, or p5.brush video.
---

# Claude Animation Base

This folder is the starter kit from https://github.com/JohnHeibel/ClaudeAnimationBase (MIT).

1. Read `ANIMATION_GUIDE.md` in this folder before writing any scene. It holds the rules, workflow and full API.
2. Storyboard first, then build shot by shot in `src/scenes/`.
3. From this folder: `npm install`, then `node render.mjs --clip --out=out/video.mp4`.
   On a headless Linux box without a GPU add `--soft-gl`, and prefer non-watercolour fills to keep render times sane.
4. Check work with the contact sheets `render.mjs` produces before calling a render final.

See `README.md` for the file map and renderer flags.
