// ===================== PHYSICS =====================
class VerletPoint {
  constructor(x, y, fixed = false) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;
    this.fixed = fixed;
    this.ax = 0; this.ay = 0;
  }
  update(dt) {
    if (this.fixed) return;
    const vx = (this.x - this.px) * CFG.DAMPING;
    const vy = (this.y - this.py) * CFG.DAMPING;
    this.px = this.x; this.py = this.y;
    this.x += vx + this.ax * dt * dt;
    this.y += vy + (this.ay + CFG.GRAVITY) * dt * dt;
    this.ax = 0; this.ay = 0;
  }
  applyForce(fx, fy) { this.ax += fx; this.ay += fy; }
  vel() { return { vx: this.x - this.px, vy: this.y - this.py }; }
}

class RopeConstraint {
  constructor(p1, p2, len) {
    this.p1 = p1; this.p2 = p2; this.len = len;
    this.cut = false;
    this.cutTimer = 0; // for visual tear effect
  }
  solve() {
    if (this.cut) return;
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const diff = (d - this.len) / d * 0.5;
    const mx = dx * diff, my = dy * diff;
    if (!this.p1.fixed) { this.p1.x += mx; this.p1.y += my; }
    if (!this.p2.fixed) { this.p2.x -= mx; this.p2.y -= my; }
  }
}

class Rope {
  constructor(anchorX, anchorY, endX, endY, segs) {
    this.points = [];
    this.constraints = [];
    this.cut = false; // fully detached
    this.id = Rope._nextId++;
    this.tearParts = []; // visual debris after cut

    segs = segs || CFG.ROPE_SEGS;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = lerp(anchorX, endX, t);
      const y = lerp(anchorY, endY, t);
      this.points.push(new VerletPoint(x, y, i === 0));
    }
    const segLen = dist(anchorX, anchorY, endX, endY) / segs;
    for (let i = 0; i < segs; i++) {
      this.constraints.push(new RopeConstraint(
        this.points[i], this.points[i + 1], segLen
      ));
    }
  }

  get tip() { return this.points[this.points.length - 1]; }
  get anchor() { return this.points[0]; }

  update(dt) {
    for (const p of this.points) p.update(dt);
    for (let i = 0; i < CFG.CONSTRAINT_ITERS; i++) {
      for (const c of this.constraints) c.solve();
    }
    for (const c of this.constraints) {
      if (c.cut && c.cutTimer > 0) c.cutTimer -= dt * 2;
    }
  }

  // Try cutting with swipe from (x1,y1)→(x2,y2). Returns cut index or -1.
  checkCut(x1, y1, x2, y2) {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (c.cut) continue;
      if (segsCross(x1, y1, x2, y2, c.p1.x, c.p1.y, c.p2.x, c.p2.y)) {
        return i;
      }
    }
    return -1;
  }

  cutAt(idx) {
    this.constraints[idx].cut = true;
    this.constraints[idx].cutTimer = 1.0;
    // All points below the cut become free (unanchor them)
    for (let i = idx + 1; i < this.points.length; i++) {
      this.points[i].fixed = false;
    }
    // Generate tear debris particles (handled in game)
    const c = this.constraints[idx];
    const mx = (c.p1.x + c.p2.x) / 2;
    const my = (c.p1.y + c.p2.y) / 2;
    return { x: mx, y: my };
  }

  isDetached() {
    // rope is fully detached if the first non-anchor constraint is cut
    return this.constraints.length > 0 && this.constraints[0].cut;
  }

  // Is the candy-side still connected (lowest segment not cut)?
  hasCandyConnection() {
    const last = this.constraints[this.constraints.length - 1];
    return last && !last.cut;
  }
}
Rope._nextId = 0;
