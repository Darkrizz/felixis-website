# Felixis Web Solutions: studio website plan

## Context
Felixis Web Solutions, a web design studio, needs its own site. The brief asks for it to show off as hard as
possible: 3D modelling, kinetic type, many typefaces and design schemas, behaviours and effects. All of it has
to feel like one harmonious million-dollar build, not a pile of animations. The site has to complement the brand
files in `D:\webdev\felixis trademarks\`. The user ruled out any reference to prior client work, so the site
itself is the portfolio: every claim of skill is a live, working demo on the page. Scope is unlimited
("show off as hard as you can").

User decisions so far:
- Services (the clover's four leaves): **Strategy, Design (gold leaf, flagship), Development, Growth**.
- Contact facts: clearly marked placeholders in one config file. Nothing invented.
- Skills: user is installing GSAP skills, Impeccable, Emil Kowalski design-eng and three.js skills. Load each
  during the build step it covers, alongside `frontend-design`, the on-disk taste-skill guidance and
  `anti-ai-slop-writing` for all copy.

## Brand facts (read from the SVGs)
- Mark: pixel clover on a 7x7 cell matrix (64-unit viewBox, 6-unit cells starting at 11). Four 3x3 leaves,
  each missing its outer-corner cell (8 cells per leaf), a cross-shaped gap, one centre cell: 33 cells.
- Top-right leaf gold, the rest green. Centre cell paper on dark, forest on light. Latin *felix* = lucky.
- Colours: forest `#13201A`, leaf `#4CB27A` (on dark), deep leaf `#1F6B45` (on light), gold `#E8B422`, paper `#EEF1EA`.
- Wordmark: Familjen Grotesk Bold.

## Concept: one cell, many forms
Every effect on the site is made of the logo's material: square cells on a 6-unit lattice. One persistent
WebGL voxel clover (the mark's 33 cells subdivided and extruded into cubes) travels the whole site, across
page changes too, and re-forms for each section: clover, lattice, the four service glyphs, a flat clover that
fills in as a progress meter, the word "Felixis". Transitions, reveals, progress, loaders, the theme switch and
the 404 game are all behaviours of the same cells. The variety comes from one material, one palette, one
motion grammar and one clock, so it reads as one system.

The brand idea in a line: *the luck is engineered.* What looks like a lucky result comes from process, and the
clover only completes when all four leaves (Strategy, Design, Development, Growth) are done.

## Design system

### Colour (dark is the default theme; light theme via toggle)
| Token | Dark | Light | Role |
|---|---|---|---|
| `--ground` | `#13201A` forest | `#EEF1EA` paper | page ground |
| `--surface` | `#1A2B22` | `#E3E8DF` | panels, inputs |
| `--ink` | `#EEF1EA` | `#13201A` | text |
| `--ink-2` | ~`#A3B5A9` (check ≥4.5:1) | ~`#4A5C51` | secondary text |
| `--leaf` | `#4CB27A` | `#1F6B45` | brand green: lines, active states, voxels |
| `--gold` | `#E8B422` | `#E8B422` | the "lucky" element only |
| `--line` | paper @ 12% | forest @ 14% | hairlines |

Gold rule: gold marks the one lucky or active thing in view (the Start-a-project button, the Design leaf, the
active choice). Never decorative, never on body text, and gold surfaces always carry forest text (≈10:1).

### Type
- **Familjen Grotesk Variable** (400–700), the brand's own face, is the site's voice: headings, body, UI. It is set
  tight at display sizes (-0.03em), and its weight axis is animated in the hero, where weight follows the pointer.
- **Doto Variable** (dot-matrix, weight + roundness axes) is the pixel voice for live readouts, counters, Inspect
  labels and the terminal schema. It is only used at ≥16px and never for small caps labels.
- **Specimen faces**, loaded only where they're shown and subset to the exact demo text: one face per design
  language in the Range stage (e.g. Archivo for Swiss, Newsreader for editorial, Space Mono for brutalist, Mona
  Sans for glass, Doto for terminal, a rounded display face for soft 3D), plus Anybody (width 50–150) for the
  type playground. Range is shown as content in a specimen, not scattered across the page.
- Scale: 18px body / 1.6 leading; major-third steps; measure ≤ 68ch.

### Shape language: the notched square
Each leaf is a square with one corner cell cut out. That notch is the site's only corner treatment: buttons,
panels, images, inputs and focus rings use `clip-path` notches (6/12/24px). The notch sits at the corner that
points outward, so four panels in a 2x2 arrangement form a clover. There are no rounded corners anywhere except
inside the "soft 3D" specimen.

### Space and layout
- Spacing comes only from multiples of 6px (6, 12, 18, 24, 36, 48, 72, 96, 144).
- Content max-width is 1440px with a 12-column grid, 24px gutters and margins of `clamp(18px, 4vw, 72px)`.
- Text is left-aligned throughout. No centred heroes.

### Motion grammar
- Three eases: **glide** `cubic-bezier(.16,1,.3,1)` for anything that travels, **swing** `(.65,0,.35,1)` for
  morphs, and **step** `steps(6)` for pixel moments (fills, reveals, wipes).
- The beat is 0.6s. Durations are 0.12/0.24/0.36/0.6/1.2s; staggers are 0.03–0.06s.
- One clock: `gsap.ticker` drives Lenis, ScrollTrigger, pointer springs, the WebGL render and Inspect overlays.
  Pointer position and scroll velocity are shared signals, so the voxels, hero type and wordmark respond in sync.
- Automatic motion is limited to the load sequence, the voxel morphs (scroll-scrubbed, so they're under the
  user's control) and the idle "breath" of the clover. Everything else answers an action. No generic fade-up on
  every section.
- `prefers-reduced-motion` gives a complete static site: SVG clover, no Lenis, no pins, no auto-cycling, and
  instant theme and page swaps.

## Site map
`/` home · `/strategy/` · `/design/` · `/development/` · `/growth/` · `/lab/` + `/lab/<experiment>/` ·
`/start/` (brief builder) · `/404`. Astro ClientRouter page transitions, with the nav and the WebGL canvas
persisted across navigations.

### Global chrome
- **Floating nav**: the clover mark doubles as a scroll-progress meter that fills leaf by leaf. Links: Strategy,
  Design, Development, Growth (dropdown or inline), Lab, plus a gold "Start a project" button (the only label for
  the contact intent, used site-wide). A controls cluster holds Inspect, sound and theme toggles.
- **Page and theme transitions**: one cell-cover component. A grid of cells fills in a radial stagger from the
  click point (forest, with a few gold cells), then the page or theme swaps and the cells clear. Theme switching
  and page changes share it.
- **Inspect mode** (`I` key or nav toggle; desktop): overlays the 12-column grid and 6px lattice and outlines
  `[data-inspect]` components with labels for font family/size/weight, colour token, padding, and ease/duration
  for animated parts. Hover shows redline distances to the parent, and the WebGL scene goes wireframe with live
  renderer stats.
- **Sound** (off by default, synthesised with WebAudio, no files): pentatonic ticks pitched by cell position, a
  soft chirp on primary buttons, and a four-note arpeggio when a clover completes.
- **Menu overlay** (mobile): opens with the cell-cover, links reveal in a stepped stagger, focus is trapped.
- **Footer**: the voxels form the word "Felixis" and the pointer scatters them. Links and placeholder contact
  details sit beneath.

### Home (`/`)
1. **Preloader** (first visit per session, under 1.2s, no fake progress): 33 cells drop into the 7x7 matrix, the
   gold leaf arrives last, and the centre cell blinks twice like a caret. It then hands off to the WebGL clover
   at the same position.
2. **Hero**: a left-aligned headline (2 lines max), one line of subtext, "Start a project" plus a secondary link,
   and the 3D voxel clover on the right. The pointer repels voxels (spring return) and thickens nearby headline
   letters.
3. **Statement**: a short scroll-scrubbed text about the name (felix = lucky; we don't leave it to luck). The
   voxels flatten into a lattice behind it.
4. **The four leaves** (services as a sequence, pinned on desktop): four notched panels in a 2x2 clover. Scrolling
   expands each in turn (GSAP Flip) to a live demo, while the voxel clover beside them fills that leaf's 8 cells
   one at a time. Design is the gold leaf. When Growth completes, the centre cell lights and the arpeggio plays.
   Demos: Strategy = an interactive sitemap that branches as you click; Design = a palette generator with live
   contrast checks; Development = a container-query layout you resize with a drag handle; Growth = a live
   search-snippet preview that truncates at Google's pixel widths. Each panel links to its service page. On
   mobile the panels stack with inline demos.
5. **Range**: one stage renders the same Felixis poster in six design languages (Swiss, editorial, brutalist,
   glass, terminal, soft 3D) using Flip, font swaps and a stepped cell-dissolve. It auto-cycles only while idle in
   view and pauses on any interaction.
6. **Lab teaser**: an index of experiments with live thumbnails (each a paused miniature that runs on hover or
   focus), linking to `/lab/`.
7. **Proof, "this page, measured on your device"**: live readouts from real browser APIs (LCP and CLS through
   PerformanceObserver, transfer size and request count through Resource Timing, live FPS, voxel count, draw
   calls), set in Doto, plus the invitation to turn on Inspect mode. No invented numbers anywhere.
8. **Contact band**: a short "Start a project" prompt into `/start/`.

### Service pages (`/strategy/`, `/design/`, `/development/`, `/growth/`)
Each has its own voxel formation in the hero (a glyph for that leaf), what the service includes and what you get,
how it fits the four-leaf sequence, and one deep demo:
- **Strategy**: a sitemap/IA builder (add, drag and connect pages, auto-layout with spring physics) and a
  positioning map you drag your brand across.
- **Design**: the full Range engine plus a variable-font playground and a colour-system generator with WCAG checks.
- **Development**: a spring-physics editor where sliders rewrite a live code snippet and the motion together,
  container-query layouts, and this page's own performance readout.
- **Growth**: a search-snippet editor with pixel-width truncation, a Core Web Vitals readout, and an animated
  funnel driven by inputs.

### Lab (`/lab/`)
A grid of full-screen experiments, each a real piece of work:
- **Voxel sandbox**: the 3D clover with gravity, explode/rebuild and painting cells.
- **Clover sequencer**: the 33 cells as a WebAudio step sequencer (the mark as an instrument).
- **Make a mark**: draw your own pixel mark on a 7x7 grid and export the SVG.
- **Type playground**: variable axes on Familjen, Doto and Anybody, driven by pointer and scroll velocity.
- **Cell shader**: text and gradients dissolved into cells by a fragment shader, pointer-painted.
- **Flow field**: thousands of cells drifting on a curl-noise field in the brand colours.

### `/start/`: brief builder
A multi-step form where the clover fills one leaf per step:
1. What are we making (chips).
2. Timeline.
3. About you.
4. Details.

It POSTs to a configurable endpoint with a `mailto:` fallback. Validation is inline. On success the clover
completes in gold and the arpeggio plays.

### `/404`
The gold leaf has wandered off: a small game on the 7x7 grid to herd it back, plus a link home.

## Content and copy
- All copy is written with `anti-ai-slop-writing` (no em dashes, no filler verbs, no invented stats or clients).
  Copy is short, concrete and in sentence case, and uses one label per intent.
- Placeholders live in `src/data/site.ts` (email, phone, city, socials, domain, form endpoint). Each is marked
  `TODO`, and the build prints a warning listing any that are unfilled.

Draft copy (it gets a second pass in the build):
- Hero: **"Luck has nothing to do with it."** Subtext: "We design and build websites, brands and web apps.
  Everything on this page runs live in your browser, so go ahead and poke at it."
- Statement: "Felix is Latin for lucky. Our clover has four leaves and we treat each one as work: strategy,
  design, development and growth. Get all four right and people will call the result lucky."
- Leaves:
  - Strategy: "Who the site is for, what it has to do, and which pages it needs to do it."
  - Design: "Type, colour, layout and motion drawn for your brand and nobody else's."
  - Development: "Hand-built, quick on a cheap phone, and still readable with JavaScript off."
  - Growth: "Search, speed and analytics after launch, so the site keeps paying for itself."
- Range: "One name, six design languages." Proof: "This page, measured on your device." 404: "The gold leaf
  wandered off."

## Architecture

### Stack (versions checked on npm today)
- astro 7.4.2: static output, no UI framework, ClientRouter for page transitions.
- gsap 3.15.0: ScrollTrigger, SplitText (`SplitText.create`), Flip, CustomEase, Observer. All are free.
- lenis 1.3.27.
- three 0.186.1: WebGL2 only, imported only inside the lazy voxel chunk.
- Fonts: @fontsource-variable/familjen-grotesk and /doto through Astro's Fonts API, self-hosted with
  metric-matched fallbacks. Range and playground faces are subset at build time with `subset-font`.
- Dev only: lighthouse, axe-core, subset-font.

The project lives at `D:\webdev\projects\felixis`:
- It has its own `git init`.
- A `.npmrc` keeps the npm cache in `D:\webdev\.cache\npm`.
- `ASTRO_TELEMETRY_DISABLED=1` is set.
- All temp output and Chrome profiles go under `projects/felixis/.cache` and `tools/out` (gitignored).
- At M0, this plan and the architecture review get copied into `projects/felixis/docs/`, as CLAUDE.md
  requires, and a line for the project is added to the root `README.md`.

### Module layout
```
src/data/       brand.ts (33 cells: col,row,leaf,seq; CELL=6, ORIGIN=11; theme colours). This is the single
                source for the SVG, voxels, preloader, progress order and tests.
                motion.ts (eases and durations, emitted as CSS vars, GSAP eases and Inspect labels)
                copy.ts, site.ts (TODO placeholders), range.ts (6 languages + subset text), lab.ts
src/layouts/    Base.astro (head, JSON-LD, <Font>, inline theme/boot script, skip link, persisted
                <canvas id="fx-gl" aria-hidden>, persisted Nav, cell-cover, a single main.ts script)
src/components/ brand/Clover.astro (variants mark|matrix|progress|flat; also every no-WebGL fallback)
                chrome/ (Nav, MenuDialog, Toggles, CellCover), ui/ (Button, Chip, Notched),
                sections/ (Hero, Statement, Leaves + leaves/*, Range, LabIndex, Proof, ContactBand, Footer),
                service/ (ServiceHero, Includes, demos/*), lab/ (one component per experiment), start/ (steps)
src/pages/      index, strategy, design, development, growth, lab/index, lab/[slug], start, 404
src/styles/     tokens, reset, base, grid, shape (notch system on ::before/::after), motion, range
src/scripts/    main.ts (boot)
                core/ ticker, scroll (Lenis+ScrollTrigger+refresh order), prefs, signals (pointer,
                      velocity), viewport, schedule (idle/yield), router (ClientRouter lifecycle), debug (__fx)
                skeleton/ per-page trigger builders, created in DOM order
                effects/ registry (data-fx → lazy module), magnetic, weight-field, kinetic, pixel-mask,
                         theme, sound, nav-progress
                sections/, service/, lab/, start/   lazy behaviour modules
                voxel/  LAZY: engine, material, shaders/*.glsl, anchors, choreography, springs,
                        quality, formations/ (clover3d, flatClover, lattice, glyphs×4, wordmark, dust)
                inspect/ LAZY: overlay, describe
tests/unit/     brand (rebuilt paths match the trademark SVGs), formations (N per tier, deterministic), hilbert
tools/          subset-fonts, gen-assets (OG, icons via CDP screenshot), serve (brotli static server),
                check-budgets, cdp/ (chrome launcher + client over Node 24 WebSocket), test/ suites
```

### Voxel engine (the centrepiece)
- **Geometry**: one `InstancedBufferGeometry` box drawn in a single call. Instance count N = 33×k² so every
  formation uses all instances:
  - desktop 1188
  - mobile 528
  - low tier 297; software renderers go to the SVG fallback
- **Formations** are precomputed per-instance buffers uploaded once at startup. A morph only swaps attribute
  pointers. Each formation is Hilbert-sorted, so instance i sits near instance i in every other formation and
  morphs stay coherent; stagger order is a separate per-formation value (gold leaf last, wordmark
  left to right).
  - clover3D
  - flatClover (with per-cell `seq`)
  - lattice
  - four service glyphs: Strategy = branching sitemap tree, Design = the 7x7 grid opening into a swatch fan,
    Development = stacked layers, Growth = rising columns
  - wordmark: "Felixis", sampled from canvas text only after the font has loaded
  - dust
- **Vertex shader**:
  - smootherstep morph with per-instance stagger
  - mid-flight arc, lift and spin, square at both ends
  - explode along per-instance seed directions
  - scroll-velocity stretch, from the shared signal
  - CPU spring offsets for pointer repulsion
- **Fragment shader**:
  - fake bevel and edge line in cube space, wrapped-Lambert key light plus hemisphere ambient, gold-tinted rim
    and baked AO
  - `uFlat=1` outputs the exact brand hex, used for the pixel-perfect preloader handoff
  - `uWire` gives the Inspect wireframe, `uClip` clips to a notched rect, `uLit` lights the process cells
  - no post-processing
- **Anchors**: a perspective camera at the distance where 1 world unit = 1 CSS px on z=0. Each formation is
  fitted to a DOM anchor (`[data-voxel-anchor]`) every frame, so voxel cells line up with SVG cells at every
  breakpoint.
- **Rendering**: render on demand only, scissored to the formation's bounds; the canvas is hidden when no
  voxels are on screen.
  - DPR cap: 2 desktop, 1.5 touch, 1 low tier.
  - An FPS governor lowers DPR and never changes N.
  - `compileAsync` runs before the handoff.
  - Context loss falls back to the SVG.
- **Context ownership**: main.ts creates the WebGL2 context itself. If that fails, three is never downloaded.

### One clock
`gsap.ticker` runs every frame in this order:
1. Read input.
2. `lenis.raf`, then `ScrollTrigger.update`.
3. Pointer spring sim.
4. Read anchor rects (at most two).
5. Write uniforms and per-element DOM values (`quickSetter`).
6. Render.
7. Inspect overlay.

No window scroll listeners, `lagSmoothing(0)`, and `ScrollTrigger.config({ignoreMobileResize:true})`.

### Home choreography (desktop; mobile drops pins for sticky anchors, reduced motion goes static)
| Segment | Voxels | Pin |
|---|---|---|
| Hero | clover3D @hero, springs, idle breath; click to explode and rebuild | – |
| → Statement | morph to lattice behind text; text scrubbed, DOM skew from velocity | pin +100% |
| → Leaves | morph to flatClover @leaves-clover | – |
| Leaves | Pin +500% (overview + 4 steps). Panels Flip-expand *stepped* (hysteresis bands, never scrubbed) to the active service demo. Within each step `uLit` scrubs that leaf's 8 cells; Design lights gold; at the end the centre cell lights and the arpeggio plays. | yes |
| → Range | morph to dust and fade; canvas parked while the stage is in view | – |
| → Lab teaser / Proof | clover3D small @proof (wireframe when Inspect is on) | – |
| → Footer | morph to the wordmark; pointer scatters it | – |

Rules that keep this robust:
- Lenis is created before any trigger.
- The pin skeleton is built eagerly in DOM order, with `sort()` as a safety net.
- `refresh` → `lenis.resize()` → recompute anchors.
- `document.fonts.ready` → refresh.
- Lazy content never changes section heights (fixed aspect ratios).
- No transforms on pin ancestors and no ScrollTrigger snap.
- Navigation goes through `scrollToSection()`, which uses `lenis.scrollTo` and then moves focus.

### Multi-page and transitions
ClientRouter, with `transition:persist` on the canvas and nav.
- `astro:before-preparation`: the cell-cover fills from the click point.
- `astro:before-swap`: revert the page's `gsap.context` and kill its triggers.
- `astro:page-load`: rebuild that page's skeleton, then the engine morphs, time-based, from its current
  formation to the new page's hero formation.
- Lenis resets scroll; history restoration is tested.
- If anything throws, navigation falls back to a full page load.
- Service pages each open with their glyph formation, Lab pages with the formation their experiment uses, and
  `/start/` with the flatClover, which fills one leaf per step.

### Range engine
- One poster DOM, six CSS scopes (`.poster[data-lang]`), Flip on language change, and a stepped cell-dissolve
  mask (a generated SVG sprite, `steps()`).
- Fonts load before each switch and the next one is prefetched.
- It is a tablist with arrow keys, has a play/pause button, auto-cycles only when idle, visible and with motion
  allowed, and stops for good after input.

### Inspect mode
Lazy chunk, loaded on toggle or hover prefetch, `I` key, desktop only. It shows:
- the 12-column grid and 6px lattice
- `[data-inspect]` outlines labelled from `getComputedStyle` (family, size, weight, token, padding)
- the active tweens and animations for the element, from GSAP and `el.getAnimations()`
- hover redlines to the parent
- LCP element highlight
- voxel wireframe with `renderer.info`

### Performance budget (checked by `check-budgets.mjs`)
| Chunk | Budget (gzip) | When it loads |
|---|---|---|
| HTML (CSS inlined) | ≤30 kB | critical |
| main.js (gsap core, ScrollTrigger, SplitText, CustomEase, Lenis, core) | ≤85 kB | critical |
| Familjen Grotesk | ~19 kB | preloaded |
| voxel.js (three tree-shaken + engine) | ≤170 kB | after `load` and idle |
| sections.js | ≤35 kB | idle |
| inspect.js | ≤15 kB | on demand |
| each range font | ≤8 kB | on demand |

- LCP is the hero h1, visible in the first frame: the preloader is a fixed overlay and never hides the
  text with opacity.
- Engine init is chunked with `scheduler.yield()`.
- CLS is 0 by design. Weight-field glyphs get fixed advances, and demos with live layout sit in
  `[data-cls-sandbox]`. The Proof readout reports CLS both overall and minus the sandbox, which is honest.
- **Gate at M1**: Lighthouse mobile performance ≥90. If three blows the budget, swap in a raw WebGL2 renderer
  behind the same `VoxelEngine` API.

### Accessibility and fallbacks
- **Structure and colour**: semantic landmarks, one h1 per page, `aria-hidden` canvas and decorative SVGs.
  Every canvas interaction also has a real DOM control. Contrast pairs are verified: green `#4CB27A` and gold
  are never used as text or UI on paper.
- **Notches and focus**: the notch clip-path lives on pseudo-elements, so focus rings, hit areas and
  forced-colours outlines survive. Targets are at least 24px.
- **Keyboard**:
  - Leaves: panel headers are buttons that drive scroll; inactive demos are `inert`.
  - Range is a tablist.
  - The menu is a `<dialog>`.
  - The `I` key is ignored inside inputs.
  - SplitText uses `aria:'auto'` on headings only, and elsewhere `aria:'hidden'` plus an sr-only copy.
- **Reduced motion or the nav motion switch**: no Lenis, pins, voxels or auto-cycling, and instant swaps.
  `gsap.matchMedia` reverts everything live if the preference changes mid-visit.
- **No WebGL or Save-Data**: SVG and CSS stand-ins everywhere.

## Build milestones
- **M0 Scaffold.** Repo, config, tokens, fonts, `brand.ts` + `Clover.astro`, Base layout, 404 shell,
  `serve.mjs`, budgets, CDP launcher and smoke test, one Lighthouse baseline. Copy the plan into `docs/`.
- **M1 Vertical slice (gate).**
  - nav with the progress clover, hero, preloader and handoff
  - ticker, Lenis and ScrollTrigger
  - voxel engine: clover3D + lattice + morph, anchors, render on demand
  - statement morph, theme toggle with the cell wipe
  - the reduced-motion and no-WebGL paths
  - measured sizes, Lighthouse ≥90
- **M2 Interaction.** Pointer springs, weight field, magnetic and stepped buttons, the shared velocity
  signal, sound, menu, Inspect v1.
- **M3 Leaves.** Pin + stepped Flip + `uLit`, the four demos (sitemap builder, palette and contrast generator,
  container-query resizer, search-snippet preview), the mobile layout.
- **M4 Range.** Style engine, font subset pipeline, six languages, dissolve, tabs and auto-cycle.
- **M5 Proof, Lab teaser, Footer wordmark, contact band.** Proof covers LCP, CLS, INP, resources, fps and
  renderer stats; Inspect v2.
- **M6 Multi-page.**
  - ClientRouter with persisted canvas and nav, cell-cover transitions
  - four service pages with glyph formations and deep demos
  - `/start/` brief builder (endpoint + mailto fallback, gold completion)
  - 404 herding game
- **M7 Lab.** Voxel sandbox, clover sequencer, make-a-mark (SVG export), type playground, cell shader,
  flow field.
- **M8 Hardening and polish.**
  - copy pass with `anti-ai-slop-writing`
  - critique passes with frontend-design, taste-skill and Impeccable `/audit`, plus a motion review with
    Emil's skill
  - OG and icons from the brand SVGs, JSON-LD, sitemap
  - CSP decision
  - `DESIGN.md` and a README; the unfilled-placeholder report

Each milestone ends with screenshots that I review before moving on.

## Verification
- **Unit**: `node --test tests/unit`.
- **E2E** (`tools/test/run.mjs`): headless Chrome over CDP with its own `--user-data-dir` under `.cache`, so it
  never touches the user's running Chrome, and with GPU flags so WebGL is real. A deterministic `?fx-test`
  mode exposes `window.__fx`.
  - **smoke**: 1440×900, 1024×768 and 390×844, each in both themes. Fails on any console error or failed
    request.
  - **scroll checkpoints**:
    - pins land at top 0
    - expected formation and progress
    - service index and lit count
    - voxel-to-SVG alignment within ±1.5px
    - gold pixel probe within ΔE<2 of #E8B422
    - CLS below 0.01 excluding the sandbox
  - **reduced motion**: no Lenis or pin spacers, engine never loaded, nothing animating after 1s.
  - **no-WebGL**: `--disable-3d-apis`; three is never requested.
  - **keyboard**: focus path visible and never under the nav; dialog Esc returns focus; Leaves buttons work.
  - **axe-core**: default, menu open, Inspect on, light theme and mobile.
  - **page transitions**: navigate all pages and back, no errors, no leaked triggers.
- **Lighthouse** (from Node against the brotli `serve.mjs` build): 3 runs, median, mobile. Pass means
  performance ≥90 and accessibility, best practices and SEO at 100, for both the GPU and fallback paths.
- **Manual**: real iPhone and Android check by the user (iOS can't be emulated from Windows), plus a visual
  review of screenshots at every milestone.
