# Felixis Web Solutions: studio website

The studio's own site. One persistent WebGL voxel clover (the Felixis mark, built from its 33 pixel cells) travels every page and re-forms for each section; everything else on the site is made from the same cells. Design notes are in [DESIGN.md](DESIGN.md); the original plan and architecture review are in [docs/](docs/).

Astro 7 (static output) · GSAP 3.15 · Lenis · three.js r186 (lazy) · self-hosted Familjen Grotesk and Doto.

## Run it

```
npm install
npm run dev          # http://localhost:4410
npm run build        # dist/, then the script budget report and the placeholder report
npm run preview      # serves dist/ with brotli on http://127.0.0.1:4411 (use this for testing)
```

Node 24 or newer. `.npmrc` keeps the npm cache in `D:\webdev\.cache\npm`. Set `ASTRO_TELEMETRY_DISABLED=1` in your shell so Astro doesn't write config outside `D:\webdev`.

## Site facts

Every studio fact lives in `src/data/site.config.mjs`: domain (https://felixis.dev), registered name (Felixis), trading name (Felixis Web Solutions), email, phone, WhatsApp and Instagram. Location is optional and hidden while empty. `npm run build` fails if a required value still looks like a placeholder.

**The brief form** (`/start/`) sends through FormSubmit (formsubmit.co, as on the Thrafford site) to the studio email. After the first real submission from the live site, FormSubmit emails that inbox a one-time "Activate form" link: click it once. Optionally paste FormSubmit's alias into `formSubmitAlias`.

Run `npm run assets` if the brand files change (icons, favicon.ico and the OG card are generated from them).

## Deploy (Vercel)

Hosted on Vercel, connected to github.com/Darkrizz/felixis-website: every push to `main` deploys to production. `vercel.json` sets the build (`npm ci`, `npm run build`, output `dist`, Node 24 from `engines`), trailing-slash URLs and the security and cache headers. `404.html` is served automatically for unknown paths. Manual deploy from this folder: `npx vercel --prod`.

felixis.dev and www.felixis.dev are attached in the Vercel project (Settings, Domains); DNS stays at Name.com (A records for the apex, CNAME for www, as Vercel lists them), and www 308-redirects to felixis.dev. After the first deploy, submit https://felixis.dev/sitemap.xml in Google Search Console.

## Pages

| Route | What's on it |
|---|---|
| `/` | preloader, hero clover, statement, the four leaves (pinned, live demos), Range (six design languages), lab teaser, live performance readout, contact band, voxel wordmark footer |
| `/strategy/` `/design/` `/development/` `/growth/` | glyph hero, deliverables, deep demos, "leaf n of 4" clover, FAQ (with FAQPage JSON-LD) |
| `/lab/` + six `/lab/<slug>/` | voxel sandbox, clover sequencer, make-a-mark, type playground, cell shader (raw WebGL2), flow field |
| `/start/` | four-step brief builder |
| `/404` | catch the gold cell |

## Tests

All tools drive a headless Chrome with its own profile under `.cache/` (never your running Chrome) over the DevTools protocol. Start `npm run preview` first.

```
npm run test:unit                          # brand cells reproduce the trademark SVGs exactly
npm run test:e2e                           # page transitions, axe in 16 states, phone-width overflow
npm run test:lh                            # Lighthouse, mobile, median of 3 (home)
node tools/seo-audit.mjs                   # after a build: titles, descriptions, h1, canonical, JSON-LD, internal links
node tools/test/lighthouse.mjs /design/ 1  # any page
node tools/test/shots.mjs / tools/out/x 1440 900 hw "0,0.3,t:leaves:0.5" light   # review screenshots
node tools/test/keyboard.mjs               # tab order, focus rings, theme wipe, menu + Escape
node tools/test/range.mjs                  # every Range language
node tools/test/sandbox.mjs                # voxel sandbox gravity and paint
node tools/test/preloader.mjs              # first-visit sequence frame by frame
node tools/test/cls.mjs /                  # every layout shift with the elements that moved
node tools/test/device.mjs / iphone16       # DevTools-style device emulation + text-overlap scan (iphone16, iphonese, pixel8, ipadmini, ipadpro, nesthub...)
node tools/test/switch-device.mjs          # load at desktop size, switch to iPhone 16 without reloading (DevTools device mode)
node tools/test/form-theme.mjs             # dark-by-default on a light-mode system; brief builder against a stubbed FormSubmit
```

`?fx-test` on any URL skips the preloader and exposes `window.__fx` (scroll, triggers, engine stats) for the scripts. Screenshots and reports go to `tools/out/` (gitignored); curated review captures are copied to `D:\webdev\materials\felixis\screenshots`.

## Results at handover (24 Oct 2026)

Lighthouse, mobile settings, served by `tools/serve.mjs`:

| Page | Perf | A11y | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` (median of 3) | 98 | 100 | 100 | 100 | 1.9 s | 0 |
| `/design/` | 99 | 100 | 100 | 100 | 1.7 s | 0 |
| `/development/` | 98 | 100 | 100 | 100 | 2.0 s | 0 |
| `/lab/` | 99 | 100 | 100 | 100 | 1.5 s | 0 |
| `/lab/voxel-sandbox/` | 99 | 100 | 100 | 100 | 1.6 s | 0 |
| `/lab/cell-shader/` | 98 | 100 | 100 | 100 | 1.9 s | 0 |
| `/start/` | 99 | 100 | 100 | 100 | 1.7 s | 0 |

axe-core: no violations in 16 states (both themes, menu open, Inspect on, form errors, every service and lab page, 404). No horizontal overflow at 360 and 390 px on any route. `astro check`: 0 errors.

Not tested here: real iOS Safari and a low-end Android phone. Please check those by hand before launch.
