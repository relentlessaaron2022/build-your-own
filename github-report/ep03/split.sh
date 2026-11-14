#!/bin/sh
# Cut Episode 3 into two videos at "Your desk is the data center. This one proves it." Part 1 ends on a teaser card, Part 2 opens on its own title card.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; CUT=${CUT:-86.4}
cd "$LIB"
for c in part1end part2open; do [ -f "$HERE/out/$c.mp4" ] || node core/render/video.mjs "$HERE" --fps 30 --workers 2 --size 1920x1080 --q "card=$c" --out "$HERE/out/$c.mp4"; done
SRC="$HERE/out/master.mp4"; ENC="-c:v libx264 -preset slow -crf 25 -tune grain -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -ac 2"
ffmpeg -v error -y -i "$SRC" -i "$HERE/out/part1end.mp4" -f lavfi -t 3.4 -i anullsrc=r=48000:cl=stereo -filter_complex \
  "[0:v]trim=0:$CUT,setpts=PTS-STARTPTS[v0];[0:a]atrim=0:$CUT,asetpts=PTS-STARTPTS,afade=t=out:st=$(echo "$CUT - 0.35" | bc):d=0.35[a0];[1:v]setpts=PTS-STARTPTS[v1];[v0][a0][v1][2:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" $ENC -movflags +faststart "$HERE/github-report-ep03-part1.mp4"
ffmpeg -v error -y -i "$HERE/out/part2open.mp4" -f lavfi -t 3.4 -i anullsrc=r=48000:cl=stereo -i "$SRC" -filter_complex \
  "[0:v]setpts=PTS-STARTPTS[v0];[2:v]trim=start=$CUT,setpts=PTS-STARTPTS[v1];[2:a]atrim=start=$CUT,asetpts=PTS-STARTPTS,afade=t=in:d=0.25[a1];[v0][1:a][v1][a1]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" $ENC -movflags +faststart "$HERE/github-report-ep03-part2.mp4"
