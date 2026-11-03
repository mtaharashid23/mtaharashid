// Hero stage: the portrait as an x-ray surface plus the viewport lens field.
import { Scene } from 'three';
import { ScrollTrigger } from '../motion.js';
import { $, clamp, bus } from '../env.js';
import { scroll } from '../scroll.js';
import { gl, addStage } from './renderer.js';
import { Surface, loadTexture } from './surface.js';
import { createField } from './field.js';
import { lens } from './lens.js';

export function createHeroStage() {
  const frame = $('#portraitFrame');
  const img = $('#portraitImg');
  const section = $('#hero');
  if (!frame || !img || !gl.ok) return null;

  const scene = new Scene();
  const stage = { name: 'hero', scene, active: false, ready: false, enabled: false, inView: true, surface: null, field: null };

  const field = createField();
  scene.add(field.mesh);

  loadTexture(img.currentSrc || img.src).then((tex) => {
    stage.surface = new Surface({ texture: tex, anchor: [0.5, 0.82], viewport: gl.viewport, flow: gl.flow.texture });
    stage.surface.mesh.renderOrder = 1;
    scene.add(stage.surface.mesh);
    stage.ready = true;
    sync();
  }).catch(() => { /* DOM image stays */ });

  const sync = () => {
    if (!stage.surface) return;
    const r = frame.getBoundingClientRect();
    stage.surface.sync(r, gl.h);
    lens.orbit = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.45, rx: r.width * 0.42, ry: r.height * 0.3 };
  };

  const refreshActive = () => { stage.active = stage.inView && stage.ready && stage.enabled; };
  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { stage.inView = self.isActive; refreshActive(); },
  });

  stage.enable = () => {
    stage.enabled = true;
    if (stage.ready) sync();
    frame.classList.add('is-gl');
    refreshActive();
  };

  stage.update = (dt, t) => {
    sync();
    const r = section.getBoundingClientRect();
    lens.bounds = { top: Math.max(0, r.top), bottom: Math.min(gl.h, r.bottom) };
    lens.tr = lens.baseR * (gl.w < 880 ? 0.72 : 1);
    lens.update(dt);
    const s = stage.surface;
    s.set('uFlow', gl.flow.texture);
    s.set('uTime', t);
    s.set('uBend', clamp(-0.35, 0.35, scroll.vel * 0.35));
    s.lens(lens.x, lens.y, lens.r, lens.strength);
    field.update(t, lens);
  };
  stage.resize = () => sync();

  bus.on('gl:lost', () => { frame.classList.remove('is-gl'); stage.active = false; });
  return addStage(stage);
}
