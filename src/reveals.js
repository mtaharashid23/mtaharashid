// Line-masked heading reveals and the generic [data-reveal] batch.
import { gsap, ScrollTrigger, SplitText, REVEAL } from './motion.js';
import { $$, reduceMotion } from './env.js';

export function initReveals() {
  $$('[data-split-lines]').forEach((el) => {
    if (reduceMotion) { el.classList.add('is-split'); return; }
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true, aria: 'auto',
      onSplit(self) {
        el.classList.add('is-split');
        return gsap.from(self.lines, {
          yPercent: 110, duration: 1.2, ease: 'expoOut', stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
  // safety: never leave a title invisible
  setTimeout(() => $$('[data-split-lines]').forEach((el) => el.classList.add('is-split')), 2500);

  if (reduceMotion) { $$('[data-reveal]').forEach((el) => el.classList.add('is-in')); return; }
  ScrollTrigger.batch('[data-reveal]', {
    start: REVEAL.start, once: true,
    onEnter: (els) => els.forEach((el, i) => { el.style.transitionDelay = i * 90 + 'ms'; el.classList.add('is-in'); }),
  });
}
