// Entry: boot order matters. Scroll is stopped until the loader lets go.
import { reduceMotion, supportsWebGL, $$ } from './env.js';
import { gsap, ScrollTrigger } from './motion.js';
import { initScroll, scroll } from './scroll.js';
import { initCursor, initMagnetic } from './cursor.js';
import { initSound } from './sound.js';
import { initNav } from './nav.js';
import { initHero, heroIntro, measureFields } from './hero.js';
import { runLoader } from './preloader.js';
import { initReveals } from './reveals.js';
import { initSections } from './sections.js';
import { initWorks } from './works.js';

const initSoundRef = initSound();
initScroll();
scroll.stop();
initCursor();
initMagnetic();
const hero = initHero();
let heroStage = null, worksStage = null, aboutStage = null, introDone = false;
window.__mtbr = { hero, ScrollTrigger, scroll, sound: initSoundRef, get heroStage() { return heroStage; }, get worksStage() { return worksStage; }, get aboutStage() { return aboutStage; } };

// ScrollTriggers are created in document order so pin spacing is accounted for correctly.
document.fonts.ready.then(() => {
  initSections();      // manifesto pin first (it pushes everything below it)
  initReveals();
  initNav();
  initWorks();
  ScrollTrigger.refresh();
  runLoader({
    onEnter(withSound, { quick = false, instant = false, at = null, offset = 0 } = {}) {
      if (instant) { introDone = true; hero.activate(); heroStage && heroStage.enable(); ScrollTrigger.refresh(); return null; }
      const tl = heroIntro({ quick });
      tl.eventCallback('onComplete', () => { introDone = true; hero.activate(); heroStage && heroStage.enable(); ScrollTrigger.refresh(); });
      if (at) at.add(tl, offset);
      return tl;
    },
  });
  // the WebGL layer arrives as its own chunk; the DOM images stand in until then
  if (!reduceMotion && supportsWebGL()) {
    import('./gl/index.js').then((m) => {
      if (!m.initGL()) return;
      heroStage = m.createHeroStage();
      worksStage = m.createWorksStage();
      aboutStage = m.createAboutStage();
      if (introDone && heroStage) heroStage.enable();
    }).catch(() => { /* DOM fallback */ });
  }
});
window.addEventListener('load', () => ScrollTrigger.refresh());

let rt;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { ScrollTrigger.refresh(); measureFields(); }, 220);
});
ScrollTrigger.addEventListener('refresh', measureFields);
if (reduceMotion) $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
