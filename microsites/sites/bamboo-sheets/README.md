# Bamboo sheets: ten alternate sales pages

Built from the owner's existing Bamboo Solid 2000 Series site on November 3, 2026.

## Pages

| File | Intent | Order code |
| --- | --- | --- |
| `dist/value.html` | Explain the six-piece set and listed price | BS-VALUE |
| `dist/colors.html` | Help shoppers choose a room color | BS-COLOR |
| `dist/gifts.html` | Help gift buyers choose size, color, and delivery timing | BS-GIFT |
| `dist/queen.html` | Queen-size buying details | BS-QUEEN |
| `dist/king.html` | King-size buying details | BS-KING |
| `dist/guest-room.html` | Guest bedroom setup | BS-GUEST |
| `dist/first-home.html` | First-home bedroom refresh | BS-HOME |
| `dist/neutral-colors.html` | Neutral bedroom palettes | BS-NEUTRAL |
| `dist/bold-colors.html` | Stronger bedroom colors | BS-BOLD |
| `dist/everyday-refresh.html` | Everyday refresh with new model image | BS-REFRESH |
| `dist/index.html` | Browse all three approaches | — |

This is one portable static project. No subscriptions, paid APIs, or build dependencies are required. The original site is unchanged. The Sites preview is a separate private publication, not a deployment into the owner's GitHub or Cloudflare account.

## View and edit

Run `python -m http.server 4173 --directory dist`, then open http://localhost:4173. Edit `build.py` for page copy and structure, then run `python build.py`. Shared styles and behavior are in `dist/assets/`. Generated HTML is tracked so Cloudflare can publish it without a build step.

## GitHub and Cloudflare Pages

1. Create an empty repository in the owner's GitHub account. Do not put credentials in source files.
2. Add that repository as a remote and push this project. Use GitHub Desktop if preferred.
3. In the owner's Cloudflare dashboard, create a Pages project connected to that repository.
4. Select no framework, leave the build command empty, and set output directory to `dist`.
5. Confirm prices, inventory, product fiber label, permitted image use, and ordering details before promotion. The existing asset provenance is not independent licensing verification.
6. Assign a domain if desired. Domain registration is separate from hosting costs.

The original Sites identity and Git metadata are excluded from this library copy. Cloudflare Pages deploys the files in dist directly.

## Indexing and traffic

Every page currently uses `noindex,follow`. These are campaign variants for review and traffic experiments, not three duplicate search destinations. Before search launch, choose one primary product page, supply its actual public canonical URL, remove noindex there, and add a sitemap for the selected public domain. Keep campaign variants noindex unless they develop distinct useful search content.

Use separate campaign links, for example `/colors.html?utm_source=pinterest&utm_medium=organic&utm_campaign=bamboo_color&utm_content=teal_room`. Keep budgets and traffic sources comparable when comparing variants. No automated random assignment is implemented. No ads or social posts have been published.

## Measurement

The JavaScript emits `landing_view`, `product_selection`, and `call_click` as `bamboo:analytics` browser CustomEvents and dataLayer events. It includes the page variant, bounded campaign parameters, and selected size/color where relevant. **No remote analytics collector is connected. These events do not create a historical dashboard and do not measure completed sales.**

The config file is reserved for a future integration; entering an analytics ID alone does not load analytics. Connect a collector, update the privacy notice and implement any required consent before activation. Cloudflare Web Analytics can provide basic page traffic when enabled in the owner's account, but custom call events require a supported event collector.

For phone sales, ask callers which order code they saw and log actual paid orders against that code. Do not count a phone-button click as a sale. `weekly-scoreboard.csv` is a blank reporting template; populate it from verified analytics and paid order records each Friday. Use no customer personal data in this public repository.

## Remaining commercial facts

- Source lists sheets at $20 per set, Queen pillows at $40 per set, and King pillows at $50 per set. Current prices need confirmation.
- Original ordering number: 404-314-2100. No online checkout is configured.
- Confirm exact fiber composition, pocket depth, pillow quantities, and stock. “2000 Series” is a name, not a verified thread count.
- Confirm shipping, collection, payment methods, delivery timing, and returns. No promises were invented.
- White and Black lacked exact color images in the original. Their selector states explicitly show a labeled Teal example.
- The Relentless Microsite Plan was not found in the connected Drive search. Reconcile this build against that document when available.

## Verification

JavaScript syntax, all internal links/assets, desktop and mobile overflow, all ten pages' size/color controls, unavailable color previews, call attribution events, and blocked session storage behavior were checked. No payment processing or completed-sales measurement is implemented.
