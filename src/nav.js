// Nav: hide on scroll down, active section, light/dark chrome, mobile menu, sound toggle.
import { gsap, ScrollTrigger } from './motion.js';
import { $, $$, bus, reduceMotion } from './env.js';
import { scroll } from './scroll.js';
import { sound } from './sound.js';

export function initNav() {
  const nav = $('#nav');
  const links = $$('[data-nav]');
  const html = document.documentElement;
  let lastY = 0;
  let menuOpen = false;

  bus.on('frame', ({ y }) => {
    if (menuOpen) return;
    if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
    lastY = y;
  });
  if (reduceMotion) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
      lastY = y;
    }, { passive: true });
  }

  // active link + chrome theme follow the section under the nav
  $$('main section[id]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 48px', end: 'bottom 48px',
      onToggle: (self) => {
        if (!self.isActive) return;
        html.classList.toggle('is-light', sec.dataset.theme === 'light');
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + sec.id));
      },
    });
  });

  // the body paints the ground behind transparent GL sections: light while About is in view
  const about = $('#about');
  if (about) ScrollTrigger.create({ trigger: about, start: 'top bottom', end: 'bottom top', onToggle: (self) => html.classList.toggle('page-light', self.isActive) });

  // mobile menu
  const menu = $('#menu');
  const burger = $('#navBurger');
  const menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expoInOut' })
    .to($$('[data-menu-link] span', menu), { y: 0, duration: 1, stagger: 0.07 }, '-=0.45')
    .from($$('.menu-foot > *', menu), { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.7');
  const openMenu = () => {
    menuOpen = true; menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden'); html.classList.remove('is-light'); scroll.stop();
    menuTl.timeScale(1).play(); sound.whoosh();
  };
  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false; menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    scroll.start(); ScrollTrigger.update();
    menuTl.timeScale(1.6).reverse().eventCallback('onReverseComplete', () => menu.classList.remove('is-open'));
  };
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  bus.on('anchor', closeMenu);

  // sound toggle
  const toggle = $('#soundToggle');
  const syncToggle = (on) => {
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    toggle.setAttribute('aria-label', on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
  };
  if (!sound.available) toggle.classList.add('is-unavailable');
  toggle.addEventListener('click', () => { syncToggle(sound.toggle()); });
  bus.on('sound', syncToggle);
  syncToggle(sound.enabled);

  // hover ticks on interactive chrome
  $$('.nav a, .nav button').forEach((el) => el.addEventListener('pointerenter', () => sound.tick()));
}
