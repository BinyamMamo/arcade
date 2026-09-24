// ===================== MAIN GAME =====================
const W = 1920, H = 1080; // logical resolution

const STATE = {
  INTRO:    'intro',
  PLAYING:  'playing',
  WIN:      'win',
  FAIL:     'fail',
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');

    this.state      = STATE.INTRO;
    this.levelIndex = 0;
    this.starsGot   = 0;
    this.totalStars = [0, 0, 0, 0, 0, 0, 0]; // per-level best

    this.level   = null; // current built level objects
    this.ps      = new ParticleSystem();

    this.overlayAnim = 0;
    this.introAnim   = 0;
    this.winDelay    = 0;

    // Cursor blade trail
    this.blade = []; // [{x,y}] recent mouse positions

    // Retry & next button positions (logical)
    this.retryBtn = { x: W / 2 - 80, y: H / 2 + 80, r: 44 };
    this.nextBtn  = { x: W / 2 + 80, y: H / 2 + 80, r: 44 };

    this.input = new InputHandler(
      this.canvas,
      (x1, y1, x2, y2) => this._onCut(x1, y1, x2, y2),
      (x,  y)           => this._onTap(x, y),
      ()                => this._nextLevel()
    );

    this._resize();
    window.addEventListener('resize', () => this._resize());

    this._loadLevel(0);
    this.state = STATE.INTRO;
    this.introAnim = 0;

    this._lastTime = null;
    requestAnimationFrame(t => this._loop(t));
  }

  _resize() {
    const cw = window.innerWidth, ch = window.innerHeight;
    this.canvas.width  = cw;
    this.canvas.height = ch;

    // Letterbox scale to fit W×H logical space
    const scaleX = cw / W, scaleY = ch / H;
    this.scale = Math.min(scaleX, scaleY);
    this.offX  = (cw - W * this.scale) / 2;
    this.offY  = (ch - H * this.scale) / 2;

    this.input.setScale(this.scale, this.scale, this.offX, this.offY);
  }

  _loadLevel(idx) {
    this.levelIndex = idx;
    this.ps = new ParticleSystem();
    this.level = buildLevel(LEVEL_DEFS[idx], W, H);
    this.starsGot = 0;
    this.overlayAnim = 0;
    this.winDelay = 0;
    Rope._nextId = 0;
  }

  _onCut(x1, y1, x2, y2) {
    if (this.state !== STATE.PLAYING) return;
    const lv = this.level;

    for (const rope of lv.ropes) {
      if (rope.cut) continue;
      const ci = rope.checkCut(x1, y1, x2, y2);
      if (ci !== -1) {
        const pos = rope.cutAt(ci);
        this.ps.ropecut(pos.x, pos.y);
        // Add blade flash
        this.blade = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        this.bladeTimer = 1.0;
        this._audio('cut');
        break;
      }
    }
  }

  _onTap(x, y) {
    if (this.state === STATE.WIN || this.state === STATE.FAIL) {
      // Check retry btn
      if (dist(x, y, this.retryBtn.x, this.retryBtn.y) < this.retryBtn.r + 12) {
        this._loadLevel(this.levelIndex);
        this.state = STATE.PLAYING;
        return;
      }
      // Check next btn (only on win)
      if (this.state === STATE.WIN &&
          dist(x, y, this.nextBtn.x, this.nextBtn.y) < this.nextBtn.r + 12) {
        this._nextLevel();
        return;
      }
    }
    if (this.state === STATE.INTRO) {
      this.state = STATE.PLAYING;
    }
  }

  _nextLevel() {
    const next = (this.levelIndex + 1) % LEVEL_DEFS.length;
    this._loadLevel(next);
    this.state = STATE.PLAYING;
  }

  _audio(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'cut') {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.type = 'sawtooth';
      } else if (type === 'star') {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.type = 'sine';
      } else if (type === 'win') {
        for (let i = 0; i < 3; i++) {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(ctx.destination);
          const freqs = [440, 550, 660];
          o2.frequency.setValueAtTime(freqs[i], ctx.currentTime + i * 0.13);
          g2.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.13);
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.3);
          o2.type = 'sine';
          o2.start(ctx.currentTime + i * 0.13);
          o2.stop(ctx.currentTime + i * 0.13 + 0.32);
        }
      } else if (type === 'fail') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.type = 'sawtooth';
      } else if (type === 'bounce') {
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.type = 'square';
      }
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }

  _update(dt) {
    const lv = this.level;

    if (this.state === STATE.INTRO) {
      this.introAnim = Math.min(1, this.introAnim + dt * 1.5);
      this.ps.update(dt);
      lv.cup.update(dt, lv.bean); // keep the mascot alive & inviting
      return;
    }

    if (this.state === STATE.WIN || this.state === STATE.FAIL) {
      this.overlayAnim = Math.min(1, this.overlayAnim + dt * 2.8);
      this.ps.update(dt);
      lv.cup.update(dt, lv.bean); // finish the happy chomp/hop
      return;
    }

    // --- PLAYING ---
    // Physics update
    for (const rope of lv.ropes) rope.update(dt);
    lv.bean.update(dt);
    this.ps.update(dt);

    // Sync bean with all active rope tips
    // (shared point already handles position, just constraint-solve extra ropes)
    for (let ri = 1; ri < lv.ropes.length; ri++) {
      const rope = lv.ropes[ri];
      const c = rope.constraints[rope.constraints.length - 1];
      if (!c.cut) c.solve(); // extra solve to keep shared point correct
    }

    const bean = lv.bean;

    // Bubble interaction
    for (const bubble of lv.bubbles) {
      bubble.update(dt);
      if (bubble.alive && !bubble.captured) {
        const d = dist(bean.x, bean.y, bubble.x, bubble.y);
        if (d < CFG.BUBBLE_CAPTURE_R) {
          bubble.captured = true;
          bean.inBubble = bubble;
          // Kill candy velocity on capture
          bean.point.px = bean.point.x;
          bean.point.py = bean.point.y;
        }
      }
      // Pop bubble if all ropes connected to candy are cut
      if (bubble.captured && bubble.alive) {
        const allCut = lv.ropes.every(r =>
          r.constraints.some(c => c.cut)
        );
        // Move bubble upward with candy
        bubble.y -= 85 * dt;
        if (bean.y < H * 0.08) bubble.pop();
      }
    }

    // Bounce pads
    for (const pad of lv.pads) {
      pad.update(dt);
      if (pad.checkBounce(bean)) {
        this._audio('bounce');
      }
    }

    // Star collection
    for (const star of lv.stars) {
      if (star.collected) { star.update(dt); continue; }
      star.update(dt);
      if (dist(bean.x, bean.y, star.x, star.y) < CFG.STAR_COLLECT_R) {
        star.collected = true;
        this.starsGot++;
        this.ps.starCollect(star.x, star.y);
        this._audio('star');
      }
    }

    // Bean trail
    const v = bean.vel();
    const speed = Math.hypot(v.vx, v.vy);
    if (speed > 3) this.ps.beanTrail(bean.x, bean.y, v.vx, v.vy);

    // Cup collection
    if (!lv.cup.collected) {
      const d = dist(bean.x, bean.y, lv.cup.x, lv.cup.y);
      if (d < CFG.CUP_COLLECT_R) {
        lv.cup.lit = true;
        // Check if bean's velocity is plausible (moving toward cup)
        lv.cup.collected = true;
        this.ps.celebrate(lv.cup.x, lv.cup.y);
        this._audio('win');
        // Save star count
        const prev = this.totalStars[this.levelIndex] || 0;
        this.totalStars[this.levelIndex] = Math.max(prev, this.starsGot);
        this.winDelay = CFG.WIN_DELAY;
        this.state = STATE.WIN;
        return;
      }
    }
    lv.cup.update(dt, bean);

    // Fail condition — bean leaves the screen
    if (bean.y > H + 80) {
      this._audio('fail');
      this.state = STATE.FAIL;
      return;
    }
    // All ropes cut AND bean not in bubble — start falling
    // (physics handles it naturally, just check fail from above)

    // Blade trail fade
    if (this.blade.length > 0) {
      this.bladeTimer = (this.bladeTimer || 0) - dt * 4;
      if (this.bladeTimer < 0) this.blade = [];
    }
  }

  _draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width, ch = this.canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.scale(this.scale, this.scale);

    // Background
    drawWoodBackground(ctx, W, H);
    drawEthiopianSilhouette(ctx, W, H);

    // Scattered cross engravings on background
    const crosses = [
      [0.15, 0.25], [0.85, 0.30], [0.50, 0.70],
      [0.25, 0.65], [0.75, 0.60], [0.10, 0.55], [0.90, 0.55]
    ];
    for (const [fx, fy] of crosses) {
      drawEthiopianCross(ctx, fx * W, fy * H, 90, CFG.C.woodLight, 0.09);
    }

    const lv = this.level;

    if (this.state === STATE.INTRO) {
      // Animated intro: entities fade in
      const a = easeOut(this.introAnim);
      ctx.save();
      ctx.globalAlpha = a;
      this._drawLevel(ctx);
      ctx.restore();

      // Intro pulse on cup
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
      const gl = ctx.createRadialGradient(lv.cup.x, lv.cup.y, 0, lv.cup.x, lv.cup.y, 90);
      gl.addColorStop(0, 'rgba(255,200,40,0.4)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(lv.cup.x, lv.cup.y, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else {
      this._drawLevel(ctx);

      if (this.state === STATE.WIN) {
        // Collection glow
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.overlayAnim * 2);
        const lv2 = this.level;
        const gl2 = ctx.createRadialGradient(lv2.cup.x, lv2.cup.y, 0, lv2.cup.x, lv2.cup.y, 160);
        gl2.addColorStop(0, 'rgba(255,210,40,0.50)');
        gl2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl2;
        ctx.beginPath();
        ctx.arc(lv2.cup.x, lv2.cup.y, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawWinOverlay(ctx, W, H, this.overlayAnim);
        this._drawButtons(ctx, true);
      }

      if (this.state === STATE.FAIL) {
        drawFailOverlay(ctx, W, H, this.overlayAnim);
        this._drawButtons(ctx, false);
      }
    }

    // Particles always on top
    this.ps.draw(ctx);

    // Blade trail
    if (this.blade.length === 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,220,100,0.72)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,200,40,0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.blade[0].x, this.blade[0].y);
      ctx.lineTo(this.blade[1].x, this.blade[1].y);
      ctx.stroke();
      ctx.restore();
    }

    // HUD
    drawHUD(ctx, W, H, this.levelIndex + 1, this.starsGot, 3);

    ctx.restore();
  }

  _drawLevel(ctx) {
    const lv = this.level;

    // Bounce pads
    for (const pad of lv.pads) pad.draw(ctx);

    // Stars
    for (const star of lv.stars) star.draw(ctx);

    // Bubbles
    for (const b of lv.bubbles) b.draw(ctx);

    // Tej cup
    lv.cup.draw(ctx);

    // Pegs
    for (const peg of lv.pegs) peg.draw(ctx);

    // Ropes
    for (const rope of lv.ropes) drawRope(ctx, rope);

    // Coffee bean
    lv.bean.draw(ctx);
  }

  _drawButtons(ctx, showNext) {
    drawRetryBtn(ctx, this.retryBtn.x, this.retryBtn.y, this.retryBtn.r);
    if (showNext) {
      // Next level button
      ctx.save();
      const g = ctx.createRadialGradient(
        this.nextBtn.x - 14, this.nextBtn.y - 14, 0,
        this.nextBtn.x, this.nextBtn.y, this.nextBtn.r
      );
      g.addColorStop(0, CFG.C.woodLight);
      g.addColorStop(0.6, CFG.C.woodMid);
      g.addColorStop(1, CFG.C.woodDark);
      ctx.fillStyle = g;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.nextBtn.x, this.nextBtn.y, this.nextBtn.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Forward arrow ▶
      ctx.fillStyle = CFG.C.woodHigh;
      ctx.beginPath();
      const nx = this.nextBtn.x, ny = this.nextBtn.y, nr = this.nextBtn.r;
      ctx.moveTo(nx - nr * 0.28, ny - nr * 0.42);
      ctx.lineTo(nx + nr * 0.42, ny);
      ctx.lineTo(nx - nr * 0.28, ny + nr * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  _loop(timestamp) {
    if (this._lastTime === null) this._lastTime = timestamp;
    let dt = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;
    dt = Math.min(dt, 0.05); // cap at 50ms to avoid huge jumps

    this._update(dt);
    this._draw();

    requestAnimationFrame(t => this._loop(t));
  }
}

// Boot
window.addEventListener('load', () => {
  window._game = new Game();
});
