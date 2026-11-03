// Ping-pong flow field painted by pointer velocity, in viewport uv (y down).
import { WebGLRenderTarget, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, Vector2, LinearFilter, RGBAFormat, UnsignedByteType } from 'three';
import { flowVert, flowFrag } from './shaders.js';

export class FlowField {
  constructor(renderer, size = 192) {
    this.renderer = renderer;
    const opts = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat, type: UnsignedByteType, depthBuffer: false, stencilBuffer: false };
    this.a = new WebGLRenderTarget(size, size, opts);
    this.b = new WebGLRenderTarget(size, size, opts);
    this.mat = new ShaderMaterial({
      uniforms: {
        uPrev: { value: null }, uMouse: { value: new Vector2(-10, -10) }, uVel: { value: new Vector2(0, 0) },
        uRadius: { value: 0.11 }, uDecay: { value: 0.955 }, uAspect: { value: 1 },
      },
      vertexShader: flowVert, fragmentShader: flowFrag, depthTest: false, depthWrite: false,
    });
    this.scene = new Scene();
    this.scene.add(new Mesh(new PlaneGeometry(2, 2), this.mat));
    this.cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mouse = new Vector2(-10, -10);
    this.last = new Vector2(-10, -10);
    this.vel = new Vector2();
    this.target = new Vector2();
  }
  get texture() { return this.a.texture; }
  // x, y in viewport uv (y down)
  paint(x, y, strength = 6) {
    if (this.last.x < -1) this.last.set(x, y);
    this.target.set((x - this.last.x) * strength, -(y - this.last.y) * strength);
    this.last.set(x, y);
    this.mouse.set(x, 1 - y);
  }
  release() { this.last.set(-10, -10); this.target.set(0, 0); }
  update(dt, aspect) {
    const f = dt * 60;
    this.vel.lerp(this.target, Math.min(1, 0.25 * f));
    this.target.multiplyScalar(Math.pow(0.82, f));
    this.mat.uniforms.uPrev.value = this.a.texture;
    this.mat.uniforms.uMouse.value.copy(this.mouse);
    this.mat.uniforms.uVel.value.copy(this.vel);
    this.mat.uniforms.uAspect.value = aspect;
    const r = this.renderer;
    r.setRenderTarget(this.b);
    r.render(this.scene, this.cam);
    r.setRenderTarget(null);
    const t = this.a; this.a = this.b; this.b = t;
  }
  dispose() { this.a.dispose(); this.b.dispose(); this.mat.dispose(); }
}
