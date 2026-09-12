# Relentless Pinterest Autopilot

An automated Pinterest marketing engine: it discovers content, researches
keywords, writes headlines and descriptions, renders pin graphics,
de-duplicates and quality-checks everything, queues it, publishes through
the official Pinterest API on a schedule, tracks performance, and recycles
winners into new variations. Built per the spec in `BUILD_STATUS.md`.

Everything that doesn't require Pinterest/OpenAI credentials works today
and is tested. See `BUILD_STATUS.md` for exactly what's done, what's
blocked on credentials, and what's next.

## Quickstart

```bash
cd relentless-pinterest-autopilot
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env          # fill in credentials as you get them

python scripts/init_db.py     # create tables + seed offer campaigns

pinterest generate            # build a 5x5 (~25-pin) campaign, render
                               # graphics, run duplicate/QC, queue it
pinterest queue                # see what's queued
pinterest status               # kill switches, queue depth, Pinterest connectivity
pinterest dashboard             # http://127.0.0.1:5151
```

Publishing needs real Pinterest OAuth credentials:

```bash
pinterest sync-boards          # map config/boards.json to live board IDs
pinterest publish-test         # Phase 1 milestone: publish ONE pin
pinterest run                  # start the continuous scheduler
```

## Configuration

Everything that could plausibly change lives in `config/*.json`, not in
code:

- `config/sites.json` -- which sites to discover content from
- `config/offers.json` -- which offers/products to drive Pinterest traffic to
- `config/boards.json` -- which boards exist, and their live Pinterest IDs
  once synced
- `config/brand.json` -- per-brand colors, fonts, approved CTAs, banned
  phrases, and domain-to-brand mapping

Secrets and operational toggles live in `.env` (see `.env.example`).

## CLI

| Command | What it does |
|---|---|
| `pinterest init-db` | Create tables |
| `pinterest discover` | Run content discovery across configured sites |
| `pinterest generate [--force]` | Run one generation cycle (5x5 campaign -> queue) |
| `pinterest queue` | Show queue depth and next queued pins |
| `pinterest sync-boards [--create-missing]` | Map config boards to live Pinterest board IDs |
| `pinterest publish-test [--concept-id N]` | Publish exactly one queued pin now |
| `pinterest publish` | Run one full publish_job pass |
| `pinterest analytics` | Ingest analytics + evaluate winners/losers |
| `pinterest optimize` | Recycle winning concepts into new variations |
| `pinterest report [--days N]` | Print + save the weekly performance report |
| `pinterest pause` / `resume` | Kill switch for publishing only |
| `pinterest status` | Kill switches, queue depth, Pinterest connectivity |
| `pinterest dashboard [--port N]` | Local dashboard web server |
| `pinterest run` | Start the continuous scheduler (all 6 jobs) |

## Tests

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```
