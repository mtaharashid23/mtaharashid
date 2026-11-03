// Works: hover states, the archive slot, and the case overlay with a Flip
// morph from the clicked plane into the case hero.
import { gsap, Flip } from './motion.js';
import { $, $$, reduceMotion, finePointer, bus, isDesktop } from './env.js';
import { scroll } from './scroll.js';
import { sound } from './sound.js';
import { WORKS, bySlug, FEATURED } from '../data/works.js';

const img = (slug, v) => `img/work/${slug}-${v}.webp`;

export function initWorks() {
  // --- list hover --------------------------------------------------------
  $$('.work-item').forEach((item) => {
    const media = $('.work-media', item);
    media.setAttribute('data-cursor-label', 'Open');
    item.addEventListener('pointerenter', () => item.classList.add('is-hover'));
    item.addEventListener('pointerleave', () => item.classList.remove('is-hover'));
    media.addEventListener('click', () => openCase(item.dataset.work, media));
  });
  $$('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
    const item = btn.closest('.work-item');
    openCase(btn.dataset.open, item ? $('.work-media', item) : null);
  }));

  // --- archive slot -------------------------------------------------------
  const slot = $('#archiveSlot');
  const slotImg = $('#archiveSlotImg');
  let slotBp = null;
  if (slot) {
    slotBp = document.createElement('img');
    slotBp.className = 'archive-slot-bp'; slotBp.alt = ''; slotBp.width = 1000; slotBp.height = 625;
    slot.prepend(slotBp);
    let hideT;
    $$('.archive-row').forEach((row) => {
      const show = () => {
        clearTimeout(hideT);
        const slug = row.dataset.thumb;
        if (slot.dataset.slug !== slug) {
          slot.dataset.slug = slug;
          slotBp.src = img(slug, 'bp-1000');
          slotImg.src = img(slug, '1000');
          slot.classList.remove('is-rendered');
          // blueprint first, then the render lands
          clearTimeout(slot._renderT);
          slot._renderT = setTimeout(() => slot.classList.add('is-rendered'), 260);
        }
        slot.classList.add('is-on');
      };
      row.addEventListener('pointerenter', show);
      row.addEventListener('focus', show);
      row.addEventListener('pointerleave', () => { hideT = setTimeout(() => slot.classList.remove('is-on'), 120); });
      row.addEventListener('blur', () => slot.classList.remove('is-on'));
    });
  }

  // --- case overlay -------------------------------------------------------
  const overlay = $('#case');
  if (!overlay) return;
  const els = {
    idx: $('#caseIdx'), title: $('#caseTitle'), meta: $('#caseMeta'), hero: $('#caseHero'), heroImg: $('#caseHeroImg'),
    facts: $('#caseFacts'), blurb: $('#caseBlurb'), link: $('#caseLink'), second: $('#caseSecondImg'), mobile: $('#caseMobileImg'),
    next: $('#caseNext'), nextTitle: $('#caseNextTitle'), close: $('#caseClose'), scrollEl: $('#caseScroll'),
  };
  let open = false, current = null, lastFocus = null, sourceMedia = null;
  overlay.tabIndex = -1;
  const setInert = (on) => Array.from(document.body.children).forEach((el) => { if (el !== overlay) el.inert = on; });

  const fill = (work) => {
    const list = WORKS;
    const i = list.indexOf(work);
    els.idx.textContent = `${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    els.title.textContent = work.title;
    els.meta.textContent = `${work.type} · ${work.client} · ${work.year}`;
    els.heroImg.src = img(work.slug, '1600');
    els.heroImg.alt = `${work.title}, homepage`;
    els.second.src = img(work.slug, '2-1000');
    els.second.alt = `${work.title}, further down the page`;
    els.mobile.src = img(work.slug, 'm-585');
    els.mobile.alt = `${work.title} on a phone`;
    els.blurb.textContent = work.blurb;
    els.facts.innerHTML = [
      ['Role', work.role], ['Type', work.type], ['Year', work.year], ['Pages', String(work.pages)], ['Stack', work.stack.join(' · ')],
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    els.link.href = work.url || '#';
    els.link.style.display = work.url ? '' : 'none';
    const next = list[(i + 1) % list.length];
    els.nextTitle.textContent = next.title;
    els.next.dataset.next = next.slug;
    els.scrollEl.scrollTop = 0;
  };

  const openCase = (slug, media) => {
    const work = bySlug(slug);
    if (!work || open) return;
    open = true; current = work; sourceMedia = media;
    lastFocus = document.activeElement && document.activeElement.classList.contains('work-media') ? $('.work-open', document.activeElement.closest('.work-item')) : document.activeElement;
    fill(work);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    // the dialog takes focus at once; the page behind it is inert until it closes
    setInert(true);
    overlay.focus({ preventScroll: true });
    scroll.stop();
    document.documentElement.classList.add('case-open');
    sound.open();
    bus.emit('case', true);
    const parts = [$('.case-bar', overlay), $('.case-head', overlay), $('.case-grid', overlay), $('.case-shots', overlay), els.next];
    const bg = $('.case-bg', overlay);
    gsap.set(els.hero, { clearProps: 'transform' });
    if (reduceMotion || !media) {
      gsap.set(bg, { autoAlpha: 1 });
      gsap.set(parts, { autoAlpha: 1, y: 0 });
      els.close.focus();
      return;
    }
    const tl = gsap.timeline({ onComplete: () => els.close.focus() });
    tl.set(bg, { autoAlpha: 0 })
      .set(parts, { autoAlpha: 0, y: 24 })
      .add(() => {
        // morph: fit the case hero onto the clicked plane, then let it travel home
        const state = Flip.getState(els.hero);
        Flip.fit(els.hero, media, { scale: true, duration: 0 });
        Flip.to(state, { duration: 1.15, ease: 'expoInOut', scale: true });
      }, 0)
      .to(bg, { autoAlpha: 1, duration: 0.7, ease: 'power2.inOut' }, 0.05)
      .to(parts, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.5);
  };

  const closeCase = () => {
    if (!open) return;
    open = false;
    overlay.setAttribute('aria-hidden', 'true');
    setInert(false);
    document.documentElement.classList.remove('case-open');
    sound.close();
    bus.emit('case', false);
    const finish = () => { overlay.classList.remove('is-open'); scroll.start(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
    const bg = $('.case-bg', overlay);
    const parts = [$('.case-bar', overlay), $('.case-head', overlay), $('.case-grid', overlay), $('.case-shots', overlay), els.next];
    if (reduceMotion) { finish(); return; }
    const tl = gsap.timeline({ onComplete: finish });
    const r = sourceMedia && sourceMedia.getBoundingClientRect();
    const visible = r && r.bottom > 0 && r.top < window.innerHeight && els.scrollEl.scrollTop < 80;
    tl.to(parts, { autoAlpha: 0, y: 16, duration: 0.35, ease: 'power2.in', stagger: 0.02 }, 0);
    if (visible) tl.add(Flip.fit(els.hero, sourceMedia, { scale: true, duration: 0.85, ease: 'expoInOut' }), 0.1);
    else tl.to(els.hero, { autoAlpha: 0, y: 24, duration: 0.4, ease: 'power2.in' }, 0.1);
    tl.to(bg, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, visible ? 0.45 : 0.2)
      .set(els.hero, { clearProps: 'transform,opacity,visibility' });
  };

  els.close.addEventListener('click', closeCase);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) closeCase(); });
  els.next.addEventListener('click', () => {
    const next = bySlug(els.next.dataset.next);
    if (!next) return;
    const parts = [$('.case-head', overlay), $('.case-grid', overlay), $('.case-shots', overlay), els.next];
    gsap.timeline()
      .to([...parts, els.hero], { autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in', stagger: 0.03 })
      .add(() => { current = next; sourceMedia = null; fill(next); els.scrollEl.scrollTo({ top: 0 }); })
      .fromTo([els.hero, ...parts], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07 });
    sound.whoosh();
  });
  // focus trap: Tab cycles inside the dialog, even while its controls are still fading in
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href]', overlay).filter((el) => !el.hidden && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1];
    const a = document.activeElement;
    if (a === overlay || !overlay.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
}
