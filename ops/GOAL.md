# GOAL — Step 1: Align

**Mission:** Run the Relentless ecosystem so it brings in **$100,000+ every 90 days**, then scales toward $1M.
Fiction and music go out under Relentless Aaron. Non-fiction goes out under DeWitt Gilmore. The circle (CoCo Kity, Bobby Monroe, Atlanta Music Alliance) gets lifted right along with the books.

## What "done" means (for every task)
A task counts as DONE only after `python3 ops/verify.py` passes it. Nobody's opinion counts, the lead's included. The checker looks at:
1. The deliverable sits at the exact path the contract names.
2. It has every section heading the contract requires.
3. It meets the minimum word count.
4. It has **zero** banned AI-tell words or phrases (list in `verify.py`, taken from the Writing Rules).
5. It has **zero** mentions of the banned name.
6. Every made-up number or personal story is marked `[VERIFY: ...]` or `[AARON: ...]`. Biographical truth is non-negotiable.

## Agendas (workstreams)
| # | Agenda | Owner |
|---|--------|-------|
| A1 | Revenue & Operations Engine | subagent |
| A2 | Website content | subagent |
| A3 | Social media | subagent |
| A4 | Books (catalogue expansion) | subagent |
| A5 | Music + Moltbook | subagent |
| A6 | Tech & visual pipeline (story-to-series AI) | subagent |

## Escalation rules (keep it simple, only go bigger when you hit a limit)
- State: one plan file (`tasks.json` → `PLAN.md`). Move to a shared database only when several agents are writing at once and colliding.
- Compute: one session. Move to separate VMs only when this machine can't keep up.
- Assignment: the lead hands out every task. Switch to letting agents claim from `tasks.json` only when the lead becomes the bottleneck.
- Splitting: if a task is too big, the subagent breaks it up and adds the pieces to `tasks.json` with status `todo`.
