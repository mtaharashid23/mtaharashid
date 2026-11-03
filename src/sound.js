// Sound: synthesised with the Web Audio API, no files. Opt-in, created inside a
// user gesture, paused when the tab hides, and reactive: the ambient bed opens
// with scroll velocity, the lens hums with pointer speed, UI gets ticks.
import { store, bus, reduceMotion, clamp } from './env.js';

const KEY = 'mtbr-sound';
const AC = window.AudioContext || window.webkitAudioContext;

let ctx = null, master = null, noiseBuf = null;
let amb = null, hum = null;
let lastTick = 0;

const now = () => ctx.currentTime;
const target = (param, v, tc = 0.08) => param.setTargetAtTime(v, now(), tc);

function makeNoise() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) { // pinkish
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
  }
  return buf;
}

function createContext() {
  ctx = new AC({ latencyHint: 'interactive' });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  master = ctx.createGain(); master.gain.value = 0;
  master.connect(comp).connect(ctx.destination);
  noiseBuf = makeNoise();

  // ambient bed: two detuned triangles + a soft noise wash through one low-pass
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 300; filter.Q.value = 0.8;
  const bed = ctx.createGain(); bed.gain.value = 0;
  filter.connect(bed).connect(master);
  const oscA = ctx.createOscillator(); oscA.type = 'triangle'; oscA.frequency.value = 110;
  const oscB = ctx.createOscillator(); oscB.type = 'triangle'; oscB.frequency.value = 110.6;
  const oscC = ctx.createOscillator(); oscC.type = 'sine'; oscC.frequency.value = 220;
  const gA = ctx.createGain(); gA.gain.value = 0.22; const gB = ctx.createGain(); gB.gain.value = 0.22; const gC = ctx.createGain(); gC.gain.value = 0.08;
  oscA.connect(gA).connect(filter); oscB.connect(gB).connect(filter); oscC.connect(gC).connect(filter);
  const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
  const nFilter = ctx.createBiquadFilter(); nFilter.type = 'bandpass'; nFilter.frequency.value = 420; nFilter.Q.value = 0.6;
  const nGain = ctx.createGain(); nGain.gain.value = 0.12;
  noise.connect(nFilter).connect(nGain).connect(filter);
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain).connect(bed.gain);
  [oscA, oscB, oscC, noise, lfo].forEach((n) => n.start());
  amb = { filter, bed, nGain, level: 0.2 };

  // lens hum: a quiet sawtooth that follows pointer speed while the x-ray is on
  const hOsc = ctx.createOscillator(); hOsc.type = 'sawtooth'; hOsc.frequency.value = 55;
  const hFilter = ctx.createBiquadFilter(); hFilter.type = 'lowpass'; hFilter.frequency.value = 160; hFilter.Q.value = 2;
  const hGain = ctx.createGain(); hGain.gain.value = 0;
  hOsc.connect(hFilter).connect(hGain).connect(master);
  hOsc.start();
  hum = { osc: hOsc, filter: hFilter, gain: hGain };
}

function blip(f0, f1, dur, vol, type = 'sine') {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, now());
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now() + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now());
  g.gain.exponentialRampToValueAtTime(vol, now() + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now() + dur);
  o.connect(g).connect(master); o.start(); o.stop(now() + dur + 0.02);
}
function burst(dur, vol, f = 1800, type = 'highpass', sweepTo = null) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now()); fl.Q.value = 0.9;
  if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, now() + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now());
  g.gain.exponentialRampToValueAtTime(vol, now() + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, now() + dur);
  src.connect(fl).connect(g).connect(master); src.start(); src.stop(now() + dur + 0.05);
}

export const sound = {
  enabled: false,
  available: !!AC,
  pref() { return store.get(KEY); },
  enable() {
    if (!this.available) return false;
    try {
      if (!ctx) createContext();
      if (ctx.state !== 'running') ctx.resume();
      this.enabled = true;
      target(master.gain, 1, 0.15);
      target(amb.bed.gain, amb.level, 0.6);
      store.set(KEY, 'on');
      document.documentElement.classList.add('is-sound-on');
      bus.emit('sound', true);
      return true;
    } catch (e) { this.enabled = false; return false; }
  },
  disable() {
    this.enabled = false;
    if (ctx) { target(master.gain, 0, 0.12); setTimeout(() => { if (!this.enabled && ctx.state === 'running') ctx.suspend(); }, 600); }
    store.set(KEY, 'off');
    document.documentElement.classList.remove('is-sound-on');
    bus.emit('sound', false);
  },
  toggle() { return this.enabled ? (this.disable(), false) : this.enable(); },
  ready() { return !!ctx && this.enabled && ctx.state === 'running'; },
  _debug() { return { ctx, master, amb, hum }; },
  tick() {
    if (!this.ready()) return;
    const t = performance.now(); if (t - lastTick < 45) return; lastTick = t;
    blip(1250, 720, 0.045, 0.1);
  },
  click() { if (!this.ready()) return; blip(230, 80, 0.12, 0.16); burst(0.035, 0.06, 2400); },
  whoosh() { if (!this.ready()) return; burst(0.34, 0.15, 320, 'bandpass', 2600); },
  chime() { if (!this.ready()) return; blip(587, 587, 0.7, 0.07); setTimeout(() => this.ready() && blip(880, 880, 0.9, 0.06), 90); },
  open() { if (!this.ready()) return; burst(0.42, 0.12, 260, 'bandpass', 3200); blip(160, 70, 0.3, 0.08); },
  close() { if (!this.ready()) return; burst(0.3, 0.09, 2600, 'bandpass', 260); },
};

export function initSound() {
  if (reduceMotion && !store.get(KEY)) store.set(KEY, 'off');
  // returning visitor who chose sound: arm on the first gesture (autoplay policy)
  if (store.get(KEY) === 'on' && !reduceMotion) {
    const arm = () => { if (!sound.enabled) sound.enable(); cleanup(); };
    const cleanup = () => { window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); window.removeEventListener('touchstart', arm); };
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    window.addEventListener('touchstart', arm, { once: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { target(master.gain, 0, 0.05); setTimeout(() => ctx.state === 'running' && ctx.suspend(), 200); }
    else if (sound.enabled) { ctx.resume(); target(master.gain, 1, 0.3); }
  });
  // reactive ambient: scroll velocity opens the filter and raises the wash
  bus.on('frame', ({ vel }) => {
    if (!sound.ready()) return;
    const v = clamp(0, 1, Math.abs(vel));
    target(amb.filter.frequency, 300 + v * 1500, 0.12);
    target(amb.nGain.gain, 0.12 + v * 0.35, 0.12);
  });
  // lens hum follows the x-ray
  bus.on('lens', (l) => {
    if (!sound.ready()) return;
    const sp = clamp(0, 1, l.speed * 0.9);
    target(hum.gain.gain, l.strength * (0.015 + sp * 0.06), 0.06);
    target(hum.osc.frequency, 52 + sp * 38, 0.08);
    target(hum.filter.frequency, 140 + sp * 420, 0.08);
  });
  // UI: ticks on hover, thud on click (delegated, fine pointers only for hover)
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target.closest('a, button, [data-tick]');
    if (t && !t.dataset.silent) sound.tick();
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button');
    if (t && !t.dataset.silent) sound.click();
  });
  return sound;
}
