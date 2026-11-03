// Hero: per-character variable type that feels the cursor and the scroll, the
// load choreography, and the scroll-out of the portrait.
import { gsap } from './motion.js';
import { $, $$, clamp, finePointer, reduceMotion, bus } from './env.js';
import { scroll } from './scroll.js';
import { pointer } from './cursor.js';

const fields = [];

export function splitChars(root) {
  const chars = [];
  $$('[data-word]', root).forEach((w) => {
    const text = w.textContent;
    w.textContent = '';
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      w.appendChild(s);
      chars.push(s);
    }
  });
  return chars;
}

export function proximityType(chars, opts, twins = null) {
  const o = Object.assign({ radius: 220, wghtBase: 760, wghtNear: 250, wdthBase: 112, wdthNear: 80, velocity: true }, opts);
  const state = chars.map((el, i) => ({ el, twin: twins ? twins[i] : null, cx: 0, cy: 0, wght: o.wghtBase, wdth: o.wdthBase }));
  const field = {
    o, state, active: false,
    measure() {
      state.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        s.cx = r.left + r.width / 2 + window.scrollX;
        s.cy = r.top + r.height / 2 + window.scrollY;
      });
    },
    reset() { state.forEach((s) => { s.el.style.removeProperty('--wght'); s.el.style.removeProperty('--wdth'); }); },
  };
  fields.push(field);
  return field;
}

let idleT = 0;
let ticking = false;
function startTicker() {
  if (ticking) return;
  ticking = true;
  gsap.ticker.add((t, dt) => {
    idleT += dt / 1000;
    const vAbs = Math.abs(scroll.vel);
    fields.forEach((f) => {
      if (!f.active) return;
      const px = pointer.x + window.scrollX, py = pointer.y + window.scrollY;
      const velWdth = f.o.velocity ? f.o.wdthBase - vAbs * 26 : f.o.wdthBase;
      f.state.forEach((s, i) => {
        let tw = f.o.wghtBase, td = velWdth;
        if (finePointer && pointer.has) {
          const d = Math.hypot(px - s.cx, py - s.cy);
          const k = clamp(0, 1, 1 - d / f.o.radius);
          const e = k * k * (3 - 2 * k);
          tw = f.o.wghtBase + (f.o.wghtNear - f.o.wghtBase) * e;
          td = Math.min(td, f.o.wdthBase + (f.o.wdthNear - f.o.wdthBase) * e);
        } else if (!finePointer) {
          const e = 0.5 + 0.5 * Math.sin(idleT * 1.6 - i * 0.42);
          tw = f.o.wghtBase + (f.o.wghtNear - f.o.wghtBase) * e * 0.7;
        }
        s.wght += (tw - s.wght) * 0.16;
        s.wdth += (td - s.wdth) * 0.16;
        if (Math.abs(tw - s.wght) > 0.2 || Math.abs(td - s.wdth) > 0.05) {
          const w = s.wght.toFixed(1), d = s.wdth.toFixed(2);
          s.el.style.setProperty('--wght', w);
          s.el.style.setProperty('--wdth', d);
          if (s.twin) { s.twin.style.setProperty('--wght', w); s.twin.style.setProperty('--wdth', d); }
        }
      });
    });
  });
}

export function measureFields() { fields.forEach((f) => f.measure()); }

export function initHero() {
  const heroName = $('#heroName');
  const chars = splitChars(heroName);
  const mobile = !window.matchMedia('(min-width: 880px)').matches;
  // x-ray twin of the name: navy fill + cyan stroke, masked by the lens
  const xray = heroName.cloneNode(true);
  xray.id = 'heroNameXray';
  xray.classList.add('hero-name--xray');
  xray.setAttribute('aria-hidden', 'true');
  $$('[id]', xray).forEach((n) => n.removeAttribute('id'));
  heroName.after(xray);
  const twins = $$('.ch', xray);
  const field = proximityType(chars, {
    radius: Math.max(180, window.innerWidth * 0.16),
    wghtBase: 760, wghtNear: 220, wdthBase: mobile ? 92 : 112, wdthNear: mobile ? 70 : 78,
  }, twins);

  const contactTitle = $('#contactTitle');
  const contactChars = splitChars(contactTitle);
  const contactField = proximityType(contactChars, { radius: Math.max(220, window.innerWidth * 0.2), wghtBase: 800, wghtNear: 300, wdthBase: 118, wdthNear: 84, velocity: false });

  if (!reduceMotion) {
    gsap.set(chars, { yPercent: 115 });
    gsap.set($$('[data-hero-meta]'), { yPercent: 110 });
    gsap.set(['[data-hero-intro]', '[data-hero-actions]'], { y: 32, autoAlpha: 0 });
    gsap.set($$('.nav > *'), { y: -14, autoAlpha: 0 });
    // portrait drifts, foot fades
    gsap.to('#heroPortrait', { yPercent: 18, scale: 0.95, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('#heroFoot', { autoAlpha: 0, y: -24, ease: 'none', scrollTrigger: { trigger: '#hero', start: '55% top', end: 'bottom top', scrub: true } });
    gsap.to(['#heroName', '#heroNameXray'], { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  } else {
    field.measure(); contactField.measure();
  }

  window.addEventListener('resize', () => { field.measure(); contactField.measure(); });

  // lens mask position on the twin (set per frame by the hero stage)
  const setLens = (x, y, r, strength) => {
    const rect = xray.getBoundingClientRect();
    xray.style.setProperty('--lx', (x - rect.left).toFixed(1) + 'px');
    xray.style.setProperty('--ly', (y - rect.top).toFixed(1) + 'px');
    xray.style.setProperty('--lo', strength.toFixed(3));
  };
  bus.on('lens', (l) => { if (xray.classList.contains('is-on')) setLens(l.x, l.y, l.r, l.strength); });

  return {
    chars, contactChars, field, contactField, xray,
    activate() {
      field.measure(); field.active = true;
      contactField.measure(); contactField.active = true;
      xray.classList.add('is-on');
      startTicker();
    },
  };
}

// Load choreography. Returns the timeline so the loader can overlap it.
export function heroIntro({ quick = false } = {}) {
  const chars = $$('#heroName .ch');
  const frame = $('#portraitFrame');
  const img = $('#portraitImg');
  const k = quick ? 0.6 : 1;
  const tl = gsap.timeline({ defaults: { ease: 'expoOut' } });
  tl.to(chars, { yPercent: 0, duration: 1.4 * k, stagger: { each: 0.028 * k, from: 'start' } }, 0)
    .to(frame, { clipPath: 'inset(0% 0 0 0)', duration: 1.5 * k, ease: 'expoOut' }, 0.15 * k)
    .fromTo(img, { scale: 1.22 }, { scale: 1, duration: 1.8 * k, ease: 'expoOut' }, 0.15 * k)
    .to($$('[data-hero-meta]'), { yPercent: 0, duration: 1 * k, stagger: 0.1 * k }, 0.4 * k)
    .to(['[data-hero-intro]', '[data-hero-actions]'], { y: 0, autoAlpha: 1, duration: 1.1 * k, stagger: 0.12 * k }, 0.6 * k)
    .to($$('.nav > *'), { y: 0, autoAlpha: 1, duration: 0.9 * k, stagger: 0.06 * k }, 0.7 * k);
  bus.emit('hero:intro', tl);
  return tl;
}
