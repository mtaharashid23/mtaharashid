/* ==========================================================================
   Muhammad Taha Bin Rashid, portfolio
   Vanilla JS + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) + Lenis
   ========================================================================== */
(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('expoOut', '0.16, 1, 0.3, 1');
  CustomEase.create('quartOut', '0.25, 1, 0.5, 1');
  CustomEase.create('expoInOut', '0.87, 0, 0.13, 1');
  gsap.defaults({ ease: 'expoOut', duration: 1 });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = gsap.utils.clamp;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => window.matchMedia('(min-width: 880px)').matches;

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) wired into ScrollTrigger
  ------------------------------------------------------------------ */
  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    smoothWheel: true,
    anchors: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // smoothed scroll velocity, normalised to roughly -1..1
  let velRaw = 0, vel = 0;
  lenis.on('scroll', (e) => { velRaw = e.velocity; });
  gsap.ticker.add(() => {
    vel += (clamp(-1, 1, velRaw / 90) - vel) * 0.12;
    velRaw *= 0.9; // decay between scroll events
  });

  // in-page anchors
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(target, { offset: 0, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  });

  /* ------------------------------------------------------------------
     Split helpers
  ------------------------------------------------------------------ */
  // Split the words of an element into per-character spans (keeps word wrappers).
  function splitChars(root) {
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

  /* ------------------------------------------------------------------
     Signature 1: cursor-proximity variable font axes
     Signature 2: scroll velocity compresses the width axis
  ------------------------------------------------------------------ */
  const proximityFields = [];

  function proximityType(chars, opts) {
    const o = Object.assign({ radius: 220, wghtBase: 700, wghtNear: 250, wdthBase: 100, wdthNear: 76, velocity: true }, opts);
    const state = chars.map((el) => ({ el, cx: 0, cy: 0, wght: o.wghtBase, wdth: o.wdthBase }));
    let active = false;
    const measure = () => {
      state.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        s.cx = r.left + r.width / 2 + window.scrollX;
        s.cy = r.top + r.height / 2 + window.scrollY;
      });
    };
    const field = { measure, o, state, get active() { return active; }, set active(v) { active = v; } };
    proximityFields.push(field);
    return field;
  }

  const pointer = { x: -9999, y: -9999, has: false };
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true; }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.has = false; });

  let idleT = 0;
  gsap.ticker.add((t, dt) => {
    idleT += dt / 1000;
    const vAbs = Math.abs(vel);
    proximityFields.forEach((f) => {
      if (!f.active) return;
      const px = pointer.x + window.scrollX, py = pointer.y + window.scrollY;
      const velWdth = f.o.velocity ? f.o.wdthBase - vAbs * 22 : f.o.wdthBase;
      f.state.forEach((s, i) => {
        let tw = f.o.wghtBase, td = velWdth;
        if (finePointer && pointer.has) {
          const d = Math.hypot(px - s.cx, py - s.cy);
          const k = clamp(0, 1, 1 - d / f.o.radius);
          const e = k * k * (3 - 2 * k); // smoothstep
          tw = f.o.wghtBase + (f.o.wghtNear - f.o.wghtBase) * e;
          td = Math.min(td, f.o.wdthBase + (f.o.wdthNear - f.o.wdthBase) * e);
        } else if (!finePointer) {
          // touch: a slow weight wave travels across the letters
          const e = 0.5 + 0.5 * Math.sin(idleT * 1.6 - i * 0.42);
          tw = f.o.wghtBase + (f.o.wghtNear - f.o.wghtBase) * e * 0.7;
        }
        s.wght += (tw - s.wght) * 0.16;
        s.wdth += (td - s.wdth) * 0.16;
        if (Math.abs(tw - s.wght) > 0.2 || Math.abs(td - s.wdth) > 0.05) {
          s.el.style.setProperty('--wght', s.wght.toFixed(1));
          s.el.style.setProperty('--wdth', s.wdth.toFixed(2));
        }
      });
    });
  });

  /* ------------------------------------------------------------------
     Custom cursor + magnetic
  ------------------------------------------------------------------ */
  const cursorEl = $('#cursor');
  if (finePointer && cursorEl && !reduceMotion) {
    document.body.classList.add('has-cursor');
    const xTo = gsap.quickTo(cursorEl, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursorEl, 'y', { duration: 0.35, ease: 'power3' });
    const label = $('.cursor-label', cursorEl);
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', () => cursorEl.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursorEl.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      const labelled = e.target.closest('[data-cursor-label]');
      const link = e.target.closest('a, button, [data-cursor]');
      if (labelled) { label.textContent = labelled.dataset.cursorLabel; cursorEl.classList.add('has-label'); cursorEl.classList.remove('is-link'); }
      else if (link) { cursorEl.classList.add('is-link'); cursorEl.classList.remove('has-label'); }
      else { cursorEl.classList.remove('is-link', 'has-label'); }
    });
  }

  if (finePointer && !reduceMotion) {
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

  /* ------------------------------------------------------------------
     Nav: active section, hide on scroll down, mobile menu
  ------------------------------------------------------------------ */
  const nav = $('#nav');
  const navLinks = $$('[data-nav]');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    if (menuOpen) return;
    if (scroll > 160 && scroll > lastY + 4) nav.classList.add('is-hidden');
    else if (scroll < lastY - 4 || scroll < 160) nav.classList.remove('is-hidden');
    lastY = scroll;
  });
  $$('main section[id]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: (self) => {
        if (!self.isActive) return;
        navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + sec.id));
      },
    });
  });

  const menu = $('#menu');
  const burger = $('#navBurger');
  let menuOpen = false;
  const menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expoInOut' })
    .to($$('[data-menu-link] span', menu), { y: 0, duration: 1, stagger: 0.07 }, '-=0.45')
    .from($$('.menu-foot > *', menu), { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.7');
  function openMenu() {
    menuOpen = true; menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden'); lenis.stop(); menuTl.timeScale(1).play();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    lenis.start();
    menuTl.timeScale(1.6).reverse().eventCallback('onReverseComplete', () => menu.classList.remove('is-open'));
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------
     Hero: split, choreography, portrait
  ------------------------------------------------------------------ */
  const heroName = $('#heroName');
  const heroChars = splitChars(heroName);
  const heroField = proximityType(heroChars, { radius: Math.max(180, window.innerWidth * 0.16), wghtBase: 700, wghtNear: 220, wdthBase: 100, wdthNear: 75 });

  const contactTitle = $('#contactTitle');
  const contactChars = splitChars(contactTitle);
  const contactField = proximityType(contactChars, { radius: Math.max(220, window.innerWidth * 0.2), wghtBase: 800, wghtNear: 300, wdthBase: 100, wdthNear: 78, velocity: false });

  gsap.set(heroChars, { yPercent: 115 });
  gsap.set($$('[data-hero-meta]'), { yPercent: 110 });
  gsap.set(['[data-hero-intro]', '[data-hero-actions]'], { y: 32, autoAlpha: 0 });
  gsap.set($$('.nav > *'), { y: -14, autoAlpha: 0 });

  function heroIntro() {
    const frame = $('#portraitFrame');
    const img = $('#portraitImg');
    const tl = gsap.timeline({
      defaults: { ease: 'expoOut' },
      onComplete: () => {
        heroField.measure(); heroField.active = true;
        contactField.measure(); contactField.active = true;
        ScrollTrigger.refresh();
      },
    });
    tl.to(heroChars, { yPercent: 0, duration: 1.4, stagger: { each: 0.028, from: 'start' } }, 0)
      .to(frame, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expoOut' }, 0.15)
      .fromTo(img, { scale: 1.22 }, { scale: 1.02, duration: 1.8, ease: 'expoOut' }, 0.15)
      .fromTo('#portraitCanvas', { scale: 1.15 }, { scale: 1, duration: 1.8, ease: 'expoOut' }, 0.15)
      .to($$('[data-hero-meta]'), { yPercent: 0, duration: 1, stagger: 0.1 }, 0.4)
      .to(['[data-hero-intro]', '[data-hero-actions]'], { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12 }, 0.6)
      .to($$('.nav > *'), { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06 }, 0.7);
    return tl;
  }

  // portrait drifts on scroll, name stays legible
  if (!reduceMotion) {
    gsap.to('#heroPortrait', {
      yPercent: 22, scale: 0.94, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-foot', {
      autoAlpha: 0, y: -30, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '60% top', end: 'bottom top', scrub: true },
    });
  }

  /* ------------------------------------------------------------------
     Loader
  ------------------------------------------------------------------ */
  const loader = $('#loader');
  const seen = sessionStorage.getItem('mtbr-seen');
  lenis.stop();

  function runLoader() {
    const count = $('#loaderCount span');
    const fill = $('#loaderFill');
    const n = { v: 0 };
    const quick = !!seen;
    const tl = gsap.timeline({
      onComplete: () => { loader.remove(); lenis.start(); sessionStorage.setItem('mtbr-seen', '1'); },
    });
    tl.to(n, { v: 100, duration: quick ? 0.6 : 1.5, ease: 'power3.inOut', onUpdate: () => { count.textContent = Math.round(n.v); } }, 0)
      .to(fill, { scaleX: 1, duration: quick ? 0.6 : 1.5, ease: 'power3.inOut' }, 0)
      .to($$('.loader-meta > *'), { yPercent: -110, autoAlpha: 0, duration: 0.6, stagger: 0.05, ease: 'power3.in' }, quick ? 0.35 : 1.25)
      .to('#loaderCount', { yPercent: -60, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, quick ? 0.4 : 1.35)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'expoInOut' }, quick ? 0.55 : 1.55)
      .add(heroIntro(), '-=0.55');
  }

  if (reduceMotion) {
    loader.remove(); lenis.start();
    gsap.set([heroChars, '[data-hero-meta]', '[data-hero-intro]', '[data-hero-actions]', '.nav > *'], { clearProps: 'all' });
    gsap.set('#portraitFrame', { clipPath: 'none' });
    heroField.measure(); contactField.measure();
    heroField.active = contactField.active = false;
  } else {
    document.fonts.ready.then(runLoader);
  }

  /* ------------------------------------------------------------------
     Manifesto: words fill in as you scroll (pinned)
  ------------------------------------------------------------------ */
  const manifesto = $('#manifestoText');
  const manifestoWords = [];
  (function wrapWords(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'mw'; s.textContent = tok;
          frag.appendChild(s); manifestoWords.push(s);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) wrapWords(child);
    });
  })(manifesto);

  if (!reduceMotion) {
    let lastOn = -1;
    ScrollTrigger.create({
      trigger: '#manifesto', start: 'top top', end: '+=130%', pin: '.manifesto-pin', pinSpacing: true, scrub: true,
      onUpdate: (self) => {
        const on = Math.floor(gsap.utils.mapRange(0.06, 0.9, 0, manifestoWords.length, self.progress));
        if (on === lastOn) return;
        manifestoWords.forEach((w, i) => w.classList.toggle('is-on', i < on));
        lastOn = on;
      },
    });
    gsap.from('.manifesto .eyebrow', { autoAlpha: 0, x: -20, duration: 1, scrollTrigger: { trigger: '#manifesto', start: 'top 60%', once: true } });
  } else {
    manifestoWords.forEach((w) => w.classList.add('is-on'));
  }

  /* ------------------------------------------------------------------
     Line-masked title reveals + generic reveals
  ------------------------------------------------------------------ */
  document.fonts.ready.then(() => {
    $$('[data-split-lines]').forEach((el) => {
      if (reduceMotion) { el.classList.add('is-split'); return; }
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
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
  });

  if (!reduceMotion) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => els.forEach((el, i) => { el.style.transitionDelay = i * 90 + 'ms'; el.classList.add('is-in'); }),
    });
  } else {
    $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  }

  /* ------------------------------------------------------------------
     Capabilities rows
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    gsap.from('[data-cap]', {
      autoAlpha: 0, y: 48, duration: 1.2, stagger: 0.1, ease: 'expoOut',
      scrollTrigger: { trigger: '#capsList', start: 'top 82%', once: true },
    });
  }

  /* ------------------------------------------------------------------
     Stack tickers: infinite, speed and skew follow scroll velocity
  ------------------------------------------------------------------ */
  const tickers = $$('[data-ticker]').map((el) => {
    const track = $('.ticker-track', el);
    const html = track.innerHTML;
    // ensure at least ~2.5 viewports of content, in two identical halves
    let copies = 1;
    while (track.scrollWidth * copies < window.innerWidth * 2.5 && copies < 6) copies++;
    track.innerHTML = html.repeat(copies) + html.repeat(copies);
    return { el, track, dir: Number(el.dataset.dir) || 1, pos: 0 };
  });
  if (!reduceMotion && tickers.length) {
    let skew = 0;
    let visible = false;
    ScrollTrigger.create({ trigger: '#stack', start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
    let flow = 1; // eases between 1 (scrolling down / idle) and -1 (scrolling up)
    gsap.ticker.add((t, dt) => {
      if (!visible) return;
      const f = dt / 16.7;
      flow += ((vel < -0.03 ? -1 : 1) - flow) * 0.06 * f;
      const speed = (0.06 + Math.abs(vel) * 0.45) * f * flow; // percent of one half per frame
      skew += (-vel * 9 - skew) * 0.1 * f;
      tickers.forEach((tk) => {
        tk.pos = (tk.pos + speed * tk.dir + 100) % 100;
        // track = two identical halves; one half = 50% of track width
        gsap.set(tk.track, { xPercent: tk.dir === 1 ? -tk.pos / 2 : -50 + tk.pos / 2 });
      });
      gsap.set(tickers.map((tk) => tk.el), { skewX: skew });
    });
    tickers.forEach((tk) => gsap.set(tk.track, { xPercent: tk.dir === 1 ? 0 : -50 }));
  }

  /* ------------------------------------------------------------------
     Experience: pinned horizontal rail on desktop, vertical on mobile
  ------------------------------------------------------------------ */
  const jobs = $$('[data-job]');
  jobs[0] && jobs[0].classList.add('is-current');

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 880px) and (prefers-reduced-motion: no-preference)', mobile: '(max-width: 879px) and (prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    if (desktop) {
      const track = $('#railTrack');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const railTween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#experience', pin: '#expPin', start: 'top top',
          end: () => '+=' + (dist() + window.innerHeight * 0.25),
          scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => gsap.set('#railProgress', { scaleX: self.progress }),
        },
      });
      jobs.forEach((job) => {
        gsap.fromTo($('.job-year', job), { xPercent: 26 }, {
          xPercent: -10, ease: 'none',
          scrollTrigger: { containerAnimation: railTween, trigger: job, start: 'left right', end: 'right left', scrub: true },
        });
        gsap.from($$('.job-body > *', job), {
          autoAlpha: 0, y: 26, duration: 1, stagger: 0.07,
          scrollTrigger: { containerAnimation: railTween, trigger: job, start: 'left 85%', once: true },
        });
      });
    } else {
      jobs.forEach((job) => {
        gsap.from(job, { autoAlpha: 0, y: 40, duration: 1.1, scrollTrigger: { trigger: job, start: 'top 88%', once: true } });
      });
    }
  });

  /* ------------------------------------------------------------------
     About photo: clip reveal + inner drift
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    const photo = $('.about-photo');
    gsap.to(photo, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expoOut', scrollTrigger: { trigger: photo, start: 'top 80%', once: true } });
    gsap.fromTo($('img', photo), { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ------------------------------------------------------------------
     Contact: letters rise in, then respond to the cursor
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    gsap.from(contactChars, {
      yPercent: 110, duration: 1.4, stagger: 0.035, ease: 'expoOut',
      scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true, onEnter: () => setTimeout(() => contactField.measure(), 1600) },
    });
  }

  /* ------------------------------------------------------------------
     Karachi clock
  ------------------------------------------------------------------ */
  const timeEl = $('#localTime');
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { timeEl.textContent = fmt.format(new Date()) + ' PKT'; };
    tick(); setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     Resize: re-measure proximity fields, refresh triggers
  ------------------------------------------------------------------ */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      ScrollTrigger.refresh();
      proximityFields.forEach((f) => f.measure());
    }, 220);
  });
  ScrollTrigger.addEventListener('refresh', () => proximityFields.forEach((f) => f.measure()));
})();
