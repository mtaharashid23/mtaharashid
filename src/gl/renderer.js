// One renderer, one fixed canvas, one pixel-space camera. Stages register
// themselves and are only updated/rendered while active.
import { WebGLRenderer, OrthographicCamera, Vector2 } from 'three';
import { gsap } from '../motion.js';
import { supportsWebGL, reduceMotion, isDesktop, bus } from '../env.js';
import { FlowField } from './flow.js';

export const gl = {
  ok: false, renderer: null, camera: null, canvas: null, flow: null,
  w: 1, h: 1, dpr: 1, stages: [], time: 0, visible: true,
  viewport: new Vector2(1, 1),
};

export function initGL() {
  const canvas = document.getElementById('gl');
  if (!canvas || reduceMotion || !supportsWebGL()) return null;
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: true, stencil: false, depth: false });
  } catch (e) { return null; }
  // software rasterisers (SwiftShader, llvmpipe) cannot hold 60fps: fall back to the DOM
  const params = new URLSearchParams(window.location.search);
  let software = false;
  try {
    const ctx = renderer.getContext();
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    software = /swiftshader|llvmpipe|softpipe|software/i.test(name);
  } catch (e) { /* ignore */ }
  if (software && params.get('gl') !== 'force') { renderer.dispose(); return null; }
  gl.renderer = renderer; gl.canvas = canvas; gl.ok = true;
  gl.dpr = Math.min(window.devicePixelRatio || 1, isDesktop() ? 1.5 : 1.25);
  if (params.get('gl') === 'force') gl.dpr = 0.4;
  renderer.setPixelRatio(gl.dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  gl.camera = new OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  gl.flow = new FlowField(renderer, isDesktop() ? 192 : 128);

  const resize = () => {
    gl.w = window.innerWidth; gl.h = window.innerHeight;
    renderer.setSize(gl.w, gl.h, false);
    gl.camera.right = gl.w; gl.camera.top = gl.h; gl.camera.updateProjectionMatrix();
    gl.viewport.set(gl.w, gl.h);
    gl.stages.forEach((s) => s.resize && s.resize(gl.w, gl.h));
  };
  resize();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

  document.addEventListener('visibilitychange', () => { gl.visible = !document.hidden; });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gl.ok = false; canvas.classList.remove('is-on'); bus.emit('gl:lost'); });

  let last = performance.now();
  gsap.ticker.add(() => {
    if (!gl.ok || !gl.visible) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    gl.time += dt;
    const active = gl.stages.filter((s) => s.active);
    if (!active.length) {
      if (!gl.cleared) { renderer.setRenderTarget(null); renderer.clear(); gl.cleared = true; }
      return;
    }
    gl.cleared = false;
    gl.flow.update(dt, gl.w / gl.h);
    renderer.setRenderTarget(null);
    renderer.clear();
    active.forEach((s) => { s.update(dt, gl.time); renderer.render(s.scene, gl.camera); });
  });
  canvas.classList.add('is-on');
  return gl;
}

export function addStage(stage) { gl.stages.push(stage); if (stage.resize) stage.resize(gl.w, gl.h); return stage; }
