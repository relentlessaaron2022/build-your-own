# Glass Widgets

The effect used on GHR-EP08: milky frosted-glass cards that drop in beside the host, plus glass panels that replace the burned-in bullet captions.

- `scan.py` scans an episode at 10 frames per second and records where slides, bullets and title cards appear.
- `glass3.py` renders the finished video. It needs Python 3 with Pillow and NumPy, ffmpeg, and the Inter font.

```
python3 scan.py source.mov scan.json
python3 glass3.py source.mov GHR-EP08-glass.mp4 avatar.png
```

The EP08 data (repo names, star counts, bullet text and timings) is currently written into `glass3.py`. Before the weekly scheduled run goes live, that data moves into a per-episode file so the script works on any episode.
