# Relentless Skill Suite

Project skills for the Relentless Aaron / DeWitt Gilmore empire. Claude Code
auto-discovers every `SKILL.md` in this folder — no install step. Just describe
what you want and the matching skill activates, or invoke one by name with
`/<skill-name>`.

## Skills

| Skill | Use it for |
|---|---|
| `revenue-engine` | **Start here.** Business strategy, pricing, funnels, 90-day revenue planning. The hub that monetizes everything else. |
| `seo-optimizer` | Ranking web pages, articles, book/product/video listings — keywords, metadata, schema. |
| `web-design-studio` | Landing pages, author/artist sites, book sales pages, funnels. |
| `ai-video-production` | Book trailers, music videos, story-to-series animation, reels, ads. |
| `ai-music-production` | Songwriting, production direction, cover art, release + promo. |
| `book-writing-coach` | Outlining and drafting fiction (street-lit) and non-fiction. |
| `book-publishing-coach` | KDP/IngramSpark formatting, metadata, pricing, launch. |
| `comic-book-publishing` | Comics/graphic novels — scripts, layout, print/Webtoon. |
| `childrens-book-publishing` | Picture books, early readers, middle-grade. |
| `cartoon-production` | Animated series — kids and adult lanes. |
| `news-broadcast-company` | News shows, AI anchors, multi-platform media network. |

## How skills load

- **Project scope (here):** committed to the repo, shared with anyone who clones it.
- **Global scope:** copy any folder to `~/.claude/skills/` to use it across all projects.
- Each skill is a folder with a `SKILL.md` (YAML frontmatter `name` + `description`, then instructions). Add supporting files to a skill's folder as it grows.

## Extending the suite

Use the `skill-creator` skill to scaffold new skills or refine these. Keep each
`description` specific — it's what tells Claude when to reach for the skill.
