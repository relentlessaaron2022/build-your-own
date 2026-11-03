# Relentless microsite library

Website source and deployment records for Relentless Aaron's revenue sites.

Each site has an independent folder under `sites/`. Cloudflare Pages can connect
to this GitHub repository and deploy each folder as a separate Pages project.
Ten alternate landing pages for one product can remain in one project.

## First site

| Site | Folder | Pages ready | Cloudflare state |
| --- | --- | --- | --- |
| Bamboo sheets | `sites/bamboo-sheets` | Value, colors, gifting | Not connected |

The existing Sites preview is separate from the GitHub source library. There
are three completed sales pages, not ten. Phone ordering is preserved; Beacons
checkout is deferred. The additional generated teal-bedroom model image is
included as `dist/assets/editorial-model-teal.webp`, but is not selected by the
existing pages. No analytics collector is connected.

## Publish a site through Cloudflare Pages

1. Sign into the owner's Cloudflare account and choose Workers & Pages ->
   Create application -> Pages -> Connect to Git (labels may vary).
2. Authorize access to `relentlessaaron2022/build-your-own`.
3. Create a Pages project called `relentless-bamboo-sheets` (or another available
   project name). Select the branch containing the approved site source.
4. Set the root directory to `microsites/sites/bamboo-sheets`.
5. Select no framework, leave the build command empty, and set output directory
   to `dist`. The HTML is already generated and tracked.
6. Deploy and verify all three pages and the call-to-order buttons. The actual
   Cloudflare URL is recorded in `registry.json` only after deployment succeeds.
7. Optionally add a separately purchased custom domain. No domain is required
   to begin using the provider's Pages URL.

If working from a review branch, merge approved source into `main` before making
`main` the production branch. Cloudflare access, deployment, domain, analytics,
and search indexing are not configured merely by adding files to GitHub.

## Add another microsite

1. Copy `templates/static-site` into `sites/<unique-slug>`.
2. Replace its content, images, title, description, and ordering destinations.
3. Add its entry to `registry.json` with the actual offer and deployment state.
4. Run `python microsites/scripts/check_sites.py` from the repository root.
5. Create a separate Cloudflare Pages project pointing at the new site folder.

This layout requires no application server, package manager, paid API, or
GitHub Pages deployment. GitHub stores the code; Cloudflare handles public
commercial-site hosting. Provider plan limits and domain costs remain separate.

## Search and measurement

The bamboo pages are campaign variants and retain `noindex,follow` while under
review. Before search promotion, choose a primary public product page, add its
real canonical URL, remove noindex on that page, and create a sitemap for the
actual host. Do not assume ten copies will independently attract search traffic.

Use campaign parameters and actual paid-order records to compare variants.
`weekly-scoreboard.csv` in each site is a reporting template, not measured
earnings. Keep customer information and private financial records outside this
public repository. Update the source and register verified results each Friday.
