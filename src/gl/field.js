// The viewport lens field: blueprint grid and ring around the lens, drawn first
// so every surface naturally covers it.
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector4 } from 'three';
import { fieldVert, fieldFrag } from './shaders.js';
import { CYAN } from './surface.js';
import { gl } from './renderer.js';

export function createField() {
  const mat = new ShaderMaterial({
    uniforms: {
      uFlow: { value: null }, uViewport: { value: gl.viewport }, uLens: { value: new Vector2(-9999, -9999) }, uLensR: { value: 0 },
      uXray: { value: 0 }, uTime: { value: 0 }, uHole: { value: new Vector4(0, 0, 0, 0) }, uCyan: { value: CYAN },
    },
    vertexShader: fieldVert, fragmentShader: fieldFrag, transparent: true, depthTest: false, depthWrite: false,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  return {
    mesh,
    update(t, lens) {
      mat.uniforms.uFlow.value = gl.flow.texture;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uLens.value.set(lens.x, lens.y);
      mat.uniforms.uLensR.value = lens.r;
      mat.uniforms.uXray.value = lens.strength;
    },
  };
}
