// Custom cursor (fine pointers only). It is a state indicator, not decoration:
// it becomes the x-ray lens marker over WebGL surfaces and a "view" label over work.
import { gsap } from './motion.js';
import { $, $$, finePointer, reduceMotion, bus } from './env.js';

export const pointer = { x: -9999, y: -9999, has: false, speed: 0 };
let lastX = 0, lastY = 0, lastT = 0;
window.addEventListener('pointermove', (e) => {
  const now = performance.now();
  if (lastT) {
    const dt = Math.max(8, now - lastT);
    const sp = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt; // px per ms
    pointer.speed += (sp - pointer.speed) * 0.3;
  }
  lastX = e.clientX; lastY = e.clientY; lastT = now;
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true;
}, { passive: true });
window.addEventListener('pointerleave', () => { pointer.has = false; });
document.addEventListener('mouseleave', () => { pointer.has = false; });

export function initCursor() {
  const el = $('#cursor');
  if (!el || !finePointer || reduceMotion) return;
  document.body.classList.add('has-cursor');
  const xTo = gsap.quickTo(el, 'x', { duration: 0.32, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.32, ease: 'power3' });
  const label = $('.cursor-label', el);
  let hidden = true;
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    if (hidden) { hidden = false; el.classList.remove('is-hidden'); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { hidden = true; el.classList.add('is-hidden'); });
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));

  let state = '';
  const setState = (next, text) => {
    if (next === state && (text || '') === label.textContent) return;
    el.classList.remove('is-link', 'has-label', 'is-xray');
    if (next) el.classList.add(next);
    label.textContent = text || '';
    state = next;
    bus.emit('cursor', next);
  };
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const labelled = t.closest('[data-cursor-label]');
    const xray = t.closest('[data-xray]');
    const link = t.closest('a, button, [data-cursor]');
    if (labelled) setState('has-label', labelled.dataset.cursorLabel);
    else if (xray) setState('is-xray', 'x-ray');
    else if (link) setState('is-link');
    else setState('');
  });
  el.classList.add('is-hidden');
}

export function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: true });
    });
  });
}
