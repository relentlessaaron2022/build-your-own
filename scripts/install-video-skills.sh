#!/bin/sh
# Installs the video skills into .claude/skills so Claude Code picks them up.
# Safe to re-run: each run refreshes to the latest upstream version.
#
#   HyperFrames by HeyGen   heygen-com/hyperframes        (Apache-2.0)
#   OneTake                 feitangyuan/onetake           (PolyForm Noncommercial: no commercial use)
#   Collage B-roll          pyang5166/gbro-collage-broll  (MIT; needs GEMINI_API_KEY)
#   Lemo Opuscar            lemomo-ai/lemo-opuscar        (MIT)
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SKILLS="$ROOT/.claude/skills"
CACHE="$ROOT/.claude/skill-sources"
mkdir -p "$SKILLS" "$CACHE"

# fetch <owner/repo> <dir> [sparse paths...]
fetch() {
  repo=$1; dir="$CACHE/$2"; shift 2
  if [ -d "$dir/.git" ]; then
    git -C "$dir" fetch --quiet --depth 1 origin HEAD && git -C "$dir" reset --quiet --hard FETCH_HEAD
  elif [ $# -gt 0 ]; then
    git clone --quiet --depth 1 --filter=blob:none --sparse "https://github.com/$repo.git" "$dir"
    git -C "$dir" sparse-checkout set "$@"
  else
    GIT_LFS_SKIP_SMUDGE=1 git clone --quiet --depth 1 "https://github.com/$repo.git" "$dir"
  fi
}

# place <source dir> <skill name>: copy a skill folder into .claude/skills
place() {
  rm -rf "$SKILLS/$2"
  cp -R "$1" "$SKILLS/$2"
  rm -rf "$SKILLS/$2/.git"
}

fetch heygen-com/hyperframes hyperframes skills
for s in "$CACHE"/hyperframes/skills/*/; do
  place "$s" "$(basename "$s")"
done

fetch feitangyuan/onetake onetake
place "$CACHE/onetake" onetake

fetch pyang5166/gbro-collage-broll gbro-collage-broll
place "$CACHE/gbro-collage-broll" gbro-collage-broll

fetch lemomo-ai/lemo-opuscar lemo-opuscar plugin/skills
place "$CACHE/lemo-opuscar/plugin/skills/lemo-opuscar" lemo-opuscar

echo "video skills installed in $SKILLS:"
ls "$SKILLS"
