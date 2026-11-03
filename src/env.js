// Environment flags and tiny helpers shared by every module.
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => window.matchMedia('(min-width: 880px)').matches;
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
export const clamp = (min, max, v) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

const safe = (storage) => ({
  get(k) { try { return storage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { storage.setItem(k, v); } catch (e) { /* private mode */ } },
});
export const store = safe(window.localStorage);
export const session = safe(window.sessionStorage);

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

// A tiny event bus so modules stay decoupled (sound listens to scroll, cursor, etc.).
const listeners = new Map();
export const bus = {
  on(evt, fn) { (listeners.get(evt) || listeners.set(evt, new Set()).get(evt)).add(fn); return () => listeners.get(evt).delete(fn); },
  emit(evt, data) { const set = listeners.get(evt); if (set) set.forEach((fn) => fn(data)); },
};
