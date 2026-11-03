# Portfolio v3 Implementation Plan

> **For agentic workers:** executed natively in this session (user runs batches with "continue").
> Each batch ends with a verification step (screenshots + console) before stopping.

**Goal:** Ship mtahabinrashid v3: an Awwwards-grade one-page creative-developer portfolio with
one WebGL canvas (hero flow field + x-ray lens, works rail, about), synthesised sound, 8 featured
+ 6 archive works with real imagery, 404 page, SEO/security headers, static Vercel deploy.

**Architecture:** Static HTML + hand-written CSS; one ESM entry `src/main.js` bundled by esbuild
into `js/app.js` (GSAP 3.15 + ScrollTrigger/SplitText/CustomEase/Observer, Lenis 1.3, Three.js
0.187). Modules: `scroll.js` (Lenis + velocity bus), `gl/` (renderer, stages, shaders),
`sound.js` (Web Audio synth), `cursor.js`, `preloader.js`, `works.js` (rail + overlay + archive),
`sections.js` (manifesto, split stage, record, about, contact), `a11y.js` (reduced motion, focus).

**Tech Stack:** HTML5, CSS (custom properties, container/viewport units), JS ES2020, GSAP 3.15,
Lenis 1.3.x, Three.js 0.187, esbuild 0.28, Playwright for verification, Python/PIL for assets.

**Spec:** `docs/2026-11-03-portfolio-v3-design.md` (+ `docs/BRIEF.md`).

## Global Constraints

- Only `transform`, `opacity`, `clip-path` animate; no `transition: all`; eases expo/quart only.
- No third-party requests except `/_vercel/insights`. Fonts self-hosted, subset, preloaded.
- DPR cap 1.5 (desktop) / 1.25 (phone); sim RT 192²/128²; single renderer; stages pause offscreen.
- Sound never starts without a user gesture; default muted when `prefers-reduced-motion`.
- Every heading is real HTML; SplitText `aria: "auto"`; all images have alt; focus-visible styled.
- Page works with JS off (content readable, images visible) and with WebGL unavailable.
- Copy rules: no em dash in visible text; no invented stats; one CTA label ("Let's talk").

## Review Focus

1. Resize/orientation change mid-scroll: pins re-measure, GL planes re-sync (ScrollTrigger.refresh
   + rect re-measure; test by resizing in Playwright at three scroll positions).
2. Fast scroll (velocity spikes): skew/RGB split clamp so no tearing; test with wheel bursts.
3. WebGL context loss / missing WebGL: DOM images visible, no errors (test by disabling GL).
4. Touch: lens follows touch, rail scrolls natively (no pin on <880px), overlay scroll-locked.
5. Reduced motion: no preloader, no pins, no canvas, sound toggle hidden, all text visible.

---

## Batch 1 — Foundation (scaffold, tokens, type, scroll, preloader, nav, hero DOM)
Files: `index.html`, `css/main.css`, `src/main.js`, `src/scroll.js`, `src/preloader.js`,
`src/cursor.js`, `fonts/*`, `img/*`, `package.json`, `vercel.json`, `build.mjs`.
Done when: page loads with preloader → hero choreography, nav, custom cursor; Lenis scroll;
no console errors; screenshots at 1440 and 390 look right.

## Batch 2 — WebGL hero (flow field + x-ray lens) + sound engine + sound prompt
Files: `src/gl/renderer.js`, `src/gl/stage-hero.js`, `src/gl/shaders/*.glsl.js`, `src/sound.js`.
Done when: lens reveals blueprint portrait, flow bends pixels, pauses offscreen; sound prompt
in preloader, toggle in nav, hover/click/whoosh/ambient audible when enabled.

## Batch 3 — Works (the peak): pinned horizontal rail, GL planes, lens, overlay, archive
Files: `src/works.js`, `src/gl/stage-works.js`, `data/works.js`, `assets/work/*`.
Done when: 8 slides travel with scroll, bend with velocity, x-ray on hover, overlay opens with
images/stack/link, archive rows show hover thumbnails, mobile falls back to vertical list.

## Batch 4 — Manifesto, Front/Back split stage, Record, About (GL lens), Contact, 404
Files: `src/sections.js`, `src/gl/stage-about.js`, `404.html`.
Done when: all seven acts scroll in sequence with reveals; divider collapse works; contact holds.

## Batch 5 — Hardening: responsive pass, reduced-motion, a11y, SEO (meta, JSON-LD, sitemap,
robots, OG image), security headers/CSP, performance (preloads, lazy, sizes), verification sheets
desktop/mobile/reduced, Lighthouse-style checks, README, zip packaging.

---

## Status (2026-11-03): all five batches shipped

| Batch | Result |
|---|---|
| 1 Foundation | Done. Archivo/Geist/Geist Mono subset and preloaded, Lenis + velocity bus, structural loader, nav, hero with proximity type. |
| 2 WebGL hero + sound | Done. One renderer, flow field, x-ray surface shader, hero name DOM twin, Web Audio engine with opt-in prompt. |
| 3 Works | Done, with one change from the plan: the rail is **vertical**, not a pinned horizontal rail (research finding: horizontal rails scored as a cliche in the 2025-26 portfolio set, and vertical keeps native scroll on phones). Blueprint → Build planes, Flip morph into the case overlay, archive slot. |
| 4 Sections | Done. Manifesto fill, Front/Back split stage, Record, About on the light ground, Contact, designed 404. |
| 5 Hardening | Done. Responsive + short-viewport + landscape-phone rules, reduced motion, keyboard pass (loader and case dialog use `inert` + focus management), JSON-LD Person + ItemList, sitemap/robots/llms.txt/manifest, CSP without inline script or style, HSTS/COOP/nosniff, immutable caching for hashed chunks, OG image, README. |

Verification: `node tools/verify.cjs --enter=sound --csp` walks desktop (1440×900), iPhone 13 and
reduced motion with the production CSP header applied: **0 console errors, 0 page errors,
0 failed requests** in all three. Contact sheets in `tools/out/`.

Open items for the owner (not blockers):
- Shirley Grispi, The Gold Coin and Ritchie Kemp have no live URL yet: add `url` in
  `data/works.js` and the matching `href` in the static list in `index.html` when they go live.
- `img/`, `fonts/` and `icons/` are cached immutable for a year on Vercel: when replacing an
  image, give the file a new name (or bump the name in `index.html` / `data/works.js`).
- Vercel Analytics: the site loads `/_vercel/insights/script.js`; turn Analytics on in the Vercel
  project (it 404s harmlessly elsewhere, the harness ignores it).
