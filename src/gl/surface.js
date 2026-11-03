// An x-ray surface: a DOM-synced plane that paints a texture with the lens shader.
import { PlaneGeometry, Mesh, ShaderMaterial, Vector2, Vector3, Vector4, TextureLoader, LinearFilter, NoColorSpace } from 'three';
import { surfaceVert, surfaceFrag } from './shaders.js';

export const CYAN = new Vector3(0.39, 0.878, 1.0);
export const NAVY = new Vector3(0.0235, 0.047, 0.086);

const loader = new TextureLoader();
const cache = new Map();
export function loadTexture(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve, reject) => {
    loader.load(src, (tex) => {
      tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = false; tex.colorSpace = NoColorSpace;
      resolve(tex);
    }, undefined, reject);
  });
  cache.set(src, p);
  return p;
}

const geometry = new PlaneGeometry(1, 1, 24, 24);

export class Surface {
  constructor({ texture, anchor = [0.5, 0.5], viewport, flow, grain = 0.035 }) {
    this.anchor = anchor;
    this.texAspect = texture.image.width / texture.image.height;
    this.mat = new ShaderMaterial({
      uniforms: {
        uTex: { value: texture }, uFlow: { value: flow },
        uTexel: { value: new Vector2(1 / texture.image.width, 1 / texture.image.height) },
        uCover: { value: new Vector4(1, 1, anchor[0], anchor[1]) },
        uRect: { value: new Vector4(0, 0, 1, 1) }, uViewport: { value: viewport },
        uLens: { value: new Vector2(-9999, -9999) }, uLensR: { value: 0 },
        uXray: { value: 0 }, uBend: { value: 0 }, uTime: { value: 0 }, uReveal: { value: 1 }, uDraw: { value: 1 },
        uHover: { value: 0 }, uAlpha: { value: 1 }, uGrain: { value: grain },
        uCyan: { value: CYAN }, uNavy: { value: NAVY },
      },
      vertexShader: surfaceVert, fragmentShader: surfaceFrag, transparent: true, depthTest: false, depthWrite: false,
    });
    this.mesh = new Mesh(geometry, this.mat);
    this.mesh.frustumCulled = false;
    this.rect = { left: 0, top: 0, width: 1, height: 1 };
  }
  // rect in CSS px (y down); viewport height h to flip into the y-up camera
  sync(rect, h) {
    const { left, top, width, height } = rect;
    this.rect = rect;
    this.mesh.position.set(left + width / 2, h - (top + height / 2), 0);
    this.mesh.scale.set(width, height, 1);
    const u = this.mat.uniforms;
    u.uRect.value.set(left, top, width, height);
    const pa = width / height, ta = this.texAspect;
    if (pa < ta) u.uCover.value.set(pa / ta, 1, this.anchor[0], this.anchor[1]);
    else u.uCover.value.set(1, ta / pa, this.anchor[0], this.anchor[1]);
  }
  set(name, value) { const u = this.mat.uniforms[name]; if (u) { if (u.value && u.value.set && typeof value !== 'number') u.value.copy ? u.value.copy(value) : u.value.set(value); else u.value = value; } }
  lens(x, y, r, strength) { const u = this.mat.uniforms; u.uLens.value.set(x, y); u.uLensR.value = r; u.uXray.value = strength; }
  dispose() { this.mat.dispose(); }
}
