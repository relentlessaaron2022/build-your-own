#!/usr/bin/env bash
# Batch 1 go-live. DO NOT RUN on the launch branch; run only on the deploy branch after Relentless approves.
# Usage: scripts/go-live.sh https://relentlessaaron2022.github.io/build-your-own/
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_URL="${1:-https://YOUR-DOMAIN.example/}"
python3 scripts/go_live.py "$BASE_URL"
