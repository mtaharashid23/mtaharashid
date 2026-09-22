/* ==========================================================================
   Signature 3: the portrait as a fluid surface.
   A small ping-pong render target stores a "flow" field painted by the
   pointer. The display shader bends the portrait's UVs along that flow,
   splits the channels by flow magnitude, and tints toward ember on hover.
   Built with esbuild: npm run build  (src/gl.js -> js/gl.js)
   ========================================================================== */
import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial,
  WebGLRenderTarget, TextureLoader, Vector2, Color, LinearFilter, RGBAFormat, UnsignedByteType,
  NoColorSpace,
} from 'three';

const canvas = document.getElementById('portraitCanvas');
const frame = document.getElementById('portraitFrame');
const img = document.getElementById('portraitImg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function supportsGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (canvas && frame && img && supportsGL() && !reduceMotion) init();

function init() {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new PlaneGeometry(2, 2);

  /* --- flow field: two small targets, ping-pong --- */
  const FLOW_SIZE = 192;
  const rtOpts = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat, type: UnsignedByteType, depthBuffer: false, stencilBuffer: false };
  let rtA = new WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOpts);
  let rtB = new WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOpts);

  const flowMat = new ShaderMaterial({
    uniforms: {
      uPrev: { value: null },
      uMouse: { value: new Vector2(-10, -10) },
      uVel: { value: new Vector2(0, 0) },
      uRadius: { value: 0.16 },
      uDecay: { value: 0.955 },
      uAspect: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPrev; uniform vec2 uMouse; uniform vec2 uVel;
      uniform float uRadius; uniform float uDecay; uniform float uAspect;
      void main(){
        vec2 prev = (texture2D(uPrev, vUv).rg - 0.5) * 2.0;   // decode -1..1
        prev *= uDecay;
        vec2 d = vUv - uMouse; d.x *= uAspect;
        float brush = smoothstep(uRadius, 0.0, length(d));
        vec2 flow = prev + uVel * brush;
        flow = clamp(flow, -1.0, 1.0);
        gl_FragColor = vec4(flow * 0.5 + 0.5, 0.0, 1.0);        // encode
      }`,
  });
  const flowScene = new Scene();
  flowScene.add(new Mesh(quad, flowMat));

  /* --- display --- */
  const dispMat = new ShaderMaterial({
    uniforms: {
      uTex: { value: null },
      uFlow: { value: null },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uReveal: { value: 0 },
      uAccent: { value: new Color('#FF5A2D') },
      uShadow: { value: new Color('#0C0C0D') },
      uRes: { value: new Vector2(1, 1) },
      uImgAspect: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex; uniform sampler2D uFlow;
      uniform float uTime, uHover, uReveal, uImgAspect;
      uniform vec3 uAccent, uShadow; uniform vec2 uRes;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

      // cover-fit the square image into the frame, anchored near the top (face)
      vec2 coverUv(vec2 uv){
        float frameAspect = uRes.x / uRes.y;
        vec2 scale = vec2(1.0);
        if (frameAspect < uImgAspect) scale.x = frameAspect / uImgAspect; else scale.y = uImgAspect / frameAspect;
        vec2 anchor = vec2(0.5, 0.88); // 0.88 = keep the head in frame
        return (uv - anchor) * scale + anchor;
      }

      void main(){
        vec2 flow = (texture2D(uFlow, vUv).rg - 0.5) * 2.0;
        float mag = length(flow);
        vec2 uv = coverUv(vUv);
        // a gentle breathing zoom so the image is never fully still
        uv = (uv - 0.5) * (1.0 - 0.015 * (0.5 + 0.5 * sin(uTime * 0.35))) + 0.5;
        vec2 disp = flow * 0.06;
        float split = mag * 0.018;
        float r = texture2D(uTex, uv - disp - flow * split).r;
        float g = texture2D(uTex, uv - disp).g;
        float b = texture2D(uTex, uv - disp + flow * split).b;
        vec3 col = vec3(r, g, b);
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = vec3(lum);                                           // hold it monochrome
        col = pow(col, vec3(1.06));                                // a little contrast
        vec3 duo = mix(uShadow, uAccent, smoothstep(0.0, 0.72, lum));
        duo = mix(duo, vec3(0.93, 0.92, 0.90), smoothstep(0.72, 1.0, lum));
        col = mix(col, duo, uHover * 0.82 + mag * 0.3 * uHover);
        // vignette + grain
        float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.1, 1.0)));
        col *= mix(0.72, 1.0, vig);
        col += (hash(vUv * uRes + uTime) - 0.5) * 0.045;
        gl_FragColor = vec4(col, uReveal);
      }`,
    transparent: true,
  });
  scene.add(new Mesh(quad, dispMat));

  /* --- texture --- */
  const src = (img.currentSrc || img.src);
  new TextureLoader().load(src, (tex) => {
    tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = false; tex.colorSpace = NoColorSpace;
    dispMat.uniforms.uTex.value = tex;
    dispMat.uniforms.uImgAspect.value = tex.image.width / tex.image.height;
    dispMat.uniforms.uReveal.value = 1;
    canvas.classList.add('is-ready');
    frame.classList.add('gl-ready');
    running = true;
  });

  /* --- sizing --- */
  function resize() {
    const r = frame.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    renderer.setSize(w, h, false);
    dispMat.uniforms.uRes.value.set(w, h);
    flowMat.uniforms.uAspect.value = w / h;
  }
  resize();
  new ResizeObserver(resize).observe(frame);

  /* --- pointer --- */
  const mouse = new Vector2(-10, -10), last = new Vector2(-10, -10), vel = new Vector2(0, 0), target = new Vector2(0, 0);
  let hover = 0, hoverTarget = 0, inside = false;
  const onMove = (e) => {
    const r = frame.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (last.x < -1) last.set(x, y);
    target.set((x - last.x) * 6, (y - last.y) * 6);
    last.set(x, y); mouse.set(x, y);
  };
  frame.addEventListener('pointermove', onMove, { passive: true });
  frame.addEventListener('pointerenter', () => { inside = true; hoverTarget = finePointer ? 1 : 0; });
  frame.addEventListener('pointerleave', () => { inside = false; hoverTarget = 0; last.set(-10, -10); target.set(0, 0); });
  // touch: a slow autonomous ripple so the surface is still alive
  let autoT = Math.random() * 100;

  /* --- run loop, paused when offscreen --- */
  let running = false, visible = true;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(frame);
  let lastT = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    if (!running || !visible || document.hidden) return;
    const dt = Math.min(50, now - lastT) / 16.7; lastT = now;

    if (!finePointer || !inside) {
      autoT += 0.011 * dt;
      mouse.set(0.5 + 0.34 * Math.cos(autoT * 0.9), 0.55 + 0.28 * Math.sin(autoT * 1.3));
      target.set(Math.cos(autoT * 0.9 + 1.57) * -0.35, Math.sin(autoT * 1.3 + 1.57) * 0.3);
    }
    vel.lerp(target, 0.25 * dt);
    target.multiplyScalar(Math.pow(0.82, dt));
    hover += (hoverTarget - hover) * 0.08 * dt;

    // paint the flow field
    flowMat.uniforms.uPrev.value = rtA.texture;
    flowMat.uniforms.uMouse.value.copy(mouse);
    flowMat.uniforms.uVel.value.copy(vel);
    renderer.setRenderTarget(rtB);
    renderer.render(flowScene, camera);
    renderer.setRenderTarget(null);
    const tmp = rtA; rtA = rtB; rtB = tmp;

    dispMat.uniforms.uFlow.value = rtA.texture;
    dispMat.uniforms.uTime.value = now / 1000;
    dispMat.uniforms.uHover.value = hover;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  window.addEventListener('pagehide', () => { renderer.dispose(); rtA.dispose(); rtB.dispose(); });
}
