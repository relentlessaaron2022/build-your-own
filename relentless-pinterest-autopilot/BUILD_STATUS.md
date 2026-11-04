# BUILD_STATUS

Verified repair review: November 3, 2026.

## What is implemented

- Website discovery for relentlessaaron.net and webfilmbooks.com via WordPress,
  RSS, and sitemap fallback.
- Eligible discovered content now feeds source-linked pin concepts and the
  existing creative/QC/queue pipeline. Previously discovery only stored rows.
- Owner-supplied normalized social exports can be imported for Instagram,
  Facebook, YouTube, and TikTok. Only explicitly approved items generate pins.
  Threads is supported as well. Media is not downloaded or reposted directly.
- Authorized API readers are wired into discovery for Facebook Pages, Instagram
  professional accounts, Threads, and TikTok; YouTube uses its public channel feed.
  The requested accounts, including @mzpearlivy, are listed but disabled pending
  exact IDs and authorization. Their API responses are mocked in the tests.
- Product-offer generation, template creatives, duplicate checks, official
  Pinterest API publishing, analytics, optimization, and local reporting.
- Hard daily cap, paused/disabled campaign filtering, local publisher locking,
  minute-level retries, paginated duplicate reconciliation before retry writes,
  missing pin-ID handling, explicit timezone, immediate initial generation,
  scheduler heartbeat and last-job outcomes, and a read-only `pinterest doctor`.
- GitHub Actions test workflow and a macOS LaunchAgent installer, which performs
  local readiness checks before loading the service.

## Verification

The original 46 tests passed locally before edits. Regression tests were added
for operational failures and the website/social export-to-concept pipeline.
Final local result: 77 tests passed. An isolated scheduler startup also produced
a real heartbeat with generation and publishing disabled. GitHub Actions must
run separately after the commit is pushed. All network
publishing in the added tests is mocked: no live Pinterest pin was created.
The macOS installer cannot be exercised with launchctl in this Linux environment.

## Not established / still required

- This pull request has not been merged into main.
- No production worker is provisioned or confirmed running.
- No Pinterest credentials are configured in the repair environment. Live
  account connectivity, board mapping, pin-write permissions, a real published
  pin, token refresh, and real analytics must still be verified.
- Live social syncing still needs exact account IDs, approved API permissions,
  access tokens, and verification against the owner's accounts. Readers are built
  and scheduled but not connected. Social token renewal is operator-managed;
  bounded recent reads are not a full historical backfill. The export importer
  does not accept raw vendor archives.
- Source-linked export tests do not establish content quality or rights for
  arbitrary input. Review actual pin images and destinations before publishing.
- The active offer is now bamboo sheets, using the verified original public site.
  Prompt Mastery is inactive. Bedding board names require real Pinterest IDs;
  the Cloudflare destination remains pending. See PROMOTION-FOCUS.md.
- Daily content weighting, distributed worker support, and sales attribution
  are not added by this repair.

Read OPERATIONS.md for setup and the distinction between configured, alive,
publishing successfully, and earning revenue. Code and unit tests alone do not
prove that the live automation is healthy.
