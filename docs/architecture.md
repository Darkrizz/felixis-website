# Architecture notes

Condensed from the technical review done before the build (Oct 2026). The full plan is in `PLAN.md`.

## Facts that shaped the code

- **Astro 7 / Vite 8**: `compressHTML` removes whitespace between inline elements, so per-word spans are made at runtime by SplitText, never by hand. Fonts go through Astro's Fonts API (local provider, metric-matched fallbacks, preload of the Latin Familjen file). The generated family name carries a hash suffix; Inspect strips it for display.
- **GSAP 3.15**: all plugins are free. `SplitText.create` with `aria: 'auto'` only on headings (an `aria-label` on a `<p>` fails axe); the statement uses `aria: 'none'`. Never split before `document.fonts.ready`.
- **GSAP Flip and CSS individual transforms**: GSAP folds `translate` / `rotate` into its own inline transform, so Flip targets must not use them (the Range posters centre with `left` + `width` instead), and Flip clears its props on complete.
- **Lenis 1.3**: created before any ScrollTrigger; `lenis.on('scroll', ScrollTrigger.update)`, `lenis.raf` on the GSAP ticker, `lagSmoothing(0)`. Never created under reduced motion.
- **Pins**: built in DOM order, each morph range before the pin it leads into, `ScrollTrigger.sort()` as a safety net. The leaves pin animates CSS grid tracks (`minmax(0, Nfr)` so content can't inflate them) instead of scrubbing a Flip.
- **three r186**: WebGL2 only, imported only inside `scripts/voxel/`. `main.ts` creates the WebGL2 context itself; when that fails three.js is never downloaded. Formations are attribute buffers uploaded once; a morph only rebinds `aFrom`/`aTo`.
- **Headless Chrome for tests**: always its own `--user-data-dir` under `.cache/` (without it, `chrome.exe` attaches to the user's running browser), `--use-angle=d3d11` for real GPU, `--disable-3d-apis` for the fallback path. SwiftShader is treated as "no GPU" by the site unless `?fx-test` is set.

## Engine API (core/stage.ts)

Pages call `setStage(stations, morphs)`. A station is `{ formation, anchor, pose: tilt|float|flat, lit?, scatter? }`; a morph is `{ st: ScrollTrigger, from, to }`. The engine reads `stage.lit` (cells lit on `lit` stations), `stage.gold` (gold glow) and `stage.spin` (sandbox rotation). Controls reach the engine through `engineRef.current` (`explode`, `setTheme`, `setWire`, `sandbox`, `stats`).

## Budgets (gzip, enforced by tools/check-budgets.mjs)

Entry ≤ 90 kB (61 kB today), voxel engine ≤ 175 kB (133 kB), any other lazy chunk ≤ 40 kB (largest: Range, 11 kB).
