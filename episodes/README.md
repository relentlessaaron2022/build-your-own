# Episode Numbering

Every episode of **The GitHub Report** gets one number, one ID and one set of file names. The log in `episodes.json` is the single source of truth.

## The ID

```
GHR-EP09
```

- `GHR` is the show code.
- `EP` plus two digits is the episode number. It switches to three digits at EP 100 (`GHR-EP100`).
- Numbers never get reused or skipped. If an episode is pulled, it stays in the log with `"status": "pulled"`.

## File names

| Stage | Name | Where |
|---|---|---|
| Raw upload | `GHR-EP09-raw.mov` (any video extension) | Drive raw folder |
| Finished | `GHR-EP09-glass.mp4` | Delivered to the Claude app |

## How the next number gets picked

1. `next_episode` in `episodes.json` says which number comes next.
2. The run also reads the number printed on the episode's own slides ("THE GITHUB REPORT · EP 09").
3. If the file name, the slides and the log all agree, the run goes ahead.
4. If they disagree, the run stops and reports the mismatch instead of guessing. A wrong number on a finished episode costs more than a late one.
5. After delivery, the episode's entry gets added to the log and `next_episode` goes up by one.

## Status values

`raw` → `rendering` → `delivered` (or `failed`, or `pulled`)
