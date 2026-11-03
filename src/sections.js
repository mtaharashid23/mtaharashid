// Section behaviours that are not the WebGL stages: manifesto word fill,
// the record's parallax years, the Karachi clock with the visitor's offset.
import { gsap, ScrollTrigger } from './motion.js';
import { $, $$, reduceMotion, isDesktop, bus } from './env.js';
import { sound } from './sound.js';

function wrapWords(node, out) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 3) {
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'mw'; s.textContent = tok;
        frag.appendChild(s); out.push(s);
      });
      node.replaceChild(frag, child);
    } else if (child.nodeType === 1) wrapWords(child, out);
  });
}

export function initManifesto() {
  const text = $('#manifestoText');
  if (!text) return;
  const words = [];
  wrapWords(text, words);
  if (reduceMotion) { words.forEach((w) => w.classList.add('is-on')); return; }
  let lastOn = -1;
  ScrollTrigger.create({
    trigger: '#manifesto', start: 'top top', end: '+=120%', pin: '.manifesto-pin', pinSpacing: true, scrub: true,
    onUpdate: (self) => {
      const on = Math.floor(gsap.utils.mapRange(0.05, 0.88, 0, words.length, self.progress));
      if (on === lastOn) return;
      words.forEach((w, i) => w.classList.toggle('is-on', i < on));
      lastOn = on;
    },
  });
}

export function initRecord() {
  $$('[data-job]')[0]?.classList.add('is-current');
  if (reduceMotion) return;
  $$('[data-job]').forEach((job) => {
    gsap.fromTo($('.job-year', job), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: job, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from($$('.job-body > *', job), { autoAlpha: 0, y: 22, duration: 1, stagger: 0.07, scrollTrigger: { trigger: job, start: 'top 86%', once: true } });
    // the year fills in while its row is the one in the middle of the screen
    ScrollTrigger.create({ trigger: job, start: 'top 62%', end: 'bottom 38%', toggleClass: { targets: job, className: 'is-focus' } });
  });
}

export function initClock() {
  const timeEl = $('#localTime');
  const diffEl = $('#timeDiff');
  if (!timeEl) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { timeEl.textContent = fmt.format(new Date()) + ' PKT'; };
  tick(); setInterval(tick, 15000);
  if (diffEl) {
    const visitorEast = -new Date().getTimezoneOffset(); // minutes east of UTC
    const diff = 300 - visitorEast; // Karachi is UTC+5, no DST
    const h = Math.floor(Math.abs(diff) / 60), m = Math.abs(diff) % 60;
    const span = m ? `${h}h ${m}m` : `${h}h`;
    diffEl.textContent = diff === 0 ? 'Same time as you' : `${span} ${diff > 0 ? 'ahead of' : 'behind'} you`;
  }
}

export function initContact() {
  if (reduceMotion) return;
  gsap.from('#contactTitle .ch', {
    yPercent: 110, duration: 1.4, stagger: 0.035, ease: 'expoOut',
    scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true },
  });
}

// Front / Back: two columns held apart by a divider, resolved by scroll into one line.
export function initStack() {
  const pin = $('#stackPin');
  if (!pin) return;
  const front = $('.stack-col--front'), back = $('.stack-col--back');
  const items = [...$$('.stack-col--front .stack-list li'), ...$$('.stack-col--back .stack-list li')];
  const notes = $$('.stack-note');
  const divider = $('#stackDivider');
  const label = $('.stack-divider-label');
  const resolve = $('#stackResolve');
  const titles = $$('.stack-title');
  if (reduceMotion || !isDesktop()) {
    gsap.set([items, notes, resolve, titles], { clearProps: 'all' });
    if (!reduceMotion) {
      gsap.from(items, { yPercent: 110, duration: 1, stagger: 0.05, scrollTrigger: { trigger: pin, start: 'top 75%', once: true } });
      gsap.from(resolve, { autoAlpha: 0, y: 24, duration: 1, scrollTrigger: { trigger: resolve, start: 'top 90%', once: true } });
    }
    return;
  }
  // wrap list items so they can rise out of a mask
  items.forEach((li) => { const s = document.createElement('span'); s.className = 'stack-item'; s.textContent = li.textContent; li.textContent = ''; li.appendChild(s); });
  const spans = $$('.stack-item');
  gsap.set(spans, { yPercent: 115 });
  gsap.set(resolve, { autoAlpha: 0, y: 40 });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#stack', start: 'top top', end: '+=190%', pin, pinSpacing: true, scrub: 0.6, anticipatePin: 1 },
    defaults: { ease: 'none' },
  });
  // 0 → 0.3: both sides fill in, alternating
  const order = [];
  const fl = $$('.stack-col--front .stack-item'), bl = $$('.stack-col--back .stack-item');
  for (let i = 0; i < Math.max(fl.length, bl.length); i++) { if (fl[i]) order.push(fl[i]); if (bl[i]) order.push(bl[i]); }
  // where the titles must travel so they meet in the middle of the stage
  const meet = () => {
    const pr = pin.getBoundingClientRect();
    return titles.map((t) => {
      const r = t.getBoundingClientRect();
      return { x: pr.left + pr.width / 2 - (r.left + r.width / 2), y: pr.top + pr.height / 2 - (r.top + r.height / 2) };
    });
  };
  tl.to(order, { yPercent: 0, duration: 0.26, stagger: 0.018, ease: 'power2.out' }, 0)
    // the sides let go of their lists and the two words travel to the centre
    .to([...spans, ...notes], { autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, 0.42)
    .to(label, { autoAlpha: 0, duration: 0.08 }, 0.42)
    .to(divider, { scaleY: 0, transformOrigin: '50% 50%', duration: 0.22, ease: 'power2.inOut' }, 0.46)
    .to(titles[0], { x: () => meet()[0].x * 0.92, y: () => meet()[0].y, duration: 0.3, ease: 'power2.inOut' }, 0.48)
    .to(titles[1], { x: () => meet()[1].x * 0.92, y: () => meet()[1].y, duration: 0.3, ease: 'power2.inOut' }, 0.48)
    // they meet, go quiet behind the one line
    .to(titles, { autoAlpha: 0.1, duration: 0.14 }, 0.72)
    .to(resolve, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.74)
    .to({}, { duration: 0.1 }, 0.9);
  ScrollTrigger.addEventListener('refreshInit', () => tl.invalidate());
  // a tick when the sides meet
  let met = false;
  ScrollTrigger.create({ trigger: '#stack', start: 'top top', end: '+=190%', onUpdate: (self) => { const now = self.progress > 0.74; if (now !== met) { met = now; if (now) sound.click(); } } });
}

export function initAbout() {
  const photo = $('#aboutPhoto');
  if (!photo) return;
  const pic = $('picture', photo);
  if (reduceMotion) { bus.emit('about:revealed'); return; }
  gsap.set(pic, { clipPath: 'inset(100% 0 0 0)' });
  gsap.to(pic, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expoOut', scrollTrigger: { trigger: photo, start: 'top 80%', once: true }, onComplete: () => bus.emit('about:revealed') });
}

export function initCopyEmail() {
  const mail = $('.contact-mail');
  if (!mail || !navigator.clipboard) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'copy'; btn.dataset.silent = '1';
  btn.innerHTML = '<span class="copy-a">Copy</span><span class="copy-b">Copied</span>';
  btn.setAttribute('aria-label', 'Copy email address');
  mail.insertAdjacentElement('afterend', btn);
  let t;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('muhammadtahabinrashid@gmail.com'); } catch (e) { return; }
    btn.classList.add('is-copied'); sound.chime();
    clearTimeout(t); t = setTimeout(() => btn.classList.remove('is-copied'), 1800);
  });
}

export function initSections() {
  initManifesto();
  initStack();
  initRecord();
  initAbout();
  initClock();
  initContact();
  initCopyEmail();
}
