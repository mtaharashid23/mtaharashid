// Lenis smooth scroll wired into the GSAP ticker, plus a normalised velocity bus
// that the hero type, the work planes, the grain and the sound all read from.
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './motion.js';
import { $, $$, clamp, bus, reduceMotion } from './env.js';

export const scroll = {
  lenis: null,
  vel: 0,      // smoothed, roughly -1..1
  velRaw: 0,
  y: 0,
  dir: 1,
  stop() { this.lenis && this.lenis.stop(); },
  start() { this.lenis && this.lenis.start(); },
  to(target, opts = {}) {
    if (this.lenis) this.lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else if (typeof target !== 'number') target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  },
};

export function initScroll() {
  if (reduceMotion) {
    window.addEventListener('scroll', () => { scroll.y = window.scrollY; ScrollTrigger.update(); }, { passive: true });
    bindAnchors();
    return scroll;
  }
  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    smoothWheel: true,
    anchors: false,
  });
  scroll.lenis = lenis;
  lenis.on('scroll', (e) => {
    scroll.velRaw = e.velocity;
    scroll.y = e.scroll;
    scroll.dir = e.direction || scroll.dir;
    ScrollTrigger.update();
  });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.ticker.add(() => {
    scroll.vel += (clamp(-1, 1, scroll.velRaw / 90) - scroll.vel) * 0.12;
    scroll.velRaw *= 0.9; // decay between scroll events
    bus.emit('frame', scroll);
  });
  bindAnchors();
  return scroll;
}

function bindAnchors() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      bus.emit('anchor', id);
      scroll.to(target);
    });
  });
}
