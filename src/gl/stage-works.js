// Works stage: eight DOM-synced planes. Each arrives as its blueprint (edges
// drawing in), renders into pixels as it reaches the middle of the viewport,
// dissolves back to blueprint as it leaves, bends with scroll velocity and
// x-rays under the lens.
import { Scene } from 'three';
import { ScrollTrigger } from '../motion.js';
import { $, $$, clamp, bus, finePointer } from '../env.js';
import { scroll } from '../scroll.js';
import { gl, addStage } from './renderer.js';
import { Surface, loadTexture } from './surface.js';
import { createField } from './field.js';
import { lens } from './lens.js';

const clamp01 = (v) => clamp(0, 1, v);

export function createWorksStage() {
  const section = $('#work');
  const medias = $$('.work-media[data-gl-plane]');
  if (!section || !medias.length || !gl.ok) return null;

  const scene = new Scene();
  const field = createField();
  scene.add(field.mesh);
  const stage = { name: 'works', scene, active: false, inView: false, loaded: false, planes: [] };

  const refreshActive = () => { stage.active = stage.inView && stage.planes.length > 0; };

  const load = () => {
    if (stage.loaded) return;
    stage.loaded = true;
    medias.forEach((media, i) => {
      const img = $('img', media);
      const src = media.dataset.glSrc || (img && (img.currentSrc || img.src));
      if (!src) return;
      loadTexture(src).then((tex) => {
        const surface = new Surface({ texture: tex, anchor: [0.5, 0.5], viewport: gl.viewport, flow: gl.flow.texture, grain: 0.02 });
        surface.mesh.renderOrder = 1 + i;
        surface.set('uReveal', 0);
        surface.set('uDraw', 0);
        scene.add(surface.mesh);
        const plane = { media, surface, hover: 0, reveal: 0, draw: 0 };
        stage.planes.push(plane);
        media.classList.add('is-gl');
        refreshActive();
      }).catch(() => { /* DOM image stays */ });
    });
  };

  ScrollTrigger.create({ trigger: section, start: 'top 150%', once: true, onEnter: load });
  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { stage.inView = self.isActive; refreshActive(); },
  });

  // hover state per plane (desktop): the x-ray only reads at full strength over a plane
  medias.forEach((media) => {
    media.addEventListener('pointerenter', () => { const p = stage.planes.find((q) => q.media === media); if (p) p.hoverT = 1; });
    media.addEventListener('pointerleave', () => { const p = stage.planes.find((q) => q.media === media); if (p) p.hoverT = 0; });
  });

  stage.update = (dt, t) => {
    const vh = gl.h;
    const sr = section.getBoundingClientRect();
    lens.bounds = { top: Math.max(0, sr.top), bottom: Math.min(vh, sr.bottom) };
    lens.tr = lens.baseR * (gl.w < 880 ? 0.72 : 1);
    // on touch devices the lens roams over whichever plane is nearest the middle
    let nearest = null, best = Infinity;
    const bend = clamp(-0.35, 0.35, scroll.vel * 0.35);
    stage.planes.forEach((p) => {
      const r = p.media.getBoundingClientRect();
      p.rect = r;
      p.surface.mesh.visible = r.bottom > -40 && r.top < vh + 40;
      if (!p.surface.mesh.visible) return;
      p.surface.sync(r, vh);
      const center = r.top + r.height / 2;
      const draw = clamp01((vh * 1.02 - r.top) / (vh * 0.32));
      const enterT = clamp01((vh * 0.95 - center) / (vh * 0.33));
      const exitT = clamp01((center + vh * 0.05) / (vh * 0.33));
      const reveal = Math.min(enterT, exitT);
      // frame-rate independent smoothing
      const kD = 1 - Math.exp(-dt * 12), kR = 1 - Math.exp(-dt * 9), kH = 1 - Math.exp(-dt * 7);
      p.draw += (draw - p.draw) * kD;
      p.reveal += (reveal - p.reveal) * kR;
      p.hover += ((p.hoverT || 0) - p.hover) * kH;
      const s = p.surface;
      s.set('uFlow', gl.flow.texture);
      s.set('uTime', t);
      s.set('uBend', bend);
      s.set('uDraw', p.draw);
      s.set('uReveal', p.reveal);
      s.set('uHover', p.hover);
      const d = Math.abs(center - vh / 2);
      if (d < best) { best = d; nearest = r; }
    });
    if (!finePointer && nearest) lens.orbit = { x: nearest.left + nearest.width * 0.5, y: nearest.top + nearest.height * 0.5, rx: nearest.width * 0.36, ry: nearest.height * 0.32 };
    lens.update(dt);
    stage.planes.forEach((p) => p.surface.lens(lens.x, lens.y, lens.r, lens.strength));
    field.update(t, lens);
  };
  stage.resize = () => {};

  bus.on('gl:lost', () => { medias.forEach((m) => m.classList.remove('is-gl')); stage.active = false; });
  return addStage(stage);
}
