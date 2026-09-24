// ===================== PARTICLES =====================
class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life || 1.0;
    this.maxLife = life || 1.0;
    this.size = size || 4;
    this.dead = false;
  }
  update(dt) {
    this.vy += CFG.GRAVITY * 0.18 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= dt * 1.8;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    const s = this.size * a;
    ctx.beginPath();
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class RopeFiber extends Particle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 200;
    super(x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 100,
      Math.random() > 0.5 ? CFG.C.ropeA : CFG.C.ropeB,
      0.6 + Math.random() * 0.5,
      2 + Math.random() * 3
    );
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 8;
    this.len = 8 + Math.random() * 14;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(-this.len / 2, 0);
    ctx.lineTo(this.len / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  update(dt) {
    super.update(dt);
    this.angle += this.spin * dt;
  }
}

class StarSparkle extends Particle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 260;
    super(x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 150,
      Math.random() > 0.4 ? CFG.C.starShine : CFG.C.ethGold,
      0.7 + Math.random() * 0.6,
      3 + Math.random() * 5
    );
  }
}

class CelebrationBurst extends Particle {
  constructor(x, y, i) {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 200 + Math.random() * 350;
    const colors = [CFG.C.ethGold, CFG.C.ethRed, CFG.C.ethGreen, CFG.C.woodHigh, '#FFFFFF'];
    super(x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 200,
      colors[Math.floor(Math.random() * colors.length)],
      1.0 + Math.random() * 0.5,
      4 + Math.random() * 7
    );
  }
}

class ParticleSystem {
  constructor() { this.particles = []; }

  emit(p) { this.particles.push(p); }

  ropecut(x, y) {
    for (let i = 0; i < 14; i++) this.emit(new RopeFiber(x, y));
  }

  starCollect(x, y) {
    for (let i = 0; i < 18; i++) this.emit(new StarSparkle(x, y));
  }

  celebrate(x, y) {
    for (let i = 0; i < 24; i++) this.emit(new CelebrationBurst(x, y, i));
    for (let i = 0; i < 10; i++) this.emit(new StarSparkle(x, y));
  }

  beanTrail(x, y, vx, vy) {
    if (Math.random() > 0.4) {
      const p = new Particle(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        vx * -0.1 + (Math.random() - 0.5) * 30,
        vy * -0.1 + (Math.random() - 0.5) * 30,
        'rgba(180,70,10,0.7)',
        0.3 + Math.random() * 0.3,
        2 + Math.random() * 3
      );
      this.emit(p);
    }
  }

  update(dt) {
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => !p.dead);
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
  }
}
