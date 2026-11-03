// The site builds itself: the hero's own layout is drafted as a blueprint
// (boxes, labels, dimension lines drawn from the real element rects), then the
// navy ground wipes away and the real elements render into their outlines.
import { gsap } from './motion.js';
import { $, $$, session, reduceMotion } from './env.js';
import { sound } from './sound.js';
import { scroll } from './scroll.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

export function runLoader({ onEnter }) {
  const loader = $('#loader');
  if (!loader) return;

  if (reduceMotion) {
    loader.remove();
    onEnter(false, { instant: true });
    scroll.start();
    return;
  }

  const pref = sound.pref();
  if (session.get('mtbr-seen')) {
    // same-session return: no drafting, a quick render only
    gsap.to(loader, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut', onComplete: () => loader.remove() });
    onEnter(pref === 'on', { quick: true });
    scroll.start();
    return;
  }

  const bg = $('#loaderBg');
  const svg = $('#loaderWire');
  const status = $('#loaderStatus');
  const pct = $('#loaderPct');
  const enter = $('#loaderEnter');
  const W = window.innerWidth, H = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  // while the sheet is up, nothing behind it is reachable by Tab or a screen reader
  const behind = Array.from(document.body.children).filter((el) => el !== loader);
  behind.forEach((el) => { el.inert = true; });

  // column grid
  const gutter = parseFloat(getComputedStyle($('#hero')).paddingLeft) || 32;
  const gridLines = [];
  const cols = 12, inner = W - gutter * 2;
  for (let i = 0; i <= cols; i++) {
    const x = gutter + (inner / cols) * i;
    const l = svgEl('line', { x1: x, y1: 0, x2: x, y2: H, class: 'wire-grid' });
    svg.appendChild(l); gridLines.push(l);
  }

  // boxes from the real hero layout
  const targets = [
    { sel: '#nav', label: 'nav' },
    { sel: '#heroMeta', label: 'meta · mono' },
    { sel: '#heroLine1', label: (r) => `h1 · ${Math.round(r.height * 0.9)}px · wdth ${window.matchMedia('(min-width: 880px)').matches ? 112 : 92}` },
    { sel: '#heroLine2', label: '' },
    { sel: '#portraitFrame', label: 'portrait · 4:5' },
    { sel: '.hero-intro', label: 'p · 40ch' },
    { sel: '.hero-actions', label: 'cta' },
  ];
  const rects = [], labels = [], dims = [], dimLabels = [];
  const union = (nodes) => {
    const rs = nodes.map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0);
    if (!rs.length) return null;
    const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
    const right = Math.max(...rs.map((r) => r.right)), bottom = Math.max(...rs.map((r) => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  targets.forEach((t) => {
    const node = $(t.sel);
    if (!node) return;
    const inner = $$('.w, .hero-meta-line > span', node);
    const r = inner.length ? union(inner) : node.getBoundingClientRect();
    if (!r) return;
    if (r.width < 4 || r.height < 4) return;
    const rect = svgEl('rect', { x: r.left + 0.5, y: r.top + 0.5, width: Math.max(1, r.width - 1), height: Math.max(1, r.height - 1), class: 'wire-box' });
    svg.appendChild(rect); rects.push(rect);
    const text = typeof t.label === 'function' ? t.label(r) : t.label;
    if (text) {
      const lab = svgEl('text', { x: r.left, y: Math.max(12, r.top - 7), class: 'wire-label' });
      lab.textContent = text;
      svg.appendChild(lab); labels.push(lab);
    }
    if (t.sel === '#portraitFrame') {
      // dimension line under the portrait
      const y = r.bottom + 18;
      const d = svgEl('line', { x1: r.left, y1: y, x2: r.right, y2: y, class: 'wire-tick' });
      const t1 = svgEl('line', { x1: r.left, y1: y - 5, x2: r.left, y2: y + 5, class: 'wire-tick' });
      const t2 = svgEl('line', { x1: r.right, y1: y - 5, x2: r.right, y2: y + 5, class: 'wire-tick' });
      svg.append(d, t1, t2); dims.push(d, t1, t2);
      const dl = svgEl('text', { x: r.left + r.width / 2, y: y + 16, class: 'wire-label', 'text-anchor': 'middle' });
      dl.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      svg.appendChild(dl); dimLabels.push(dl);
    }
    if (t.sel === '#heroLine1') {
      // vertical dimension for the name block
      const l2 = union($$('.w', $('#heroLine2')));
      const x = r.left - 14;
      const d = svgEl('line', { x1: x, y1: r.top, x2: x, y2: l2.bottom, class: 'wire-tick' });
      const t1 = svgEl('line', { x1: x - 5, y1: r.top, x2: x + 5, y2: r.top, class: 'wire-tick' });
      const t2 = svgEl('line', { x1: x - 5, y1: l2.bottom, x2: x + 5, y2: l2.bottom, class: 'wire-tick' });
      svg.append(d, t1, t2); dims.push(d, t1, t2);
    }
  });

  // counter + status
  const n = { v: 0 };
  const setPct = () => { pct.textContent = String(Math.round(n.v)).padStart(2, '0'); };
  gsap.from($('#loaderBlock'), { autoAlpha: 0, y: 12, duration: 0.8, ease: 'expoOut' });
  const draw = gsap.timeline();
  draw.from(gridLines, { opacity: 0, duration: 0.6, ease: 'none' }, 0)
    .from(rects, { drawSVG: '0%', duration: 1.0, ease: 'expoInOut', stagger: 0.09 }, 0.1)
    .to(labels, { opacity: 0.9, duration: 0.3, stagger: 0.09 }, 0.6)
    .from(dims, { drawSVG: '50% 50%', duration: 0.7, ease: 'expoOut', stagger: 0.04 }, 1.0)
    .to(dimLabels, { opacity: 0.75, duration: 0.3 }, 1.4)
    .to(n, { v: 90, duration: 1.6, ease: 'power2.inOut', onUpdate: setPct }, 0)
    .call(() => { status.textContent = 'Loading type and portrait'; }, null, 0.8);

  const portrait = $('#portraitImg');
  const ready = Promise.all([
    document.fonts.ready,
    portrait && portrait.decode ? portrait.decode().catch(() => {}) : Promise.resolve(),
    new Promise((r) => draw.eventCallback('onComplete', r)),
  ]);

  let exited = false;
  const exit = (withSound) => {
    if (exited) return; exited = true;
    clearTimeout(autoTimer);
    if (withSound) { sound.enable(); sound.chime(); } else sound.disable();
    loader.style.pointerEvents = 'none';
    loader.inert = true;
    behind.forEach((el) => { el.inert = false; });
    const tl = gsap.timeline({ onComplete: () => { loader.remove(); } });
    tl.to($('#loaderBlock'), { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0)
      .to(bg, { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'expoInOut' }, 0.1)
      .to(gridLines, { opacity: 0, duration: 0.5 }, 0.1)
      .add(() => { scroll.start(); }, 1.15)
      .to([...rects, ...labels, ...dims, ...dimLabels], { opacity: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.03 }, 1.0);
    onEnter(withSound, { quick: false, at: tl, offset: 0.45 });
    session.set('mtbr-seen', '1');
  };

  let autoTimer = 0;
  ready.then(() => {
    gsap.to(n, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: setPct });
    status.textContent = 'Ready';
    if (pref === null) {
      enter.classList.add('is-ready');
      gsap.fromTo(enter, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8 });
      // the buttons are visible from the first tick of that tween; focus once they are
      gsap.delayedCall(0.1, () => $('#enterSound').focus({ preventScroll: true }));
      autoTimer = setTimeout(() => exit(false), 9000);
    } else {
      setTimeout(() => exit(pref === 'on'), 250);
    }
  });

  $('#enterSound').addEventListener('click', () => exit(true));
  $('#enterQuiet').addEventListener('click', () => exit(false));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !exited) exit(false); });
}
