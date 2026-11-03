<div align="center">

<br />

<img src="icons/icon-192x192.png" width="72" height="72" alt="" />

<br />
<br />

# MUHAMMAD TAHA BIN RASHID

**Full Stack Developer · Karachi, Pakistan**

Award-style websites and the systems behind them.<br />
React and Vue in front. Laravel and Node behind.

<br />

[**mtahabinrashid.vercel.app**](https://mtahabinrashid.vercel.app) &nbsp;·&nbsp; [GitHub](https://github.com/mtaharashid23) &nbsp;·&nbsp; [LinkedIn](https://www.linkedin.com/in/muhammad-taha-bin-rashid-719a07259) &nbsp;·&nbsp; [Email](mailto:muhammadtahabinrashid@gmail.com)

<br />

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-0B0B0D?style=flat-square&logo=javascript&logoColor=ECE7DD)
![GSAP 3.15](https://img.shields.io/badge/GSAP_3.15-0B0B0D?style=flat-square&logo=greensock&logoColor=ECE7DD)
![Three.js](https://img.shields.io/badge/Three.js_0.187-0B0B0D?style=flat-square&logo=three.js&logoColor=ECE7DD)
![Lenis](https://img.shields.io/badge/Lenis_1.3-0B0B0D?style=flat-square&logoColor=ECE7DD)
![Web Audio](https://img.shields.io/badge/Web_Audio-0B0B0D?style=flat-square&logoColor=64E0FF)
![Vercel](https://img.shields.io/badge/Vercel-0B0B0D?style=flat-square&logo=vercel&logoColor=ECE7DD)
![Available](https://img.shields.io/badge/Available_for_work-FF5A2D?style=flat-square&labelColor=0B0B0D)

<br />

</div>

---

## The idea

**Under the hood.** A full-stack developer ships the pixels and the system beneath them, so the site lets you look beneath its own pixels. The cursor is an x-ray: over the portrait, the name, and every project, it reveals a live blueprint of what is underneath. Two layers, two palettes. The front is warm (bone, ember, off-black). The back is cold (blueprint cyan on navy).

v3 replaces v2 entirely: new type (Archivo), a WebGL layer that carries the whole page, sound, and a work section built from fourteen shipped sites.

<br />

## Signature interactions

| | Move | How it works |
|---|---|---|
| **01** | **The site builds itself** | The loader measures the hero's real elements and draws them as a blueprint (boxes, labels, dimension lines, a title block) before the navy ground wipes away and the real layout renders into its own outlines. |
| **02** | **The x-ray lens** | One lens position shared by the page. In GLSL: a Sobel-edge blueprint of the texture inside the lens, grid and scan lines, a rim stirred by a flow field the pointer paints, RGB split and shear from scroll velocity. The name gets a DOM twin (navy fill, cyan stroke) masked by the same lens. On phones the lens rides the last touch and drifts on its own. |
| **03** | **Blueprint → Build** | Each project arrives as a wireframe (edges plotting in on a diagonal sweep), renders into pixels with a left-to-right wipe as it reaches the middle of the viewport, and dissolves back as it leaves. Click: a GSAP Flip morph carries the plane into the case overlay. |
| **04** | **Front / Back** | Two columns held apart by a divider. Scroll fills both sides, the sides let go, the two words travel to the centre and ghost behind "One developer. The whole stack." |
| **05** | **Reactive sound** | Synthesised with the Web Audio API, no files. An ambient bed whose filter opens with scroll velocity, a lens hum that follows pointer speed, ticks, thuds and whooshes on the UI. Opt-in, remembered, paused when the tab hides. |

<br />

## Journey

```
Loader        the hero drafted as a blueprint, title block, "Enter with sound / Enter quietly"
Hero          name at 10.4vw with cursor-proximity weight, portrait under the type, x-ray lens
Manifesto     pinned, words fill as you scroll
Work          eight planes, blueprint → build, x-ray on hover, case overlay, six archive rows
Front / Back  pinned split stage that resolves into one line
Record        five roles, 2022 → 2026, the centred year fills solid
About         portrait on the light ground, x-ray again
Contact       "Let's build." with proximity type, copy-to-clipboard, Karachi time and your offset
404           a sheet that was never issued
```

<br />

## Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | Semantic HTML, no framework | Real `<h1>`, lists, links and a static work list. Reads without JS. |
| Type | Archivo Variable (wdth 62–125), Geist, Geist Mono, Instrument Serif Italic | Self-hosted, subset, preloaded. The width axis is what the scroll bends. |
| Motion | GSAP 3.15: ScrollTrigger, SplitText, Flip, Observer, CustomEase, DrawSVG | Expo and quart curves only. |
| Scroll | Lenis 1.3 | Weighted scroll, one velocity bus shared with type, planes, grain and sound. |
| WebGL | Three.js 0.187 in its own lazily loaded chunk | One renderer, one canvas behind the DOM, stages that only render in view. |
| Sound | Web Audio API | Zero assets, created inside the user's click. |
| Build | esbuild | `src/` → `js/app.js` + hashed chunks. |
| Hosting | Vercel, static | CSP, HSTS, immutable caching for hashed assets, designed 404. |

<br />

## Structure

```
index.html              the page (static work list and archive, JSON-LD Person + ItemList)
404.html                not found, served automatically by Vercel
css/main.css            tokens, type ramp, themes, every section, responsive, reduced motion
js/app.js               built entry            <- do not edit
js/gl-*.js, chunk-*.js  built chunks (Three.js lives in gl-*)
js/head.js              pre-paint: js class, sound preference, analytics queue
src/                    source: main, env, motion, scroll, cursor, sound, nav, hero, preloader,
                        reveals, sections, works
src/gl/                 renderer, flow field, surface shader, lens, field, hero/works/about stages
data/works.js           case content for the overlay
img/work/               1600 / 1000 / 640 webp per work, blueprint thumbs, second and phone shots
fonts/  img/  icons/    self-hosted type, portrait, PWA icons
tools/verify.cjs        Playwright harness: desktop, phone and reduced-motion walks with contact sheets
docs/                   brief, design document (with the research findings) and the batch plan
.vercelignore           keeps src, tools, docs and node_modules out of the deployment
```

<br />

## Run

```bash
npm install
npm run build      # esbuild → js/
npm run dev        # serve on :3000
npm run verify     # headless walk, screenshots in tools/out, console errors in tools/out/errors.txt
```

`?gl=force` keeps WebGL on under software rasterisers (the harness uses it); by default the site falls back to the DOM images on SwiftShader and llvmpipe so nobody gets a slideshow.

`npm run verify -- --enter=sound --csp` is the full pass: desktop, iPhone 13 and reduced motion, with the production Content Security Policy applied to every response. `--only=desktop|mobile|reduced` runs one.

**Deploy.** The repo is deployed as-is (`js/` is committed, `buildCommand` and `installCommand` are empty in `vercel.json`). After editing anything in `src/` or `data/`, run `npm run build` and commit `js/`. Images, fonts and icons are cached immutable for a year, so a replaced image needs a new file name.

**Adding a live URL** for A Few Regrets (Shirley Grispi), The Gold Coin or Ritchie Kemp: set `url` in `data/works.js` (the case overlay reads it), then in `index.html` add the `url` to that work's JSON-LD entry and, for A Few Regrets, add `<a class="work-link" href="…" target="_blank" rel="noopener">Visit site</a>` after its `.work-stack` list like the other featured items; for the two archive rows, change the `<button class="archive-row" data-open>` to an `<a class="archive-row" href="…" target="_blank" rel="noopener">` with the `↗` arrow, matching the rows beside them.

<br />

## Craft notes

- **Performance.** Only `transform`, `opacity` and `clip-path` animate. Fonts are subset and preloaded. The WebGL chunk loads after first paint; DOM images stand in until it is ready and come back if the context is lost. DPR is capped at 1.5 on desktop and 1.25 on phones, the flow field runs at 192² / 128², off-screen planes are culled, smoothing is frame-rate independent.
- **Accessibility.** `prefers-reduced-motion` removes the loader, the pins, the canvas and the sound prompt; every word stays readable. The case is a real dialog with a focus trap, Escape and focus return. The sound control is a pressed button with a label. Meta text clears 4.5:1 on both grounds.
- **Security.** Content Security Policy with no inline script or style, HSTS, COOP, `nosniff`, `frame-ancestors 'none'`. No forms, no third-party scripts except Vercel's own analytics.
- **SEO.** Canonical, Open Graph, JSON-LD Person and an ItemList of the fourteen works, sitemap, robots, `llms.txt`.

<br />

## Palette

| Token | Dark ground | Light ground |
|---|---|---|
| Canvas | `#0B0B0D` | `#ECE8E0` |
| Ink | `#ECE7DD` | `#111113` |
| Accent | `#FF5A2D` | `#D8410F` |
| Blueprint | `#64E0FF` on `#060C16` | same |

Ember is the person. Cyan is the machine.

<br />

---

<div align="center">

**Built by Muhammad Taha Bin Rashid** · Karachi · 2026

Full-time roles and select freelance projects: [muhammadtahabinrashid@gmail.com](mailto:muhammadtahabinrashid@gmail.com)

<br />

</div>
