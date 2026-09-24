// ===================== INPUT HANDLER =====================
class InputHandler {
  constructor(canvas, onCut, onRetry, onNextLevel) {
    this.canvas = canvas;
    this.onCut = onCut;
    this.onRetry = onRetry;
    this.onNextLevel = onNextLevel;

    this.mouse = { x: 0, y: 0, down: false };
    this.prevMouse = { x: 0, y: 0 };
    this.swipeFrom = null;
    this.scale = 1; // canvas scale factor

    this._bindEvents();
  }

  setScale(sx, sy, offX, offY) {
    this.sx = sx; this.sy = sy;
    this.offX = offX; this.offY = offY;
  }

  toLogical(clientX, clientY) {
    return {
      x: (clientX - (this.offX || 0)) / (this.sx || 1),
      y: (clientY - (this.offY || 0)) / (this.sy || 1),
    };
  }

  _bindEvents() {
    const c = this.canvas;

    c.addEventListener('mousedown', e => {
      const p = this.toLogical(e.clientX, e.clientY);
      this.mouse.down = true;
      this.mouse.x = p.x; this.mouse.y = p.y;
      this.prevMouse.x = p.x; this.prevMouse.y = p.y;
      this.swipeFrom = { x: p.x, y: p.y };
    });

    c.addEventListener('mousemove', e => {
      const p = this.toLogical(e.clientX, e.clientY);
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
      this.mouse.x = p.x; this.mouse.y = p.y;

      if (this.mouse.down) {
        const moved = Math.hypot(p.x - this.prevMouse.x, p.y - this.prevMouse.y);
        if (moved > 2) {
          this.onCut(this.prevMouse.x, this.prevMouse.y, p.x, p.y);
        }
      }
    });

    c.addEventListener('mouseup', e => {
      const p = this.toLogical(e.clientX, e.clientY);
      if (this.mouse.down && this.swipeFrom) {
        const dx = p.x - this.swipeFrom.x;
        const dy = p.y - this.swipeFrom.y;
        // tap (minimal movement) — check for button presses via game
        if (Math.hypot(dx, dy) < 12) {
          this.onRetry(p.x, p.y);
        }
      }
      this.mouse.down = false;
      this.swipeFrom = null;
    });

    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      const p = this.toLogical(t.clientX, t.clientY);
      this.mouse.down = true;
      this.mouse.x = p.x; this.mouse.y = p.y;
      this.prevMouse.x = p.x; this.prevMouse.y = p.y;
      this.swipeFrom = { x: p.x, y: p.y };
    }, { passive: false });

    c.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const p = this.toLogical(t.clientX, t.clientY);
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
      this.mouse.x = p.x; this.mouse.y = p.y;
      if (this.mouse.down) {
        const moved = Math.hypot(p.x - this.prevMouse.x, p.y - this.prevMouse.y);
        if (moved > 2) {
          this.onCut(this.prevMouse.x, this.prevMouse.y, p.x, p.y);
        }
      }
    }, { passive: false });

    c.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const p = this.toLogical(t.clientX, t.clientY);
      if (this.swipeFrom) {
        const dx = p.x - this.swipeFrom.x;
        const dy = p.y - this.swipeFrom.y;
        if (Math.hypot(dx, dy) < 18) {
          this.onRetry(p.x, p.y);
        }
      }
      this.mouse.down = false;
      this.swipeFrom = null;
    }, { passive: false });
  }
}
