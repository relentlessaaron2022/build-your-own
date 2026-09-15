# WEBFILMBOOKS — project context

This repo holds the standalone HTML files behind **webfilmbooks.com** (a WordPress
site that embeds these files via `<iframe>`), plus notes for maintaining them.
Any Claude Code session on this repo should read this first.

## Files in this repo
- `webfilmbooks-web-design-v11.html` — **live** on `/web-design/`. Premium design page:
  dark theme, ember particles, 23 gallery mockups, pricing, order form, preview modal,
  plus a motion layer (hero entrance, green gradient sweep on the headline, neon-glow +
  shine + 3D tilt on sample cards). Green "WEB DESIGN DEPT" tab → `/web-design/` (`target="_top"`).
- `webfilmbooks-home-v10.html` — **live** on the homepage. Same as v9 but the green
  "Web Design Dept" tab (desktop + mobile) now links to `https://webfilmbooks.com/web-design/`.
- `webfilmbooks-home-v9.html` — original homepage baseline (before the link fix).
- Older: `webfilmbooks-web-design-v10.html` (pre green-tab fix).

Bump the version number when editing (v11 → v12, etc.), commit, then deploy.

## The live site (WordPress at webfilmbooks.com)
Pages embed the uploaded HTML files through an `<iframe id="wfb-frame">`:
- **Front page** = page ID **22** (slug `our-story`, URL `/`) → iframe src
  `…/wp-content/uploads/YYYY/MM/webfilmbooks-home-vN.html`
- **/web-design/** = page ID **9653** → iframe src
  `…/wp-content/uploads/YYYY/MM/webfilmbooks-web-design-vN.html`

## Deploy method (WordPress REST API)
Auth: HTTP Basic, username `relentless` + a WordPress **Application Password**
(user provides it each session — never commit it here).

1. Upload the new HTML to the media library:
   `POST /wp-json/wp/v2/media` with headers
   `Content-Disposition: attachment; filename=<file>.html` and `Content-Type: text/html`,
   body = the file. Returns `source_url`.
2. Repoint the page's iframe: `GET /wp-json/wp/v2/pages/<id>?context=edit`, replace the old
   iframe `src` in `content.raw` with the new `source_url`, then
   `POST /wp-json/wp/v2/pages/<id>` with `{"content": <newraw>}`.
3. Verify on the live page (see rendering note below).

## Design mockup gallery
Premium mockups: `https://bruce-mockup-gallery-webfilmbooks.relentless-a-2737.chatgpt.site/mockups/{N}.jpg`
Available N: 201–214, 216–223, 225. The web-design page references these directly.
(Optional future task: mirror them onto WordPress so the page doesn't depend on that gallery.)

## Rendering / verifying pages (headless, since content is JS-rendered)
Playwright-core + the preinstalled Chromium at `/opt/pw-browsers`:
- `npm install playwright-core` in a scratch dir.
- Launch: `chromium.launch({ executablePath: <chrome>, headless:true,
  args:['--no-sandbox','--ignore-certificate-errors'], proxy:{server: process.env.HTTPS_PROXY} })`
  and `newContext({ ignoreHTTPSErrors:true })` (needed for the agent proxy CA).
- Content lives inside the iframe; find it with
  `page.frames().find(f => /webfilmbooks-(web-design|home)-v/.test(f.url()))`.

## Sales applicant intake (separate system, NOT in this repo)
- The **sales-orientation** site is on `chatgpt.site` (built/edited by ChatGPT, not here).
- Its apply form POSTs to `/api/applications` → Cloudflare D1. `409` = duplicate email
  (returns a friendly "already applied" message), `400` = validation, `201` = success.
- Applications mirror to the Google Sheet **"WEBFILMBOOKS Back-Office Live Mirror"**.
- Google Apps Script `notifyNewApplicants` (5-minute time trigger) emails each new
  applicant to `relentlessaaron2007@gmail.com`.
- Owner dashboard: `/secure-portal` (owner Google login). CSV: `/api/backoffice-export/applications`.

## Owner
- Site owner / notifications: `relentlessaaron2007@gmail.com`.
- Repo branch for changes: `claude/webfilmbooks-sales-intake-l4nz8b`.
