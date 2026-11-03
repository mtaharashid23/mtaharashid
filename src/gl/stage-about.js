// About stage: the portrait again, close, on the light ground. The lens shows the
// line drawing underneath; the field's ink turns to navy so it reads on bone.
import { Scene, Vector3 } from 'three';
import { ScrollTrigger } from '../motion.js';
import { $, clamp, bus } from '../env.js';
import { scroll } from '../scroll.js';
import { gl, addStage } from './renderer.js';
import { Surface, loadTexture } from './surface.js';
import { createField } from './field.js';
import { lens } from './lens.js';

export function createAboutStage() {
  const photo = $('#aboutPhoto');
  const pic = photo && $('picture', photo);
  const img = $('#aboutImg');
  const section = $('#about');
  if (!photo || !img || !gl.ok) return null;

  const scene = new Scene();
  const field = createField();
  field.mesh.material.uniforms.uCyan.value = new Vector3(0.04, 0.09, 0.16); // navy ink on the light ground
  scene.add(field.mesh);
  const stage = { name: 'about', scene, active: false, ready: false, enabled: false, inView: false, surface: null };
  const refreshActive = () => { stage.active = stage.inView && stage.ready && stage.enabled; };

  const sync = () => {
    if (!stage.surface) return;
    const r = pic.getBoundingClientRect();
    stage.surface.sync(r, gl.h);
    lens.orbit = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.42, rx: r.width * 0.4, ry: r.height * 0.3 };
  };
  ScrollTrigger.create({ trigger: section, start: 'top 120%', once: true, onEnter: () => {
    loadTexture(img.currentSrc || img.src).then((tex) => {
      stage.surface = new Surface({ texture: tex, anchor: [0.5, 0.82], viewport: gl.viewport, flow: gl.flow.texture });
      stage.surface.mesh.renderOrder = 1;
      scene.add(stage.surface.mesh);
      stage.ready = true; sync(); refreshActive();
    }).catch(() => {});
  } });
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => { stage.inView = self.isActive; refreshActive(); } });
  bus.on('about:revealed', () => { stage.enabled = true; photo.classList.add('is-gl'); refreshActive(); });

  stage.update = (dt, t) => {
    sync();
    const r = section.getBoundingClientRect();
    lens.bounds = { top: Math.max(0, r.top), bottom: Math.min(gl.h, r.bottom) };
    lens.tr = lens.baseR * (gl.w < 880 ? 0.72 : 1);
    lens.update(dt);
    const s = stage.surface;
    s.set('uFlow', gl.flow.texture);
    s.set('uTime', t);
    s.set('uBend', clamp(-0.2, 0.2, scroll.vel * 0.2));
    s.lens(lens.x, lens.y, lens.r, lens.strength);
    field.update(t, lens);
  };
  stage.resize = () => sync();
  bus.on('gl:lost', () => { photo.classList.remove('is-gl'); stage.active = false; });
  return addStage(stage);
}
