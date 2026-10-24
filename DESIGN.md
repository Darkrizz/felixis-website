# Felixis: design notes

## The brief

The studio's own site had to show off as much craft as possible (3D, kinetic type, many typefaces, many design languages, behaviours) and still read as one considered, expensive build. There was no client work to show, so the site is its own portfolio: every claim is a working demo on the page, and the only numbers anywhere come from the visitor's own browser.

## The idea: one cell, many forms

The Felixis mark is a pixel clover on a 7x7 grid of 6-unit cells: four 3x3 leaves, each missing its outer corner cell, a cross-shaped gap and one centre cell (33 cells; see `src/data/brand.ts`, checked against the trademark SVGs by `tests/unit/brand.test.ts`). The top-right leaf is gold. *Felix* is Latin for lucky.

Everything is made from that cell:

- **One voxel clover travels the whole site.** It is a single instanced mesh of 1,188 cubes (528 on phones). It re-forms per section: the 3D clover, a dot lattice behind the statement, a flat clover that fills cell by cell as a progress meter, dust, each service's glyph, and the word "Felixis" in the footer. It persists across page changes and morphs from the old page's shape into the new page's.
- **Every corner is a missing cell.** Buttons, panels, demo frames and focus rings have one notched corner, never rounded ones (`src/styles/shape.css`). Four notched panels in a 2x2 make a clover.
- **Every UI icon is drawn on the same 7x7 grid** (`PixelIcon.astro`).
- **Every big change is cells moving.** Page changes, the theme switch and the mobile menu all use one cell-cover (`effects/cover.ts`); the Range stage dissolves in cells; the preloader drops the 33 cells into place.
- **The four leaves are the four services and the working order**: Strategy, Design (gold), Development, Growth. The clover only completes when all four are done, which is the brand line ("Luck has nothing to do with it").

## Colour

From the trademark files. Dark is the default; light is a full theme, not an afterthought.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--ground` | `#13201A` | `#EEF1EA` | page |
| `--surface` / `-2` | `#1A2B22` / `#213429` | `#E3E8DF` / `#D8DFD3` | panels, inputs |
| `--ink` | `#EEF1EA` | `#13201A` | text |
| `--ink-2` | `#9AAEA1` (7.2:1) | `#4A5C51` (6.3:1) | secondary text |
| `--leaf` | `#4CB27A` | `#1F6B45` | brand green |
| `--gold` | `#E8B422` | `#E8B422` | the one "lucky" thing in view: primary button, the Design leaf, the active choice |
| `--gold-text` | `#E8B422` | `#7A5A00` | gold used as text (passes AA on paper) |

Gold surfaces always carry forest text (8.8:1). `#4CB27A` and gold are never used as text on paper.

## Type

- **Familjen Grotesk** (the wordmark's face), variable 400 to 700, for everything you read. In the hero its weight follows the pointer; each glyph box keeps its base advance, so heavier letters never push their neighbours (no layout shift).
- **Doto**, a dot-matrix variable face, for numbers that are live or counted: the Proof readouts, step numbers, slider values. Never for small labels.
- **Specimen faces**, only in the Range stage, subset at build time to the poster's characters and pinned to static weights (each file is 5 to 7.5 kB): Archivo (Swiss), Newsreader Italic (editorial), Space Mono (brutalist), Mona Sans Expanded (glass), Doto (terminal), Nunito Black (soft 3D). Anybody (width 50 to 150) is loaded only on the type playground page.

## Motion grammar

- Eases: **glide** `cubic-bezier(.16,1,.3,1)` for travel, **swing** `(.65,0,.35,1)` for morphs, **step** `steps(n)` for pixel moments (button fills, reveals, wipes, counters).
- One clock: `gsap.ticker` runs Lenis, ScrollTrigger, pointer springs, the voxel render and Inspect in a fixed order (`core/ticker.ts`). Pointer position and scroll velocity are shared signals (`core/signals.ts`), so the voxels, the hero type and the type playground respond to the same input in the same frame.
- Automatic motion is limited to the first-visit preloader, scroll-scrubbed morphs (the visitor drives them) and the clover's slow breathing. Everything else answers an action.
- Reduced motion, from the OS or the nav's motion switch, gives a complete static site: SVG clovers, no smooth scroll, no pins, instant swaps. The switch reverts and rebuilds the page live.

## What's on the site, and why it's there

| Effect | Where | What it demonstrates |
|---|---|---|
| Voxel clover: lighting, bevels, spring physics, staggered GPU morphs between 9 formations | every page | 3D and shader work in one draw call |
| Pointer repulsion and explode-and-rebuild | hero, service glyphs, footer wordmark | physics that answers the visitor |
| Pinned four-leaf section: CSS grid tracks animate, the progress clover lights cell by cell, arpeggio on completion | home | scroll choreography that tells the process |
| Live tools in the leaves: sitemap builder, OKLCH palette with WCAG checks, container-query card, pixel-width search snippet | home and service pages | each service shown, not described |
| Range: one poster DOM in six art directions, GSAP Flip plus a stepped cell wipe | home, `/design/` | range across design languages |
| Inspect mode (`I`): the real grid, component outlines, type and token labels, animation curves, redlines, LCP element, wireframe voxels | every page | precision, and the page explaining itself |
| Proof: LCP, CLS, transfer size, requests, live fps, GPU cube count, DOM size, script weight | home, `/development/`, `/growth/` | performance shown with the visitor's own numbers |
| Cell-cover page and theme transitions with persistent canvas and nav | site-wide | a multi-page site that feels like one object |
| Synthesised interface sound (off by default) | site-wide | Web Audio, pentatonic so any sequence sounds intended |
| Positioning map, type-scale generator, spring editor with live code, conversion funnel | service pages | strategy, design, engineering and growth tools |
| Voxel sandbox (gravity collapses each column, painting), clover sequencer, make-a-mark SVG export, variable type playground, raw WebGL2 cell shader, curl-noise flow field | `/lab/` | experiments, each a real piece of work |
| Brief builder that grows a leaf per step | `/start/` | form craft and validation |
| Catch-the-gold-cell game | `/404` | even the dead end is designed |

## Accessibility decisions

- Every canvas is `aria-hidden` and every canvas interaction has a real control (the hero and service "explode" buttons, sandbox toolbar, sequencer buttons).
- The scrubbed statement never drops below 3:1 contrast. CSS maps scroll progress onto `--scrub-min` per theme, so even un-scrolled words pass for large text.
- The four leaves' panel headers are buttons that scroll to their step; inactive demos are `inert`. Range is a tablist with arrow keys; it only changes when the visitor picks a style, so it needs no pause control. The menu is a `<dialog>`; Escape returns focus.
- Notches live on pseudo-elements, so focus rings, hit areas and forced-colours borders are never clipped.
- The Proof's layout-shift figure counts shifts before the first scroll or input, matching its label ("while loading"); sections that rearrange as you scroll do so on purpose.

## Architecture in one paragraph

Static Astro pages, ClientRouter for transitions, one module entry (`src/scripts/main.ts`, 61 kB gzip with GSAP and Lenis). Pages publish a **stage script**: a list of stations (formation + DOM anchor) and the ScrollTrigger ranges between them (`core/stage.ts`). The voxel engine (`scripts/voxel/`, 133 kB gzip, three.js tree-shaken) loads after `load` plus idle, only when WebGL2 is available, motion is allowed and Save-Data is off. It fits each formation to its anchor's box every frame, so the cubes line up with the SVG cells at any size. Demos and lab experiments load their code only when they come near the viewport (`scripts/demos/registry.ts`). `tools/check-budgets.mjs` fails the build if a chunk outgrows its budget or three.js leaks into the entry.

## Things to know

- **Placeholders** (domain, email, phone, location, form endpoint, socials) are in `src/data/site.config.mjs`. The build lists the missing ones.
- **The `/start/` form** sends through FormSubmit (no account, no key) to the studio email, as JSON with a `_honey` spam trap and a table-formatted email. Without JavaScript it posts to FormSubmit directly. Until the email placeholder is replaced it opens a prefilled email instead. The success copy makes no promise about reply times.
- **Theme**: dark on every visit and every device, whatever the system setting. The light toggle lasts for the current visit only (sessionStorage).
- **No client work, testimonials, logos or statistics** appear anywhere, because none were supplied. When there is real work, the Lab teaser is the natural place to add a Work section, keeping its asymmetric grid.
- **Not yet checked on real devices**: iOS Safari (address bar resizing, low-power mode) and a low-end Android phone.
