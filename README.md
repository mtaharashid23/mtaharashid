<div align="center">

<br />

<img src="icons/icon-192x192.png" width="72" height="72" alt="" />

<br />
<br />

# MUHAMMAD TAHA BIN RASHID

**Full Stack Developer · Karachi, Pakistan**

Award-style, animation-rich websites, engineered end to end.<br />
React and Vue in front. Laravel and Node behind.

<br />

[**mtahabinrashid.vercel.app**](https://mtahabinrashid.vercel.app) &nbsp;·&nbsp; [GitHub](https://github.com/mtaharashid23) &nbsp;·&nbsp; [LinkedIn](https://www.linkedin.com/in/muhammad-taha-bin-rashid-719a07259) &nbsp;·&nbsp; [Email](mailto:muhammadtahabinrashid@gmail.com)

<br />

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-0C0C0D?style=flat-square&logo=javascript&logoColor=EDEAE4)
![GSAP 3.15](https://img.shields.io/badge/GSAP_3.15-0C0C0D?style=flat-square&logo=greensock&logoColor=EDEAE4)
![Three.js](https://img.shields.io/badge/Three.js-0C0C0D?style=flat-square&logo=three.js&logoColor=EDEAE4)
![Lenis](https://img.shields.io/badge/Lenis-0C0C0D?style=flat-square&logoColor=EDEAE4)
![Vercel](https://img.shields.io/badge/Vercel-0C0C0D?style=flat-square&logo=vercel&logoColor=EDEAE4)
![Available](https://img.shields.io/badge/Available_for_work-FF5A2D?style=flat-square&labelColor=0C0C0D)

<br />

</div>

---

## The idea

One page, one portrait, one accent. Typography carries the design: Bricolage Grotesque set at viewport scale, hard-cut chapters between off-black and bone, and motion that explains the page instead of decorating it.

Every animation had to answer "why does this move?" before it shipped. Default easing, section counters, scroll cues and card grids were cut on principle.

<br />

## Signature interactions

| | Move | How it works |
|---|---|---|
| **01** | **Type that feels the cursor** | Each letter of the hero name is a span with its own `wght` and `wdth` axes. Distance to the pointer drives both, lerped per frame. Touch devices get a slow weight wave instead. |
| **02** | **Scroll velocity bends the type** | Lenis velocity is normalised and fed into the width axis of the hero name and into the speed and skew of the stack tickers. Fast scroll compresses the page; stopping lets it breathe. |
| **03** | **A portrait you can disturb** | Pointer movement is painted into a ping-pong flow field (192×192, Three.js). The display shader bends the photo's UVs along that field, splits the channels by flow magnitude and tints toward ember on hover. Pauses off-screen. |

<br />

## Journey

```
Loader        counter, one line, curtain lift
Hero          name at 10vw, portrait bleeding under the type
Manifesto     pinned, words fill in word by word as you scroll
Capabilities  light chapter, four rows, fill wipes on hover
Stack         three outline tickers, speed and skew follow the wheel
Experience    pinned horizontal rail, 2022 → 2026, vertical on mobile
About         sticky portrait with clip reveal, education, links
Contact       one giant line, one email, Karachi local time. It holds.
```

<br />

## Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | Semantic HTML, no framework | Real `<h1>`, real lists, real links. Reads without JS. |
| Type | Bricolage Grotesque Variable, Geist, Geist Mono | Self-hosted, preloaded, two families plus a mono for data. |
| Motion | GSAP 3.15 + ScrollTrigger + SplitText + CustomEase | Expo/quart curves everywhere. No `ease`, no `linear`. |
| Scroll | Lenis 1.3 | Weighted, physical scroll wired into ScrollTrigger. |
| WebGL | Three.js 0.186, bundled with esbuild | Two fullscreen passes, no geometry beyond a quad. |
| Hosting | Vercel, static | Immutable cache headers, clean URLs, designed 404. |

<br />

## Structure

```
index.html              page
404.html                not-found page, served automatically by Vercel
css/main.css            tokens, type ramp, themes, sections, responsive, reduced motion
js/main.js              scroll, loader, choreography, signature interactions
js/gl.js                built bundle          <- do not edit
src/gl.js               WebGL portrait source <- edit this
vendor/                 gsap, ScrollTrigger, SplitText, CustomEase, lenis (pinned)
fonts/                  variable woff2, latin subsets
img/  icons/            portrait (webp + jpg), OG image, PWA icons, favicon.svg
```

<br />

## Run

```bash
npx serve .
```

Rebuild the WebGL bundle after editing `src/gl.js`:

```bash
npm install
npm run build
```

<br />

## Craft notes

- **Performance.** Only `transform`, `opacity` and `clip-path` animate. Fonts are subset and preloaded. The portrait ships as `webp` with a `jpg` fallback and a matching responsive preload. The WebGL loop stops when the hero leaves the viewport.
- **Accessibility.** `prefers-reduced-motion` removes the loader, pins, parallax and WebGL; every word stays readable. Focus states are visible and on-brand. Titles that split for animation are never left hidden.
- **Details.** Branded selection, themed scrollbar, magnetic buttons, custom cursor gated to fine pointers, grain at 4.5%, live PKT clock, JSON-LD Person schema, OG image, sitemap.

<br />

## Palette

| Token | Dark ground | Light ground |
|---|---|---|
| Canvas | `#0C0C0D` | `#EEEBE5` |
| Ink | `#EDEAE4` | `#101012` |
| Accent | `#FF5A2D` | `#D8410F` |

One hue, two stops, locked for the whole page.

<br />

---

<div align="center">

**Built by Muhammad Taha Bin Rashid** · Karachi · 2026

Full-time roles and select freelance projects: [muhammadtahabinrashid@gmail.com](mailto:muhammadtahabinrashid@gmail.com)

<br />

</div>
