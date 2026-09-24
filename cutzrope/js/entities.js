// ===================== GAME ENTITIES =====================

class CoffeeBean {
  constructor(x, y) {
    this.point = new VerletPoint(x, y, false);
    this.r = CFG.CANDY_R;
    this.rot = 0;
    this.collected = false;
    this.inBubble = null; // ref to bubble
    this.squish = 1; // for bounce squish effect
    this.squishTimer = 0;
  }

  get x() { return this.point.x; }
  get y() { return this.point.y; }

  applyRopeConstraint(ropeEndPt, ropeSegLen) {
    // Pull bean toward rope tip (and vice versa)
    const dx = this.point.x - ropeEndPt.x;
    const dy = this.point.y - ropeEndPt.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const diff = (d - 0) / d * 0.5; // rigid join: target distance = 0
    const mx = dx * diff, my = dy * diff;
    if (!this.point.fixed) { this.point.x -= mx; this.point.y -= my; }
    if (!ropeEndPt.fixed) { ropeEndPt.x += mx; ropeEndPt.y += my; }
  }

  update(dt) {
    this.point.update(dt);
    // Rotation from velocity
    const v = this.point.vel();
    this.rot += v.vx * dt * 0.04;
    // Squish recovery
    if (this.squishTimer > 0) {
      this.squishTimer -= dt * 4;
      this.squish = 1 + Math.sin(this.squishTimer * Math.PI) * 0.18;
    } else {
      this.squish = 1;
    }
    // Keep in bubble
    if (this.inBubble && this.inBubble.alive) {
      this.point.x = lerp(this.point.x, this.inBubble.x, 0.25);
      this.point.y = lerp(this.point.y, this.inBubble.y, 0.25);
      this.point.px = this.point.x;
      this.point.py = this.point.y;
    }
  }

  bounce() {
    const v = this.point.vel();
    this.point.py = this.point.y; // reset previous so velocity becomes 0 upward
    this.point.y = this.point.y;
    // Flip vertical velocity
    this.point.py = this.point.y + v.vy * 0.7; // reflect
    this.squishTimer = 1.0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, this.squish);
    ctx.translate(-this.x, -this.y);
    drawCoffeeBean(ctx, this.x, this.y, this.r, this.rot);
    ctx.restore();
  }

  vel() { return this.point.vel(); }
}

class StarToken {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = CFG.STAR_R;
    this.collected = false;
    this.collectAnim = 0;
    this.pulse = Math.random() * Math.PI * 2; // phase offset
  }

  update(dt) {
    this.pulse += dt;
    if (this.collected) {
      this.collectAnim += dt * 3;
    }
  }

  draw(ctx) {
    if (this.collected) {
      // flash-out
      if (this.collectAnim < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - this.collectAnim;
        ctx.scale(1 + this.collectAnim, 1 + this.collectAnim);
        drawStar(ctx, this.x, this.y, this.r * (1 + this.collectAnim * 2), false, this.pulse);
        ctx.restore();
      }
      return;
    }
    drawStar(ctx, this.x, this.y, this.r, false, this.pulse);
  }
}

// The Jebena character — animated coffee-pot mascot that watches the bean
// fall and chomps it on arrival.
class TejCup {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = CFG.CUP_R;
    this.lit = false;
    this.collectAnim = 0;
    this.collected = false;

    // Animation state
    this.breathe   = Math.random() * Math.PI * 2;
    this.bob       = Math.random() * Math.PI * 2;
    this.blink     = 0;            // 0 open .. 1 closed
    this.blinkTimer = 1.5 + Math.random() * 2.5;
    this._blinking = -1;          // <0 = not blinking
    this.mouthOpen = 0;           // eased 0..1
    this.lookX = 0; this.lookY = 0.3;
    this.hop   = 0;
    this.chew  = 0;
  }

  update(dt, bean) {
    this.breathe += dt * 2.4;
    this.bob     += dt * 1.7;

    // Blink scheduling
    if (this._blinking < 0) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) { this._blinking = 0; this.blinkTimer = 2 + Math.random() * 3.5; }
    } else {
      this._blinking += dt;
      const t = this._blinking / 0.16; // ~160ms blink
      if (t >= 1) { this.blink = 0; this._blinking = -1; }
      else this.blink = Math.sin(t * Math.PI); // 0 -> 1 -> 0
    }

    // Eye tracking + anticipation mouth driven by the bean's approach
    let targetMouth = 0, tx = 0, ty = 0.3;
    if (bean && !this.collected) {
      const dx = bean.x - this.x, dy = bean.y - this.y;
      const ang = Math.atan2(dy, dx);
      tx = clamp(Math.cos(ang) * 1.2, -1, 1);
      ty = clamp(Math.sin(ang) * 1.2, -1, 1);
      const d = Math.hypot(dx, dy);
      targetMouth = clamp(1 - (d - this.r) / (this.r * 5), 0, 1);
    }
    if (this.collected) { targetMouth = 1; tx = 0; ty = -0.2; }

    this.lookX = lerp(this.lookX, tx, 0.16);
    this.lookY = lerp(this.lookY, ty, 0.16);
    this.mouthOpen = lerp(this.mouthOpen, targetMouth, 0.22);

    if (this.collected) {
      this.collectAnim = Math.min(1, this.collectAnim + dt * 2.5);
      // Happy hop + a couple of chomps
      this.hop  = Math.sin(this.collectAnim * Math.PI * 3) * (1 - this.collectAnim) * 16;
      this.chew = Math.max(0, Math.sin(this.collectAnim * Math.PI * 5)) * (1 - this.collectAnim);
    }
  }

  draw(ctx) {
    const breath = Math.sin(this.breathe) * 0.045;
    const bobY   = Math.sin(this.bob) * 4 - this.hop;
    drawJebena(ctx, this.x, this.y + bobY, this.r, {
      lit:         this.lit || this.collected,
      collected:   this.collected,
      collectAnim: this.collectAnim,
      blink:       this.blink,
      breath:      breath,
      mouthOpen:   this.mouthOpen,
      lookX:       this.lookX,
      lookY:       this.lookY,
      chew:        this.chew,
    });
  }
}

class Bubble {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = CFG.BUBBLE_R;
    this.alive = true;
    this.captured = false; // bean is inside
    this.popTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.driftX = (Math.random() - 0.5) * 40;
  }

  update(dt) {
    this.wobble += dt * 1.8;
    if (this.alive) {
      this.y += CFG.BUBBLE_LIFT * dt * 0.08; // slow upward drift
      this.x += Math.sin(this.wobble * 0.6) * dt * 18;
    }
    if (this.popTimer > 0) {
      this.popTimer -= dt * 3;
      if (this.popTimer <= 0) this.alive = false;
    }
  }

  pop() {
    if (!this.alive) return;
    this.captured = false;
    this.popTimer = 1.0;
    this.alive = false;
  }

  draw(ctx) {
    if (!this.alive && this.popTimer <= 0) return;
    const a = this.popTimer > 0 ? this.popTimer : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const scale = this.popTimer > 0 ? 1 + (1 - this.popTimer) * 0.5 : 1;
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.translate(-this.x, -this.y);
    drawBubble(ctx, this.x, this.y, this.r, true);
    ctx.restore();
  }
}

class BouncePad {
  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.bounceAnim = 0;
  }

  update(dt) {
    if (this.bounceAnim > 0) this.bounceAnim -= dt * 5;
  }

  trigger() { this.bounceAnim = 1; }

  draw(ctx) {
    const squish = 1 + this.bounceAnim * 0.3;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, squish);
    ctx.translate(-this.x, -this.y);
    drawBouncepad(ctx, this.x, this.y, this.w, this.h);
    ctx.restore();
  }

  // Returns true if bean collides (from above)
  checkBounce(bean) {
    const bx = bean.x, by = bean.y, br = bean.r;
    const left = this.x - this.w / 2, right = this.x + this.w / 2;
    const top = this.y - this.h / 2, bot = this.y + this.h / 2;
    if (bx + br >= left && bx - br <= right && by + br >= top && by - br <= bot) {
      const v = bean.vel();
      if (v.vy > 0) { // moving downward
        bean.point.y = top - br;
        bean.point.py = bean.point.y + v.vy * 0.65; // bounce with energy
        this.trigger();
        return true;
      }
    }
    return false;
  }
}

class AnchorPeg {
  constructor(x, y) {
    this.x = x; this.y = y;
  }
  draw(ctx) {
    drawPeg(ctx, this.x, this.y);
  }
}
