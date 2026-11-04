# Run and verify Pinterest Autopilot

This is a Python background worker with a persistent database. GitHub stores the
code and runs tests; GitHub Pages and Cloudflare Pages do not run this continuous
Python scheduler. No production worker has been provisioned by this repair.

## Local setup (macOS or Linux)

From this project directory, create a virtual environment, activate it, install
`pip install -e . -r requirements-dev.txt`, copy `.env.example` to `.env`, and run
`pinterest init-db`. For a service, keep this checkout and its data directory on
a persistent disk. Never commit `.env`, access tokens, databases, or logs.

Populate Pinterest credentials locally using the developer app authorization
flow. A standalone access token can prove connectivity, but it cannot refresh
itself. Continuous operation needs the client ID, secret, and refresh token.
Having a token does not establish that it has permission to publish.

1. `pinterest status` checks account connectivity without creating pins.
2. `pinterest sync-boards` maps configured board names to existing live boards.
   `--create-missing` creates boards; use it only if you intend that write.
3. `pinterest discover` reads configured websites, including relentlessaaron.net.
4. `pinterest generate` generates eligible source-post pins and product-offer pins.
5. Review the destination URLs and generated images in `pinterest queue` and
   `assets/generated/`. Only use content and images you may republish.
6. `pinterest doctor` reports missing credentials, unsynced boards, and bad settings.
7. After choosing a reviewed concept, `pinterest publish-test --concept-id ID`
   actually publishes one pin. Confirm its returned Pinterest ID and inspect it
   on Pinterest. This is a real external write, not a dry run.
8. Start `pinterest run` for continuous operation after verifying the pin.

The full OAuth connection and real publishing test have not been performed in
this repair environment, which has no configured Pinterest credentials.

## Social media and website content

`config/sites.json` configures WordPress -> RSS -> sitemap discovery. The site's
`board_category` maps eligible posts to appropriate Pinterest boards. A post must
meet the existing suitability threshold before source-linked generation uses it.
The original post title/excerpt and URL are carried into its concept. Each source
produces at most one initial concept, so rediscovery does not copy it repeatedly.

Social readers are implemented for Facebook Pages, Instagram professional accounts
using Facebook Login, YouTube public channel feeds, Threads, and TikTok Display
API. They are wired into the six-hour discovery job. They are tested with mocked
responses here; no live social authorization has been supplied or verified.

`config/social_accounts.json` contains disconnected entries for the requested
Relentless Aaron sources (Facebook, five Instagram slots, YouTube, Threads,
TikTok) and the confirmed profile https://www.instagram.com/mzpearlivy/.
Confirm whether that profile is one of the five before enabling duplicate slots.
A display name or profile URL alone is not an API account connection.

For each source, set the exact stable `account_id` (YouTube: channel ID; TikTok:
token owner's open_id), put its access token into the named `token_env` environment
variable or local .env, and only then set `enabled` to true. For Facebook and
Instagram, set `META_GRAPH_VERSION` to the version enabled for your Meta app.
Tokens belong in .env or a secret manager, never the JSON or repository. Meta
Pages/Instagram, Threads, and TikTok require the appropriate approved application
permissions; Facebook personal-profile posts are not supported by this reader.
YouTube's public feed needs no token and returns only its recent feed entries.

Run `pinterest sync-social` to test enabled connections. One account failure is
reported without stopping the others. Graph/TikTok readers fetch at most five
pages per cycle and upsert by original post URL; this is a bounded recent-content
sync, not a complete archive backfill. TikTok checks that the token's owner
matches the configured ID. No social media is downloaded or reposted directly.
Captions/titles are used to generate pin graphics; social pins link to the original
social post. Automatic copying does not establish media rights.

`auto_approve` defaults to false, so synced items enter discovery for review.
Enable it per account only after reviewing the source, board mapping, and sample
pin output if you want unattended source-to-pin generation. Tokens for social
readers are supplied by the operator and are not automatically renewed in this
repair; expiry appears as a sync error. Update tokens locally and restart the
worker. Pinterest's existing OAuth refresh is separate.

You can also import a normalized JSON export of your own posts without connecting
an API. This is not a parser for raw vendor archive formats:

```json
[
  {
    "platform": "instagram",
    "url": "https://www.instagram.com/p/YOUR_POST_ID/",
    "title": "Your original post title",
    "text": "Your original caption or excerpt",
    "published_at": "2026-11-03T12:00:00Z",
    "approved": true
  }
]
```

Run `pinterest import-social /path/to/posts.json --site-id relentlessaaron`.
Supported labels are instagram, facebook, youtube, threads, and tiktok; URLs
must match the platform. An absent/false `approved` keeps an item out of generation.
Reimporting updates a post instead of inserting another copy. Media is not fetched.

## Keep the worker running on a Mac

With the virtual environment active and `pinterest doctor` passing, run:

```bash
python scripts/install_macos_service.py
pinterest doctor --require-running
```

The installer writes a user LaunchAgent and loads it with launchctl. It does not
copy secrets into the plist. It restarts a stopped worker while that user is
logged in. It does not keep a sleeping or shut-down Mac running. This installer
has been syntax-checked here; launchctl itself requires macOS and was not tested
in the Linux review environment.

To stop the service on your Mac:

```bash
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.relentless.pinterest-autopilot.plist"
```

Remove that plist only if you also want to remove its login startup configuration.
For an always-on Linux host, use its service manager to supervise `pinterest run`
with the project directory as its working directory. Host provisioning and cost
are separate decisions; no paid hosting was created.

## Know whether it is healthy

`pinterest doctor --require-running` exits nonzero if local setup is blocked or
the scheduler heartbeat is more than two minutes old. It also shows the last
job outcomes, in-flight pin count, failed pin count, and active offers. A heartbeat
only proves that the scheduler is alive; an entry such as missing_credentials or
an API error means publishing still needs attention. Inspect `logs/autopilot.log`
and `pinterest status` for the actual account response. Account read access is
not evidence of pin-write authorization.

The default publish times are 8/11/14/17/20 in America/New_York. Set
`SCHEDULER_TIMEZONE` explicitly for another IANA timezone. Due retries are checked
every minute, remain subject to the daily cap, and reconcile the destination link
against all board pages before issuing another create request. A failed board
lookup prevents that retry's create request. Daily accounting includes in-flight
claims; zero is a valid disabled publishing target. The doctor reports zero as
not ready to publish.

All local publishing commands share a file lock. Run one scheduler on one host
with one shared AUTOPILOT_HOME. This is not a distributed account lock. After a
crash, inspect any `publishing` rows against Pinterest before requeueing: an
ambiguous remote write is not automatically assumed to have failed. A failed
manual publish-test also needs inspection before manual requeueing.

The weekly report is generated Friday at 5:30 p.m. in the configured timezone;
it is saved locally, not emailed. Verify the first real analytics response against
Pinterest before trusting optimization. No purchase/revenue integration is added
by this repair, so conversions and revenue must not be presented as measured sales.

## Bamboo sheets

The active product offer is Bamboo Solid 2000 Series; Prompt Mastery Studio is inactive. The original public bamboo site is the interim destination. See PROMOTION-FOCUS.md. Do not use the private
Bamboo preview as a Pinterest destination. After the Cloudflare site is public,
add its URL as an offer with a bedding brand and bedding board mapping, review
the generated copy/images, and then activate it. Neither ten public sheet pages
nor a live Pinterest campaign was deployed by this automation repair.
