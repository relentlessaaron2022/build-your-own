# build-your-own — Relentless Ops

One lead. Small jobs handed out. One shared plan. Nothing counts as done until a machine checks it.

## The loop
1. **Align** — `ops/GOAL.md`: the mission ($100K per 90 days), the agendas, and what "done" means.
2. **Plan** — `ops/tasks.json` is the single shared state. `ops/PLAN.md` is the readable board, rebuilt from it.
3. **Implement** — each task has a contract in `ops/contracts/`, and every contract inherits `_STYLE.md`. A subagent takes one contract and writes one file into `ops/deliverables/`.
4. **Verify** — `python3 ops/verify.py` checks paths, required sections, word counts, banned AI-tell words, and the banned name. Only a PASS flips a task to `done`.

## Run a new wave
1. Add tasks to `ops/tasks.json` (status `todo`) and write a contract for each one.
2. Hand each contract to an agent: "Read `_STYLE.md` and your contract, write your output, run verify until PASS."
3. Run `python3 ops/verify.py` and read `ops/PLAN.md`.

## Scale only when you hit a limit
- Agents colliding on writes → move state to a shared database.
- Machine choking → give each agent its own VM.
- Lead is the bottleneck → let agents claim `todo` tasks themselves.
