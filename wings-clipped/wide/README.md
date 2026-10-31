# Her Wings Were Clipped — 16:9 (1920×1080)

The same film as `../her-wings-were-clipped.mp4`, relaid for a horizontal frame (YouTube). Same voiceover cut, timeline, facts (`../FACTS.md`),
images (`../SOURCES.md`) and mix (`../mix.wav`, built by `../mix.py`); only `main.js` layout differs.

Rebuild: from $LIB, `node core/render/video.mjs <this folder> --fps 30 --workers 4 --out <this folder>/out/video.mp4`,
then `sh master.sh out/video.mp4 ../mix.wav her-wings-were-clipped-16x9.mp4 30 0`.
