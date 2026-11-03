// GLSL for the three GL pieces: the flow field sim, the x-ray surface (portrait,
// work planes, about portrait) and the full-viewport lens field.

export const flowVert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;

export const flowFrag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev; uniform vec2 uMouse; uniform vec2 uVel;
uniform float uRadius; uniform float uDecay; uniform float uAspect;
void main(){
  vec2 prev = (texture2D(uPrev, vUv).rg - 0.5) * 2.0;
  prev *= uDecay;
  vec2 d = vUv - uMouse; d.x *= uAspect;
  float brush = smoothstep(uRadius, 0.0, length(d));
  vec2 flow = clamp(prev + uVel * brush, -1.0, 1.0);
  gl_FragColor = vec4(flow * 0.5 + 0.5, 0.0, 1.0);
}`;

// Plane in viewport pixels. uRect = (left, top, width, height) in CSS px, y down.
export const surfaceVert = /* glsl */`
uniform float uBend; uniform vec4 uRect;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  // velocity shear + a soft curve, strongest mid-plane
  float k = uv.y - 0.5;
  p.x += uBend * k * 0.16;
  p.x += uBend * sin(uv.y * 3.14159) * 0.05;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const surfaceFrag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex; uniform sampler2D uFlow;
uniform vec2 uTexel; uniform vec4 uCover;      // cover scale.xy, anchor.xy (uv, y up)
uniform vec4 uRect; uniform vec2 uViewport;    // px
uniform vec2 uLens; uniform float uLensR;      // px, y down
uniform float uXray, uBend, uTime, uReveal, uDraw, uHover, uAlpha, uGrain;
uniform vec3 uCyan, uNavy;

float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  // position of this fragment in viewport px (y down) and in viewport uv
  vec2 uvTop = vec2(vUv.x, 1.0 - vUv.y);
  vec2 fragPx = uRect.xy + uvTop * uRect.zw;
  vec2 vp = vec2(fragPx.x / uViewport.x, 1.0 - fragPx.y / uViewport.y);
  vec2 flow = (texture2D(uFlow, vp).rg - 0.5) * 2.0;
  float mag = length(flow);
  vec2 flowPx = vec2(flow.x, -flow.y);

  // lens mask with a flow-stirred rim
  vec2 toLens = fragPx - uLens;
  float d = length(toLens) + dot(flowPx, normalize(toLens + 0.001)) * 26.0 * uXray;
  float m = (1.0 - smoothstep(uLensR * 0.70, uLensR, d)) * uXray;

  // cover-fit the texture into the plane
  vec2 uv = (vUv - uCover.zw) * uCover.xy + uCover.zw;
  uv = (uv - 0.5) * (1.0 - 0.012 * (0.5 + 0.5 * sin(uTime * 0.35))) + 0.5; // breathing

  // pixels: flow displacement, stronger inside the lens; velocity RGB split
  vec2 disp = flow * (0.010 + 0.045 * m);
  float split = mag * (0.003 + 0.016 * m) + abs(uBend) * 0.012;
  vec2 sp = vec2(split, 0.0) + flow * split;
  vec3 pix;
  pix.r = texture2D(uTex, uv - disp - sp).r;
  pix.g = texture2D(uTex, uv - disp).g;
  pix.b = texture2D(uTex, uv - disp + sp).b;

  // blueprint: sobel edges of the (displaced) pixels
  vec2 q = uv - disp;
  float tl = luma(texture2D(uTex, q + uTexel * vec2(-1.0, -1.0)).rgb);
  float  l = luma(texture2D(uTex, q + uTexel * vec2(-1.0,  0.0)).rgb);
  float bl = luma(texture2D(uTex, q + uTexel * vec2(-1.0,  1.0)).rgb);
  float  t = luma(texture2D(uTex, q + uTexel * vec2( 0.0, -1.0)).rgb);
  float  b = luma(texture2D(uTex, q + uTexel * vec2( 0.0,  1.0)).rgb);
  float tr = luma(texture2D(uTex, q + uTexel * vec2( 1.0, -1.0)).rgb);
  float  r = luma(texture2D(uTex, q + uTexel * vec2( 1.0,  0.0)).rgb);
  float br = luma(texture2D(uTex, q + uTexel * vec2( 1.0,  1.0)).rgb);
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  float edge = clamp(sqrt(gx * gx + gy * gy) * 2.0, 0.0, 1.0);
  // the blueprint draws itself in: a diagonal plotter sweep driven by uDraw
  float sweep = (uvTop.x + uvTop.y) * 0.5;
  edge *= smoothstep(uDraw * 1.3 - 0.3, uDraw * 1.3, sweep);
  vec2 g = fract(fragPx / 40.0);
  float grid = (step(0.975, g.x) + step(0.975, g.y)) * 0.16 * smoothstep(0.0, 0.5, uDraw);
  float scan = 0.035 * sin(fragPx.y * 0.9 + uTime * 5.0);
  vec3 bp = mix(uNavy, uCyan, clamp(edge * 1.5 + grid, 0.0, 1.0)) + scan;

  // reveal: 0 = the whole plane is blueprint, 1 = pixels (lens still x-rays)
  float rv = smoothstep(0.0, 1.0, uReveal);
  // the render wipes in from the left with a soft edge, like a plotter pass
  float wipe = smoothstep(rv * 1.25 - 0.25, rv * 1.25 - 0.05, uvTop.x);
  vec3 col = mix(bp, pix, 1.0 - wipe);
  col = mix(col, bp, m);

  // lens ring
  float ring = smoothstep(uLensR, uLensR - 1.5, d) - smoothstep(uLensR - 2.5, uLensR - 4.0, d);
  col += uCyan * ring * 0.75 * uXray;

  // vignette + grain (pixels only)
  float vig = smoothstep(1.3, 0.4, length((vUv - 0.5) * vec2(1.1, 1.0)));
  col *= mix(0.86, 1.0, vig);
  col += (hash(vUv * uRect.zw + fract(uTime)) - 0.5) * uGrain;
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`;

export const fieldVert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;

// Full-viewport: blueprint grid inside the lens + where the flow stirs. Premultiplied alpha.
export const fieldFrag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D uFlow; uniform vec2 uViewport; uniform vec2 uLens; uniform float uLensR;
uniform float uXray, uTime; uniform vec4 uHole; uniform vec3 uCyan;
void main(){
  vec2 fragPx = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
  vec2 flow = (texture2D(uFlow, vUv).rg - 0.5) * 2.0;
  float mag = length(flow);
  vec2 flowPx = vec2(flow.x, -flow.y);
  vec2 toLens = fragPx - uLens;
  float d = length(toLens) + dot(flowPx, normalize(toLens + 0.001)) * 26.0 * uXray;
  float m = (1.0 - smoothstep(uLensR * 0.55, uLensR, d)) * uXray;
  // skip the surface rect (it draws its own blueprint)
  float inHole = step(uHole.x, fragPx.x) * step(fragPx.x, uHole.x + uHole.z) * step(uHole.y, fragPx.y) * step(fragPx.y, uHole.y + uHole.w);
  vec2 g = fract(fragPx / 40.0);
  float grid = max(step(0.975, g.x), step(0.975, g.y));
  float dots = step(0.985, g.x) * step(0.985, g.y);
  float a = (m * (grid * 0.30 + dots * 0.5) + mag * grid * 0.18) * (1.0 - inHole);
  float ring = smoothstep(uLensR, uLensR - 1.5, d) - smoothstep(uLensR - 2.5, uLensR - 4.0, d);
  a += ring * 0.55 * uXray * (1.0 - inHole);
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(uCyan * a, a);
}`;
