// The x-ray lens: one position/radius/strength the whole site shares. Follows
// a fine pointer; on touch it rides the last touch point and drifts when idle.
import { finePointer, bus, lerp } from '../env.js';
import { pointer } from '../cursor.js';
import { gl } from './renderer.js';

export const lens = {
  x: -1000, y: -1000, r: 0, strength: 0, speed: 0,
  tx: -1000, ty: -1000, tr: 160, tStrength: 0,
  idleT: Math.random() * 10, lastTouch: 0,
  bounds: null,            // {top, bottom} viewport px of the active stage, or null
  orbit: null,             // {x, y, rx, ry} idle orbit centre for touch devices
  baseR: 160,
  update(dt) {
    const now = performance.now();
    let want = 0;
    if (finePointer) {
      if (pointer.has) { this.tx = pointer.x; this.ty = pointer.y; }
      want = pointer.has && this.inBounds(pointer.y) ? 1 : 0;
    } else {
      if (pointer.has && now - this.lastTouch < 2500) { this.tx = pointer.x; this.ty = pointer.y; want = 1; }
      else if (this.orbit) {
        this.idleT += dt;
        this.tx = this.orbit.x + Math.cos(this.idleT * 0.55) * this.orbit.rx;
        this.ty = this.orbit.y + Math.sin(this.idleT * 0.8) * this.orbit.ry;
        want = 0.85;
      }
    }
    this.tStrength = this.bounds ? want : 0;
    const k = 1 - Math.exp(-dt * (finePointer ? 15 : 5));
    const px = this.x;
    const py = this.y;
    if (this.x < -500) { this.x = this.tx; this.y = this.ty; }
    this.x = lerp(this.x, this.tx, k);
    this.y = lerp(this.y, this.ty, k);
    this.r = lerp(this.r, this.tr, 1 - Math.exp(-dt * 6));
    this.strength = lerp(this.strength, this.tStrength, 1 - Math.exp(-dt * 5));
    this.speed = lerp(this.speed, Math.hypot(this.x - px, this.y - py) / Math.max(1, dt * 1000), 1 - Math.exp(-dt * 12));
    if (gl.flow && this.strength > 0.02) gl.flow.paint(this.x / gl.w, this.y / gl.h, 7);
    bus.emit('lens', this);
  },
  inBounds(y) { return !this.bounds || (y >= this.bounds.top && y <= this.bounds.bottom); },
};

window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { lens.lastTouch = performance.now(); pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true; } }, { passive: true });
window.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') lens.lastTouch = performance.now(); }, { passive: true });
