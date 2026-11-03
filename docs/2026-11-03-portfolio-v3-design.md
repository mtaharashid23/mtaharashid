# mtahabinrashid v3 — Design

Status: draft for approval · Author: Claude (Fable 5.1) with Muhammad Taha Bin Rashid · 2026-11-03

## 1. Intent

Rebuild mtahabinrashid.vercel.app as a creative-developer portfolio at Awwwards Site-of-the-Day
level: Lusion-grade WebGL, sound design, a real "work" section built from the author websites
Taha has shipped, and motion that is smooth and in sync on desktop and mobile. The site is the
submission piece; it also has to land freelance and full-time work, so every section must still
read as a developer's portfolio (what he does, proof, how to reach him).

The user's words: "awwwards winning style … awwwards winning animations … sound bhi ho … three js
webgl bhi use krna … lusion.co ko dkh lena … creative developer ki trah kam krna … koi bhi issue
na ho … responsive ho … sub kuch smooth aur sync chlna chaiye".

## 2. Goals / non-goals / anti-goals

Goals
- One page that a juror can scroll in 90 seconds and remember one moment.
- A works section with 8 featured sites + 6 archive rows, every one with real imagery.
- WebGL that is the design, not decoration: hero, works rail, about. One renderer, one canvas.
- Sound that is opt-in, synthesised (no audio files), and tied to what the hand is doing.
- 60fps on a mid-range laptop; usable and good-looking on a phone; LCP under 2.5s on 4G.
- Zero console errors, zero layout shift, keyboard reachable, reduced-motion respected.

Non-goals
- No CMS, no framework, no case-study subpages (an overlay per work instead).
- No motion-graphics video; the WebGL is the motion piece.
- No blog.

Anti-goals (would make it a failure even if it works)
- Looks like a template of 2024 Awwwards portfolios (purple gradients, "scroll to explore",
  section counters on everything, three equal cards, identical reveal on every block).
- Sound that autoplays or nags.
- A hero that is spectacular and a works section that is a plain grid.
- Anything that stutters on scroll, or desyncs between the WebGL layer and the DOM.

## 3. Constraints

- Static deploy on Vercel (cleanUrls), vanilla HTML/CSS/JS. Build step only for the JS bundle
  (esbuild) so Three.js tree-shakes. Everything else is hand-written.
- Self-hosted fonts, no third-party requests except Vercel analytics.
- Assets available: studio portrait, 14 site screenshots (desktop hero, two mid frames, mobile),
  resume PDF, icons. No video footage.
- Live URLs known for 8 of 14 works; the other 6 need the user's Netlify/custom URLs.
- Accent and identity continuity with v2 (ember orange, off-black/bone) unless the user objects.

## 4. The concept

**Brand essence:** *Under the hood.* A full-stack developer who ships the pixels and the system
beneath them.

**Visual tension:** warm, physical front layer (bone type, ember accent, grainy off-black) against a
cold, schematic back layer (blueprint cyan lines on deep navy). The page cuts between the two.

**Signature move (bespoke, lives only here): the x-ray cursor.** On every WebGL surface, a soft
lens follows the pointer and reveals the schematic under the pixels:
- hero: the portrait and the name become edge-traced blueprint lines inside the lens, with the
  v2 flow field bending the pixels around the lens (the field is painted by pointer velocity);
- works: each screenshot shows its wireframe (edge-detected blueprint) under the lens; a hint of
  the site's stack appears as a label stamped inside the lens;
- about: the portrait again; the lens reveals a line-drawn version.
Touch devices: the lens rides the last touch point and drifts slowly when idle, so the effect
exists on phones too, not only on desktops.

**Tell-someone sentence:** "It's the site where your cursor x-rays every website to show what's
underneath."

**Peak:** the works rail (act 3). It gets the longest scroll span, the only horizontal travel,
the heaviest WebGL, and silence in front of it (the manifesto is type only).

## 5. Structure (grammar: filmic one-shot with hard light/dark cuts, portfolio variant)

Research-driven revisions (see §14): the preloader does structural work, the works section is
vertical (no horizontal rail), no cursor-following thumbnails, no fluid sim as the hero.

```
0 Preloader   "the site builds itself": the hero's own layout is drawn as a blueprint
              (SVG wireframe boxes for nav, name, portrait, meta, with dimension labels,
              stroke-drawn in ~1.2s), then the real elements render into their outlines.
              Buttons: "Enter with sound" / "Enter quietly". Returning visitors skip it.
1 Hero        MUHAMMAD TAHA BIN RASHID at viewport scale (Archivo, wdth axis), portrait
              bleeding under the type, WebGL only on the portrait+name plane: x-ray lens with
              a small turbulence field at its rim (not a full-screen fluid sim),
              meta line (Full Stack Developer · Karachi · available), one CTA
2 Manifesto   pinned; words fill as you scroll: "I build websites that earn attention,
              and the systems that keep them running." + one italic serif turn of phrase
3 Works       PEAK. "Blueprint → Build": a vertical sequence of 8 large WebGL planes. Each
              work arrives as its wireframe (edge lines drawing in, cyan on navy), renders
              into full pixels as it reaches the centre of the viewport, and dissolves back
              to wireframe as it leaves; scroll velocity bends the plane and splits RGB.
              Beside each plane: index, title, client, type, year, stack. Hover: x-ray lens.
              Click: GSAP Flip morphs the plane into the overlay's hero image; overlay has
              desktop + mobile shots, role, stack, what was built, live link.
              Then the archive: 6 rows (title · type · year · ↗); hovering a row renders its
              thumbnail blueprint→pixels in a fixed slot on the right (nothing follows the
              cursor).
4 Front/Back  Split stage: two columns held in tension (FRONT: React, Vue, GSAP, Three.js,
              Tailwind | BACK: Laravel, Node, REST, MySQL, PostgreSQL) with a divider that
              scroll drives to the centre and collapses: "One developer. The whole stack."
5 Record      Experience: five roles 2022→2026 as a compact ledger (no pinned rail this
              time; v2 did that); years as giant outline numerals that pass behind the rows.
6 About       Sticky portrait with the x-ray lens; copy; education; links; resume.
7 Contact     "Let's build." at 14vw with cursor-proximity weight; email as the only CTA;
              footer: "Karachi · 02:14 · 10h ahead of you" (time difference computed from the
              visitor's clock), phone, GitHub, LinkedIn, © — the page holds here.
404           Same system, one line, link home.
```

Total length target: 11–13 viewport-heights on desktop; the works act takes ~4.

Devices per act (no device twice in a row): 1 lens + kinetic chars · 2 pin + word-fill ·
3 flow + GL blueprint→render + lens · 4 pin + divider from scroll · 5 flow + parallax numerals ·
6 sticky media + lens · 7 proximity type, held.

## 6. Motion system

- Scroll: Lenis 1.3 (lerp 0.09), wired into GSAP ticker and ScrollTrigger. Scroll velocity is
  normalised once and shared with: hero type width axis, works-rail skew/RGB split, grain
  intensity, ambient sound filter.
- Easing: expo.out / quart.out / expo.inOut only. CustomEase names shared across CSS and JS.
- Load choreography: curtain → name chars 1.4s stagger 28ms → portrait clip → meta → CTA → nav.
- Reveals: SplitText lines with masks for every heading; `[data-reveal]` batch for prose.
- Page never blocks input: preloader is skippable (sessionStorage remembers), no scroll-jacking.
- Reduced motion: no preloader, no pins, no WebGL, no sound prompt; all content visible.

## 7. WebGL (Three.js 0.187, one `WebGLRenderer`, fixed full-viewport canvas behind the DOM)

Scene manager renders only the "stage" currently in view (hero / works / about), pausing others.
- Hero stage: fullscreen quad. Inputs: portrait texture, procedural schematic (grid + glyph
  noise), flow field (192² ping-pong RT from v2, upgraded). Lens = smoothstep radius around the
  pointer, edges fed by flow magnitude. Inside lens: Sobel edges of the portrait, tinted cyan,
  on navy; outside: portrait with flow-bent UVs and slight RGB split.
- Works stage: one plane per featured work (8), positions synced from DOM slide rects each
  frame (DOM-to-WebGL). Vertex shader bends the plane by velocity; fragment mixes the color
  texture with its Sobel-edge blueprint inside the lens. Textures: 1000px webp, lazy, uploaded
  once the works section is near.
- About stage: portrait plane with the same lens shader.
- Budget: DPR ≤ 1.5 desktop, ≤ 1.25 phone; sim RT 192² desktop / 128² phone; no post-processing
  pass (grain is CSS). Context-loss handled: DOM images remain underneath as the fallback.

## 8. Sound (Web Audio, synthesised at runtime, no files)

- Gate: preloader offers "Enter with sound" (primary) / "Enter without". Choice persists in
  localStorage. Toggle in the nav (animated bars). Starts muted on reduced-motion.
- Palette: ambient bed (two detuned triangle oscillators through a low-pass, slow LFO) whose
  filter opens with scroll velocity; hover tick (sine 1.1k→0.7k, 35ms); click thud (sine 160Hz,
  90ms) + tick; whoosh (band-passed noise sweep 260ms) on overlay open/close and section
  cuts; lens hum (quiet sawtooth through low-pass, pitch follows pointer speed) while the x-ray
  is over a surface; a two-note chime when the preloader completes.
- All through one master gain with 120ms ramps; suspend on tab hidden; max -14 dB.

## 9. Typography, colour, chrome

- Display: Archivo Variable (wdth 62–125, wght 100–900), self-hosted latin subset. Name set
  Expanded 125 / 800 at 10–11vw. Body: Geist. Data/labels: Geist Mono. One italic voice:
  Instrument Serif Italic, used in at most three places.
- Colour: front — canvas #0B0B0D, ink #ECE7DD, ink-soft 62%, accent #FF5A2D; light chapter —
  canvas #ECE8E0, ink #111113, accent #D8410F. Back (x-ray) — navy #060C16, cyan #64E0FF.
  Two hues on purpose: ember is the person, cyan is the machine.
- Chrome: fixed minimal nav (wordmark, Work / About / Contact, sound toggle, "Let's talk");
  custom cursor only on fine pointers (dot + ring, becomes the lens indicator and "View"
  label); branded selection, scrollbar, focus rings; grain 4%; no scroll cues, no section
  counters except the works index (which is information there).

## 10. Content

Hero meta: Full Stack Developer · Karachi, Pakistan · Available for work.
Manifesto: "I build websites that earn attention, and the systems that keep them running.
Frontend that moves with intent, backends that hold up in production. One developer, the whole
stack." (v2 line, tightened.)
Works (featured, order): The Female Imperative · Eclipse Neilson · Andrew J. Minuto · A Few
Regrets (Shirley Grispi) · Principal Playbook · Rehome With Heart · Kassandra Clymens-Russo ·
Steve McAlphabet. Archive: William Sargent · The Gold Coin · Gale Reardon · Sam Webster ·
Ritchie Kemp · Stephanie Hill. Per work: title, client/author, type (Author site / Memoir /
Program + LMS), year, stack (HTML · CSS · GSAP · Lenis · … from each repo), live URL.
Experience, education, contact: unchanged from the resume used in v2.

## 11. Approaches considered

A. **Upgrade v2 in place** (keep Bricolage, add a works grid, more GSAP). Cheapest; would not be
   a qualitative leap; no WebGL beyond the portrait. Rejected.
B. **Full 3D scene** (a refractive glass object / 3D type following the cursor, R3F-style). Very
   Lusion; heavy (transmission materials, HDR), fragile on phones, and the object would be
   decoration with no meaning for a developer. Rejected.
C. **DOM-synced WebGL surfaces + x-ray lens (chosen).** Layout and accessibility stay in HTML;
   WebGL paints the images with distortion and the lens; one shader family reused across hero,
   works and about; sound tied to the same inputs. Meaningful ("under the hood"), bespoke, and
   within performance budget. Risk: DOM↔GL sync on resize/pin — mitigated by measuring rects
   per frame only while the stage is active and by a DOM image fallback.

## 12. Decided by the user vs by the builder

User (stated): Awwwards style, Lusion reference, sound, Three.js/WebGL, works from GitHub author
sites (not Stratrix products), images from the live sites, responsive, no issues, smooth/sync.
Builder's calls (correctable): the x-ray concept, Archivo, the two-hue palette, 8+6 works split,
overlay instead of subpages, synthesised sound, section order, no video.

## 14. Research findings applied (agent report, 2026-11-03)

- Lusion v3 (SOTY + Dev SOTY 2023): one canvas behind the DOM, 3D objects travel between DOM
  blocks, framed-card composition keeps type readable, PLAY/MUTE audio opt-in, rolling-digit
  loader, vertical work list (tags + title), "NEXT PROJECT" flow, Bristol footer. Their cursor
  effect is a 2D displacement post-pass; the home-page hero is a physics ball pit.
- Three.js Conf Paris 2026 "Roast My Folio" red flags: fluid simulations as the home page,
  slow loads, too many effects, dense text. → the flow field is demoted to the lens rim only.
- Hon Tran (Awwwards juror): "the same horizontal-scroll gallery everyone shipped tanks the
  Creativity score"; three exceptional case studies beat twelve thumbnails; desktop-only caps
  at an Honorable Mention; a 6-second loader is a usability penalty; 60fps on a $400 phone.
  → works are vertical, overlays carry substance, loader ≤ 2s and does work, mobile parity.
- Osmo/Framer now sell: greeting loaders, number loaders, image-trail cursors, image-preview
  followers, magnetic cursors, marquees, grain, grid overlays, "dynamic current time". → none
  of these as features; the custom cursor exists only as the lens indicator.
- Fresh moves worth borrowing: Stas Bondar's thumbnail→hero GSAP Flip morph and velocity
  displacement; Eloy Benoffi's loader that becomes the nav (ours: loader that draws the
  layout); Minh Pham's shared DOM/WebGL easing preset (expo.out 1.1s, 14% y, start top 82%);
  Rogier de Boevé's "Enter / Enter without sound" gate; reactive audio (Aether 1: filter
  opens with interaction) rather than a static drone.
- Sound rules: AudioContext resumes only inside a click handler; WCAG 1.4.2 requires a pause
  control for anything over 3s; pause on visibilitychange; persist the choice; default off on
  reduced motion and first visit.
- Techniques referenced for implementation: Codrops grid-displacement + RGB shift (GPGPU),
  Codrops dual-scene fluid x-ray reveal (Mar 2026), Maxime Heckel dithering/pixelation and
  refraction notes, Luis Bizarro infinite galleries, Three.js Journey particles-cursor lesson.

## 13. Open questions for the user

1. Live URLs for: The Female Imperative, A Few Regrets, Kassandra, The Gold Coin, Sam Webster,
   Ritchie Kemp (the other eight were read from the repos).
2. OK to switch the display face from Bricolage Grotesque to Archivo? (v2 identity otherwise kept.)
3. Any work to drop/add or reorder?
