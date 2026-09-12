# BUILD_STATUS

Last updated: 2026-09-12

This is a real, running system, not a strategy document. Everything under
"Completed" below has been executed end-to-end in this environment
(installed, run, and in most cases covered by an automated test) against
either synthetic data or the live `relentlessaaron.net` / `webfilmbooks.com`
sites. Nothing here is aspirational pseudocode.

One structural note up front: the original brief said "create a
repository called relentless-pinterest-autopilot." This session's git
environment is scoped to a single existing repo
(`relentlessaaron2022/build-your-own`) on a single designated branch
(`claude/execute-d5udl4`) -- there's no ability to create and push to a
brand-new separate GitHub repo from here. So the project lives as
`relentless-pinterest-autopilot/` inside that repo instead. It's a fully
self-contained Python project (its own `pyproject.toml`, `.venv`,
`requirements.txt`) -- if a standalone repo is wanted later, it's a
`git subtree split` / copy-and-push away, no code changes required.

## Completed

**Phase 1 -- foundation**
- Project scaffolding matching the spec's layout (`app/`, `config/`,
  `assets/`, `data/`, `scripts/`, `logs/`, `reports/`)
- SQLite database (SQLAlchemy 2.0 models) with all six tables from the
  spec: `campaigns`, `source_content`, `keywords`, `pin_concepts`, `pins`,
  `pin_metrics` -- every field from the spec is present. Swapping to
  Postgres/Supabase later is a one-line `DATABASE_URL` change; nothing
  touches raw SQL.
- Pinterest API v5 client (`app/pinterest/client.py`): OAuth token
  refresh, board listing/creation, pin creation (base64 image upload),
  pin reading, analytics retrieval. No browser automation anywhere.
  Typed exceptions (`CredentialsMissingError`, `RateLimitError`,
  `TransientAPIError`, `PinterestAPIError`) so callers can tell "not set
  up yet" apart from "retry me" apart from "this will never work."
- Structured logging to `logs/autopilot.log` (rotating) + stdout.
- Scheduler foundation (APScheduler) with all six jobs wired to the
  spec's cadence: discovery/generation every 6h, publish spaced at
  8/11/14/17/20 instead of a blind hourly loop, analytics + optimization
  daily, weekly_strategy weekly.
- **Milestone**: `pinterest publish-test` runs the exact code path that
  publishes one pin through the official API. Verified in this session
  that it correctly detects missing credentials and reports exactly which
  env vars are needed, rather than crashing or faking success. It has not
  yet published a *real* pin because no Pinterest developer app exists
  yet for this account (see Credentials Required below) -- that's the
  only thing standing between here and the literal milestone.

**Phase 2 -- content, copy, creative**
- Content discovery (`app/discovery/`): WordPress REST API -> RSS ->
  sitemap fallback chain. **Verified live** against
  `relentlessaaron.net` (20 posts pulled via WP REST API) and
  `webfilmbooks.com` (14 posts). Scored correctly: personal/narrative
  posts on relentlessaaron.net scored below the promotion threshold
  (they're not prompt/AI/business content), which is the scorer doing
  its job, not a bug.
- Keyword engine: heuristic generator (zero credentials needed) plus an
  optional LLM pass if `OPENAI_API_KEY` is set. Never blocks.
- Headline engine: all 5 families (LIST, CURIOSITY, TRANSFORMATION,
  PROBLEM/SOLUTION, BEGINNER), each with multiple template phrasings.
- Description + CTA generator, pulling approved CTAs and banned-phrase
  scrubbing from `config/brand.json` per brand.
- Creative engine: all 5 minimum templates (Bold Headline, Checklist,
  Curiosity, Before/After, Authority), rendered with Pillow at the exact
  spec'd 1000x1500 / 2:3 canvas, auto-shrinking text so nothing is ever
  cut off. `ImageProvider` abstraction with `TemplateProvider` (default,
  free, deterministic) and an `OpenAIImageProvider` stub for when
  generative creative is explicitly wanted; `CanvaProvider` is a
  documented not-yet-implemented placeholder.
- Duplicate detection: this took real iteration. A naive 8x8 average hash
  (the common toy implementation) was tried first and **rejected after
  live testing** -- it collapsed different headlines on the same
  template to ~90-100% "similar" because centered text on a solid
  background barely moves a coarse average. Replaced with a 1024-bit
  difference hash (dHash), which tracks actual glyph edges. Verified:
  identical renders -> 100% similarity; a one-word tweak of the same
  headline -> ~99% (correctly still flagged -- the spec explicitly bans
  "just change a number and republish"); two genuinely different
  headlines on the same template -> comfortably under 90%. Text
  similarity (difflib) and a concept fingerprint (headline + style +
  keyword + destination + CTA) round out the three checks the spec asks
  for.
- Quality control gate: all 11 checks from the spec (destination URL,
  image exists, correct dimensions, headline non-empty, board exists,
  campaign active, destination relevance, no duplicate image/copy,
  description exists). Failing pins are marked `regenerate`, never
  published.
- 5x5 campaign generator: verified end-to-end with a real run --
  25 concepts generated from 5 search-intent angles x 5 headline/visual
  combinations, 24/25 cleared QC and queued, 1 was a genuine near-dupe
  correctly caught. Covered by an automated test.

**Phase 3 -- automatic queue**
- Queue depth tracking (`MIN_QUEUE_DAYS` / `TARGET_QUEUE_DAYS`,
  configurable via `.env`) and `needs_generation()`.
- Retry/backoff on publish failures follows the spec's exact schedule
  (1m / 5m / 30m / 2h, then flag). Rate-limit (429) handling stops the
  current publish run rather than hammering the API.
- UTM parameters (`utm_source=pinterest`, `utm_medium=organic`,
  `utm_campaign=<slug>`, `utm_content=pin_<id>`) injected automatically
  on every destination URL.

**Phase 4 -- analytics**
- Analytics ingestion from the Pinterest API (per-pin impressions,
  saves, outbound clicks -> CTR, save rate, engagement rate).
- Winner/loser classification using **rolling account benchmarks**
  (median CTR/save-rate/conversions across pins with enough impressions
  to trust), not fixed numbers, exactly as specified.
- Winner recycling: generates new descendant concepts (different
  headline family, different template, different keyword variant, new
  CTA) rather than reposting the same creative, and marks the parent
  `winner_recycled` so it isn't recycled every single day.
- Loser retirement: marks underperforming concepts `deprioritized`;
  nothing is deleted, so history is preserved.

**Phase 5 -- dashboard**
- A local Flask dashboard (`pinterest dashboard`, verified returns HTTP
  200 and renders correctly) showing: today's pins/impressions/clicks/
  saves/conversions; last-7-days top pins, lowest performers, top
  keywords, top boards, best landing pages; queue depth, scheduled pins,
  failed pins, active campaigns, winner concepts.
- Weekly report generator matching the spec's exact example format,
  saved to `reports/`.

**Testing**
- 46 automated tests (`pytest tests/`), all passing, covering headline
  generation, keyword generation, the duplicate-detection fix
  specifically (including a regression test for the average-hash bug
  described above), creative rendering, all 5 QC failure modes, the full
  campaign-generation-to-queued-pin pipeline, UTM injection, and
  credential-missing error paths.

## Post-Review Hardening

An automated code review (Qodo) on the PR surfaced 16 real bugs across
concurrency, correctness, and reliability -- all verified and fixed, each
with a regression test:

- A fresh-install crash (a newly created campaign was never committed
  before a second session looked it up).
- The queue silently running dry after the first ~25-pin batch (repeated
  generation cycles reused identical inputs and collided on fingerprint
  forever) -- generation now rotates through the full keyword-angle pool
  and loops batches until the queue target is met.
- Two double-publish risks: concurrent publish invocations could both
  claim the same pin (fixed with an atomic claim-before-call transition),
  and an ambiguous timeout/5xx could retry a create_pin that had actually
  already succeeded (fixed by reconciling against the board via the
  pin's unique UTM-tagged link before ever retrying).
- Analytics double-counting (overlapping ingestion windows inserted a
  fresh row every run; now upserted per pin+day) and the winner/loser
  benchmark summing all-time history instead of a rolling window.
- QC-failed and permanently-failed concepts being dead ends (nothing ever
  reprocessed them, and their own fingerprint blocked recreating them) --
  each failure now spawns one genuinely different replacement concept.
- A packaging gap that would break every non-editable install (only the
  top-level `app` package, and no dashboard template, were included in a
  built wheel -- editable dev installs masked this).
- Several smaller reliability/validation gaps: OAuth-refresh network
  errors escaping the typed retry path, sitemap-index handling that could
  loop or store sitemap documents as content, malformed WordPress/LLM
  responses aborting their callers instead of falling back, a hardcoded
  publish-slot size that ignored `DAILY_PIN_TARGET`, and `pinterest
  publish-test` bypassing the `pause` kill switch.

Separately, while wiring up real Pinterest credentials, live testing
surfaced one more: `pinterest_credentials_present` and the client's
`_ensure_credentials` both required a client id/secret even when a
standalone access token (which Pinterest's developer portal can issue
directly, before an app has a secret at all under "trial access") was
already sufficient for Bearer-token API calls. Fixed and covered by a
regression test.

## Currently Building / Partially Done

- **Phase 6 (expand to WebFilmBooks, other verticals)**: the
  architecture supports this today -- `config/sites.json` and
  `config/offers.json` are already lists, and WebFilmBooks is already
  configured as a discovery source with its own brand identity in
  `config/brand.json`. What's missing is a WebFilmBooks *offer* (a
  specific landing page/product to run a 5x5 campaign against) and
  WebFilmBooks-specific board mappings -- add an entry to
  `config/offers.json` and it flows through the exact same pipeline
  already proven on Prompt Mastery Studio.
- **Content mix weighting** (spec's example: 2 Prompt Mastery + 1 website
  design + 1 AI entrepreneur + 1 evergreen per day) and the 70/30
  proven/experimental split are implemented at the concept level
  (winner recycling = "proven," fresh campaign generation = "experimental")
  but not yet enforced as an explicit daily ratio scheduler -- right now
  `generation_job` runs every active offer's campaign each cycle rather
  than picking a weighted daily mix. Straightforward to add once there's
  more than one active offer to actually weight between.
- **Analytics/winner-loser evaluation** is implemented and tested against
  synthetic data, but literally untested against real Pinterest metrics,
  because no pin has published yet (see below). The logic is sound but
  "sound in theory" and "correct against real Pinterest response shapes"
  aren't the same claim -- flag this as the first thing to sanity-check
  once real data exists.

## Blocked

Nothing is blocked in the sense of "can't proceed." Everything that
doesn't require external credentials has been built and tested. The
literal Phase 1 milestone -- publish one real pin -- is one `.env` fill-in
away, not a code problem.

## Credentials Required

To reach "publish one real test pin" and beyond:

1. **Pinterest**: create an app at
   [developers.pinterest.com](https://developers.pinterest.com). Two
   paths, both supported:
   - **Full OAuth (recommended for continuous operation)**: complete the
     OAuth flow once to get a refresh token, then set `PINTEREST_CLIENT_ID`,
     `PINTEREST_CLIENT_SECRET`, and `PINTEREST_REFRESH_TOKEN` in `.env`.
     The client refreshes the access token from this automatically,
     indefinitely.
   - **Standalone access token (works immediately, including under
     Pinterest's "trial access pending" state where the app secret isn't
     issued yet)**: the developer portal's "Generate Access Tokens" panel
     can hand out a token directly. Set only `PINTEREST_ACCESS_TOKEN` in
     `.env` -- no client id/secret needed for this path, since every /v5
     call is plain Bearer auth. The catch: this stops working once the
     token expires (no refresh path without client id/secret), and a
     trial-scoped token's listed permissions may be **read-only**
     (`pins:read`, `boards:read`, `user_accounts:read`, ...) -- enough for
     `pinterest status` / `sync-boards` to prove connectivity, but a real
     `publish-test` needs write scopes, which likely requires Pinterest
     granting the app standard (non-trial) API access first.

Optional, both degrade gracefully to built-in heuristics when absent:

2. **OpenAI** (`OPENAI_API_KEY`) -- sharper keyword research and
   headline phrasing than the built-in templates, plus the
   `OpenAIImageProvider` generative-creative option.
3. **WordPress** (`WORDPRESS_USERNAME` / `WORDPRESS_APP_PASSWORD`) --
   only needed if a site's REST API is private; public discovery already
   works without it (proven live against both configured sites).

## Next Steps

1. Get Pinterest OAuth credentials into `.env`.
2. `pinterest sync-boards` to map `config/boards.json` names to real
   board IDs (or `--create-missing` to create them).
3. `pinterest generate` then `pinterest publish-test` -- this is the
   Phase 1 milestone.
4. Once that succeeds: `pinterest run` to start the continuous
   scheduler, and watch `pinterest dashboard` / `pinterest status` for a
   few days.
5. After the first real analytics data comes in, sanity-check
   `pinterest analytics` output against Pinterest's own analytics UI
   before trusting the winner/loser classification unattended.
6. Add a WebFilmBooks offer to `config/offers.json` to expand past the
   single Prompt Mastery Studio campaign (Phase 6).
