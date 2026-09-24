/* =========================================================================
   SNAKE XENZIA — HTML5 Canvas clone
   Pure vanilla JS. Everything (sprites, UI, FX) is hand-drawn on the canvas
   so the whole look is fully art-directable. Landscape, fullscreen, touch.
   ========================================================================= */
(() => {
  'use strict';

  // ---- Palette (warm retro LCD green + amber arcade chrome; no blue/purple) --
  const C = {
    lcd0:        '#0c2412', // playfield dark
    lcd1:        '#0a1d0e', // playfield darker (checker)
    grid:        'rgba(120, 200, 110, 0.05)',
    scan:        'rgba(0, 0, 0, 0.10)',
    frameOuter:  '#07120a',
    frameBevelHi:'#3c6b2e',
    frameBevelLo:'#08160c',
    frameEdge:   '#9bd16a',
    snakeHi:     '#c4ff63',
    snakeMid:    '#5fc23a',
    snakeLo:     '#2f7d1f',
    snakeLine:   '#16480f',
    belly:       '#e8ffc0',
    eye:         '#fbfff2',
    pupil:       '#11270a',
    tongue:      '#ff5566',
    apple:       '#ff5a47',
    appleDark:   '#c8201a',
    appleShine:  '#ffd9cf',
    leaf:        '#7ed957',
    leafDark:    '#4a9e2f',
    stem:        '#7a4a22',
    hud:         '#cdeeaa',
    hudDim:      'rgba(205, 238, 170, 0.55)',
    gold:        '#f5c542',
    goldDark:    '#b9892a',
    danger:      '#ff5a47',
    ui:          '#bdf08a',
    uiSoft:      'rgba(189, 240, 138, 0.16)',
  };

  // ---- Tunables ----
  const TARGET_ROWS = 16;      // coarse, classic Nokia feel
  const TICK_START  = 145;     // ms per step at game start
  const TICK_MIN    = 72;      // fastest
  const TICK_STEP   = 3.2;     // speed-up per food eaten
  const SWIPE_MIN   = 22;      // px before a swipe registers

  // ---- Canvas / sizing ----
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const rotateEl = document.getElementById('rotate');

  let W = 0, H = 0, DPR = 1;
  let cell = 24, cols = 20, rows = 16, ox = 0, oy = 0; // board geometry (logical px)
  let hudH = 60;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Portrait phones -> ask to rotate (skip the gate on wide desktops)
    const portrait = H > W && Math.min(W, H) < 640;
    rotateEl.hidden = !portrait;

    layoutBoard();
  }

  function layoutBoard() {
    const pad = Math.round(Math.min(W, H) * 0.03);
    hudH = Math.max(52, Math.round(H * 0.12));
    const frame = Math.max(10, Math.round(Math.min(W, H) * 0.022));

    const availW = W - pad * 2 - frame * 2;
    const availH = H - hudH - pad - frame * 2;

    rows = TARGET_ROWS;
    cell = Math.floor(availH / rows);
    cols = Math.floor(availW / cell);
    if (cols < 8) cols = 8;

    const boardW = cols * cell;
    const boardH = rows * cell;
    ox = Math.round((W - boardW) / 2);
    oy = Math.round(hudH + frame + (availH - boardH) / 2);
    layoutBoard.frame = frame;
  }

  // ---- Game state ----
  const ST = { MENU: 0, PLAY: 1, PAUSE: 2, OVER: 3 };
  let state = ST.MENU;

  let snake = [];          // [{x,y}] head first
  let dirQueue = [];       // buffered directions
  let dir = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };
  let prevTail = { x: 0, y: 0 };
  let grew = false;
  let score = 0;
  let best = +(localStorage.getItem('snakexenzia.best') || 0);
  let tickMs = TICK_START;
  let acc = 0;             // ms accumulated toward next tick
  let particles = [];
  let shake = 0;
  let foodPulse = 0;
  let tongue = 0;          // tongue flick timer
  let soundOn = localStorage.getItem('snakexenzia.sound') !== 'off';
  let menuT = 0;           // menu animation clock

  function resetGame() {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    snake = [
      { x: cx,     y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    grew = false;
    score = 0;
    tickMs = TICK_START;
    acc = 0;
    particles = [];
    shake = 0;
    placeFood();
  }

  function placeFood() {
    const free = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
    food = free.length ? free[(Math.random() * free.length) | 0] : { x: 0, y: 0 };
    foodPulse = 0;
  }

  // ---- Input handling -------------------------------------------------------
  function queueDir(nx, ny) {
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (nx === -last.x && ny === -last.y) return; // no instant reverse
    if (nx === last.x && ny === last.y) return;   // no duplicate
    if (dirQueue.length < 2) dirQueue.push({ x: nx, y: ny });
  }

  function startGame() {
    resetGame();
    state = ST.PLAY;
    beep('start');
  }

  function onAction() { // play / retry depending on state
    if (state === ST.MENU || state === ST.OVER) startGame();
    else if (state === ST.PAUSE) state = ST.PLAY;
    else if (state === ST.PLAY) state = ST.PAUSE;
  }

  // Keyboard
  window.addEventListener('keydown', (e) => {
    ensureAudio();
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': queueDir(0, -1); break;
      case 'ArrowDown': case 's': case 'S': queueDir(0, 1); break;
      case 'ArrowLeft': case 'a': case 'A': queueDir(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': queueDir(1, 0); break;
      case ' ': case 'Enter': onAction(); break;
      case 'p': case 'P':
        if (state === ST.PLAY) state = ST.PAUSE;
        else if (state === ST.PAUSE) state = ST.PLAY;
        break;
      default: return;
    }
    e.preventDefault();
  }, { passive: false });

  // Pointer (touch + mouse)
  let swipe = null;
  function localPt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    ensureAudio();
    goFullscreen();
    const p = localPt(e);

    // UI buttons take priority
    if (hit(p, btnSound())) { soundOn = !soundOn; localStorage.setItem('snakexenzia.sound', soundOn ? 'on' : 'off'); beep('click'); return; }

    if (state === ST.MENU)  { if (hit(p, btnPlay()))  onAction(); return; }
    if (state === ST.OVER)  { if (hit(p, btnPlay()))  onAction(); return; }
    if (state === ST.PAUSE) { if (hit(p, btnPlay()))  state = ST.PLAY; return; }

    // PLAY: pause button, then d-pad, then swipe field
    if (hit(p, btnPause())) { state = ST.PAUSE; return; }
    if (dpadDir(p)) return;

    swipe = { x: p.x, y: p.y, used: false, id: e.pointerId };
  }, { passive: false });

  canvas.addEventListener('pointermove', (e) => {
    if (!swipe || swipe.used || e.pointerId !== swipe.id) return;
    const p = localPt(e);
    const dx = p.x - swipe.x, dy = p.y - swipe.y;
    if (Math.hypot(dx, dy) < SWIPE_MIN) return;
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 1 : -1, 0);
    else queueDir(0, dy > 0 ? 1 : -1);
    swipe.used = true;
  }, { passive: false });

  function endSwipe(e) { if (swipe && e.pointerId === swipe.id) swipe = null; }
  canvas.addEventListener('pointerup', endSwipe);
  canvas.addEventListener('pointercancel', endSwipe);

  // d-pad hit test -> returns true if a direction was issued
  function dpadDir(p) {
    const d = dpad();
    const dx = p.x - d.cx, dy = p.y - d.cy;
    if (Math.hypot(dx, dy) > d.r * 1.15) return false;
    if (Math.hypot(dx, dy) < d.r * 0.32) return true; // dead-centre, swallow tap
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 1 : -1, 0);
    else queueDir(0, dy > 0 ? 1 : -1);
    return true;
  }

  // ---- UI geometry (used for both drawing & hit-testing) --------------------
  function btnPause() { const r = Math.max(16, hudH * 0.30); return { x: W - r - 18, y: hudH / 2, r, shape: 'c' }; }
  function btnSound() { const r = Math.max(14, hudH * 0.26); return { x: W - r * 2 - 18 - 44, y: hudH / 2, r, shape: 'c' }; }
  function btnPlay()  { const r = Math.min(W, H) * 0.13;       return { x: W / 2, y: H * 0.6, r, shape: 'c' }; }
  function dpad()     { const r = Math.min(W, H) * 0.12; return { cx: r + Math.min(W, H) * 0.04, cy: H - r - Math.min(W, H) * 0.04, r }; }
  function hit(p, b)  { return Math.hypot(p.x - b.x, p.y - b.y) <= b.r; }

  // ---- Simulation -----------------------------------------------------------
  function step() {
    if (dirQueue.length) dir = dirQueue.shift();

    const head = snake[0];
    const nx = head.x + dir.x;
    const ny = head.y + dir.y;

    // Wall collision -> death (classic bordered arcade rules)
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return die();

    // Self collision (the tail cell is free if we're not growing)
    const willGrow = (nx === food.x && ny === food.y);
    const body = willGrow ? snake : snake.slice(0, -1);
    if (body.some(s => s.x === nx && s.y === ny)) return die();

    snake.unshift({ x: nx, y: ny });
    if (willGrow) {
      prevTail = { ...snake[snake.length - 1] };
      grew = true;
      score++;
      tickMs = Math.max(TICK_MIN, TICK_START - score * TICK_STEP);
      burst(food.x, food.y);
      beep('eat');
      placeFood();
    } else {
      prevTail = snake.pop();
      grew = false;
    }
  }

  function die() {
    beep('die');
    shake = 14;
    if (score > best) { best = score; localStorage.setItem('snakexenzia.best', best); }
    state = ST.OVER;
  }

  function burst(cx, cy) {
    const px = ox + cx * cell + cell / 2;
    const py = oy + cy * cell + cell / 2;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.05 + Math.random() * 0.14;
      particles.push({
        x: px, y: py,
        vx: Math.cos(a) * sp * cell, vy: Math.sin(a) * sp * cell - 0.06 * cell,
        life: 1, r: 1 + Math.random() * (cell * 0.12),
        c: Math.random() < 0.5 ? C.apple : C.appleShine,
      });
    }
  }

  // ---- Audio (tiny WebAudio synth) -----------------------------------------
  let AC = null;
  function ensureAudio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
    if (AC && AC.state === 'suspended') AC.resume();
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (!soundOn || !AC) return;
    const t = AC.currentTime;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function beep(kind) {
    if (kind === 'eat')   { tone(620, 0.07, 'square', 0.18); tone(880, 0.09, 'square', 0.12, 1000); }
    else if (kind === 'die')   { tone(300, 0.45, 'sawtooth', 0.20, 70); }
    else if (kind === 'start') { tone(440, 0.08, 'square', 0.16); setTimeout(() => tone(660, 0.12, 'square', 0.16, 880), 90); }
    else if (kind === 'click') { tone(520, 0.05, 'square', 0.14); }
  }

  // ---- Fullscreen / orientation --------------------------------------------
  let fsTried = false;
  function goFullscreen() {
    if (fsTried) return; fsTried = true;
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fn) Promise.resolve(fn.call(el)).catch(() => {});
    if (screen.orientation && screen.orientation.lock)
      screen.orientation.lock('landscape').catch(() => {});
  }

  // =========================================================================
  //  RENDER
  // =========================================================================
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(48, now - last);
    last = now;
    update(dt);
    draw(dt);
    requestAnimationFrame(frame);
  }

  function update(dt) {
    menuT += dt;
    foodPulse += dt;
    tongue += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 0.05);

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.012 * cell; p.life -= dt / 520;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (state === ST.PLAY) {
      acc += dt;
      while (acc >= tickMs) { acc -= tickMs; step(); if (state !== ST.PLAY) break; }
    }
  }

  function cellCenter(x, y) { return { px: ox + x * cell + cell / 2, py: oy + y * cell + cell / 2 }; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // screen shake
    ctx.save();
    if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    drawFrame();
    drawPlayfield();
    drawFood();
    drawSnake();
    drawParticles();

    ctx.restore();

    drawHUD();

    if (state === ST.MENU)  drawMenu();
    if (state === ST.PAUSE) drawPause();
    if (state === ST.OVER)  drawOver();
  }

  // --- Arcade frame around the board ---
  function drawFrame() {
    const f = layoutBoard.frame;
    const x = ox - f, y = oy - f, w = cols * cell + f * 2, h = rows * cell + f * 2;
    const r = f * 0.9;
    roundRect(x - f * 0.5, y - f * 0.5, w + f, h + f, r + f * 0.5);
    ctx.fillStyle = C.frameOuter; ctx.fill();

    // bevel
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, C.frameBevelHi);
    g.addColorStop(0.5, '#1a3d18');
    g.addColorStop(1, C.frameBevelLo);
    roundRect(x, y, w, h, r);
    ctx.fillStyle = g; ctx.fill();

    // inner glowing edge
    roundRect(x + f * 0.5, y + f * 0.5, w - f, h - f, r * 0.7);
    ctx.strokeStyle = C.frameEdge; ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.stroke();
    ctx.globalAlpha = 1;

    // inset dark playfield rim
    roundRect(ox - 2, oy - 2, cols * cell + 4, rows * cell + 4, 6);
    ctx.fillStyle = C.lcd1; ctx.fill();
  }

  // --- LCD playfield: checker + grid + scanlines ---
  function drawPlayfield() {
    ctx.save();
    roundRect(ox, oy, cols * cell, rows * cell, 4);
    ctx.clip();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = ((x + y) & 1) ? C.lcd0 : C.lcd1;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
    // grid lines
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) { ctx.moveTo(ox + x * cell + 0.5, oy); ctx.lineTo(ox + x * cell + 0.5, oy + rows * cell); }
    for (let y = 0; y <= rows; y++) { ctx.moveTo(ox, oy + y * cell + 0.5); ctx.lineTo(ox + cols * cell, oy + y * cell + 0.5); }
    ctx.stroke();

    // scanlines
    ctx.fillStyle = C.scan;
    for (let yy = oy; yy < oy + rows * cell; yy += 3) ctx.fillRect(ox, yy, cols * cell, 1);
    ctx.restore();
  }

  // --- Apple food ---
  function drawFood() {
    const { px, py } = cellCenter(food.x, food.y);
    const pulse = 1 + Math.sin(foodPulse / 260) * 0.06;
    const r = cell * 0.34 * pulse;

    ctx.save();
    ctx.translate(px, py);

    // soft glow
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,90,71,0.18)';
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2); ctx.fill();

    // body
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.2, 0, 0, r);
    g.addColorStop(0, C.apple); g.addColorStop(1, C.appleDark);
    ctx.beginPath(); ctx.fillStyle = g;
    ctx.arc(0, r * 0.05, r, 0, Math.PI * 2); ctx.fill();

    // shine
    ctx.beginPath(); ctx.fillStyle = C.appleShine; ctx.globalAlpha = 0.85;
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.22, r * 0.32, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // stem
    ctx.strokeStyle = C.stem; ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(r * 0.18, -r * 1.2, r * 0.05, -r * 1.35); ctx.stroke();

    // leaf
    ctx.beginPath();
    const lg = ctx.createLinearGradient(0, -r, r, -r * 1.4);
    lg.addColorStop(0, C.leaf); lg.addColorStop(1, C.leafDark);
    ctx.fillStyle = lg;
    ctx.ellipse(r * 0.45, -r * 1.15, r * 0.42, r * 0.2, -0.7, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  // --- Snake with interpolated, rounded body + detailed head ---
  function drawSnake() {
    const t = state === ST.PLAY ? Math.min(1, acc / tickMs) : 1;
    const n = snake.length;

    // interpolated pixel positions per segment
    const pts = [];
    for (let i = 0; i < n; i++) {
      const cur = snake[i];
      const from = (i < n - 1) ? snake[i + 1] : prevTail;
      const fx = from ? from.x : cur.x;
      const fy = from ? from.y : cur.y;
      pts.push({
        x: ox + lerp(fx, cur.x, t) * cell + cell / 2,
        y: oy + lerp(fy, cur.y, t) * cell + cell / 2,
      });
    }

    // shadow
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawSnakePath(pts, cell * 0.86);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = cell * 0.86; ctx.translate(0, cell * 0.08); ctx.stroke();
    ctx.restore();

    // outline
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawSnakePath(pts, cell * 0.9);
    ctx.strokeStyle = C.snakeLine; ctx.lineWidth = cell * 0.9; ctx.stroke();

    // body fill (gradient along the board for sheen)
    const bg = ctx.createLinearGradient(0, oy, 0, oy + rows * cell);
    bg.addColorStop(0, C.snakeHi); bg.addColorStop(0.5, C.snakeMid); bg.addColorStop(1, C.snakeLo);
    drawSnakePath(pts, cell * 0.72);
    ctx.strokeStyle = bg; ctx.lineWidth = cell * 0.72; ctx.stroke();

    // belly highlight
    drawSnakePath(pts, cell * 0.30);
    ctx.strokeStyle = 'rgba(232,255,192,0.35)'; ctx.lineWidth = cell * 0.30; ctx.stroke();
    ctx.restore();

    // scale dots
    ctx.fillStyle = 'rgba(22,72,15,0.45)';
    for (let i = 1; i < pts.length; i += 1) {
      if (i % 2) continue;
      ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, cell * 0.08, 0, Math.PI * 2); ctx.fill();
    }

    drawHead(pts[0]);
  }

  function drawSnakePath(pts, _w) {
    ctx.beginPath();
    if (!pts.length) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }

  function drawHead(h) {
    if (!h) return;
    const ang = Math.atan2(dir.y, dir.x);
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(ang);

    const R = cell * 0.46;

    // head capsule
    const g = ctx.createLinearGradient(0, -R, 0, R);
    g.addColorStop(0, C.snakeHi); g.addColorStop(1, C.snakeMid);
    roundRectPath(-R * 0.9, -R, R * 2, R * 2, R * 0.7);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(2, cell * 0.08); ctx.strokeStyle = C.snakeLine; ctx.stroke();

    // tongue (flicks while playing)
    if (state === ST.PLAY && (tongue % 700) < 220) {
      ctx.strokeStyle = C.tongue; ctx.lineWidth = Math.max(1.5, cell * 0.06); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(R * 0.9, 0); ctx.lineTo(R * 1.35, 0);
      ctx.moveTo(R * 1.35, 0); ctx.lineTo(R * 1.6, -cell * 0.08);
      ctx.moveTo(R * 1.35, 0); ctx.lineTo(R * 1.6, cell * 0.08);
      ctx.stroke();
    }

    // eyes
    const ex = R * 0.25, ey = R * 0.5, er = R * 0.34;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.fillStyle = C.eye;
      ctx.arc(ex, ey * s, er, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = C.pupil;
      ctx.arc(ex + er * 0.35, ey * s, er * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- HUD (numeric only — no words) ----
  function drawHUD() {
    // score (apple icon + number, left)
    const cy = hudH / 2;
    miniApple(26, cy, hudH * 0.20);
    ctx.fillStyle = C.hud;
    ctx.font = `700 ${Math.round(hudH * 0.42)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(String(score), 26 + hudH * 0.34, cy + 1);

    // best (trophy + number, centre-left of buttons)
    const bx = W / 2;
    trophy(bx - 20, cy, hudH * 0.22);
    ctx.fillStyle = C.gold;
    ctx.font = `700 ${Math.round(hudH * 0.34)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(String(best), bx + 4, cy + 1);

    // buttons
    drawSoundBtn(btnSound());
    if (state === ST.PLAY || state === ST.PAUSE) drawPauseBtn(btnPause());

    // d-pad while playing
    if (state === ST.PLAY) drawDpad();
  }

  function miniApple(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, C.apple); g.addColorStop(1, C.appleDark);
    ctx.beginPath(); ctx.fillStyle = g; ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.leaf; ctx.lineWidth = r * 0.18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(r * 0.4, -r * 1.1); ctx.stroke();
    ctx.restore();
  }

  function trophy(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.goldDark; ctx.lineWidth = r * 0.12;
    // cup
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r);
    ctx.lineTo(r * 0.7, -r);
    ctx.lineTo(r * 0.45, r * 0.1);
    ctx.quadraticCurveTo(0, r * 0.5, -r * 0.45, r * 0.1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // handles
    ctx.beginPath(); ctx.arc(-r * 0.7, -r * 0.55, r * 0.35, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.55, r * 0.35, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    // base
    ctx.fillRect(-r * 0.12, r * 0.1, r * 0.24, r * 0.5);
    ctx.fillRect(-r * 0.5, r * 0.6, r, r * 0.3);
    ctx.restore();
  }

  function drawPauseBtn(b) {
    circleBtn(b);
    ctx.fillStyle = C.ui;
    const w = b.r * 0.22, h = b.r * 0.7;
    ctx.fillRect(b.x - w * 1.6, b.y - h / 2, w, h);
    ctx.fillRect(b.x + w * 0.6, b.y - h / 2, w, h);
  }

  function drawSoundBtn(b) {
    circleBtn(b);
    ctx.save(); ctx.translate(b.x, b.y); ctx.fillStyle = C.ui; ctx.strokeStyle = C.ui;
    const s = b.r * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.4); ctx.lineTo(-s * 0.2, -s * 0.4);
    ctx.lineTo(s * 0.4, -s); ctx.lineTo(s * 0.4, s); ctx.lineTo(-s * 0.2, s * 0.4);
    ctx.lineTo(-s, s * 0.4); ctx.closePath(); ctx.fill();
    ctx.lineWidth = b.r * 0.12; ctx.lineCap = 'round';
    if (soundOn) {
      ctx.beginPath(); ctx.arc(s * 0.5, 0, s * 0.55, -0.8, 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 0.5, 0, s * 0.9, -0.7, 0.7); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.5); ctx.lineTo(s * 1.2, s * 0.5);
      ctx.moveTo(s * 1.2, -s * 0.5); ctx.lineTo(s * 0.6, s * 0.5); ctx.stroke();
    }
    ctx.restore();
  }

  function circleBtn(b) {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = C.uiSoft; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(189,240,138,0.5)'; ctx.stroke();
  }

  function drawDpad() {
    const d = dpad();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,29,14,0.55)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(189,240,138,0.35)'; ctx.stroke();

    ctx.fillStyle = C.ui;
    const a = d.r * 0.34, o = d.r * 0.5;
    const tri = (cx, cy, rot) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, -a * 0.6); ctx.lineTo(a * 0.5, a * 0.4); ctx.lineTo(-a * 0.5, a * 0.4);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    tri(d.cx, d.cy - o, 0);
    tri(d.cx, d.cy + o, Math.PI);
    tri(d.cx - o, d.cy, -Math.PI / 2);
    tri(d.cx + o, d.cy, Math.PI / 2);
    ctx.restore();
  }

  // ---- Overlays ----
  function dim(alpha) {
    ctx.fillStyle = `rgba(3,10,6,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMenu() {
    dim(0.55);
    // coiled-snake mark above the play button
    const cx = W / 2, cy = H * 0.32, s = Math.min(W, H) * 0.12;
    drawLogoSnake(cx, cy, s, menuT);

    // big pulsing PLAY button
    const b = btnPlay();
    const pulse = 1 + Math.sin(menuT / 400) * 0.04;
    playButton(b.x, b.y, b.r * pulse);
    drawSoundBtn(btnSound());
  }

  function drawPause() {
    dim(0.5);
    const b = btnPlay();
    playButton(b.x, b.y, b.r);
  }

  function drawOver() {
    dim(0.62);
    // sad snake / score readout
    const cx = W / 2, cy = H * 0.30, s = Math.min(W, H) * 0.11;
    drawLogoSnake(cx, cy, s, menuT, true);

    // score & best, numeric with icons
    const yy = H * 0.42;
    miniApple(cx - 70, yy, s * 0.22);
    ctx.fillStyle = C.hud; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(s * 0.6)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(String(score), cx - 70 + s * 0.45, yy);

    trophy(cx + 30, yy, s * 0.22);
    ctx.fillStyle = C.gold;
    ctx.fillText(String(best), cx + 30 + s * 0.45, yy);

    // retry button (circular arrow)
    const b = btnPlay();
    retryButton(b.x, b.y, b.r);
    drawSoundBtn(btnSound());
  }

  function playButton(x, y, r) {
    ctx.save();
    const g = ctx.createLinearGradient(x, y - r, x, y + r);
    g.addColorStop(0, C.snakeHi); g.addColorStop(1, C.snakeLo);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(150,240,90,0.5)'; ctx.shadowBlur = 24; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = r * 0.08; ctx.strokeStyle = C.frameEdge; ctx.stroke();
    // triangle
    ctx.fillStyle = C.frameOuter;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, y - r * 0.42);
    ctx.lineTo(x - r * 0.28, y + r * 0.42);
    ctx.lineTo(x + r * 0.48, y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function retryButton(x, y, r) {
    ctx.save();
    const g = ctx.createLinearGradient(x, y - r, x, y + r);
    g.addColorStop(0, C.gold); g.addColorStop(1, C.goldDark);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(245,197,66,0.5)'; ctx.shadowBlur = 24; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = r * 0.08; ctx.strokeStyle = '#ffe79a'; ctx.stroke();
    // circular arrow
    ctx.strokeStyle = C.frameOuter; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, Math.PI * 0.35, Math.PI * 2); ctx.stroke();
    const ax = x + Math.cos(Math.PI * 0.35) * r * 0.42;
    const ay = y + Math.sin(Math.PI * 0.35) * r * 0.42;
    ctx.fillStyle = C.frameOuter;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - r * 0.05, ay - r * 0.28);
    ctx.lineTo(ax + r * 0.26, ay - r * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Stylised coiled snake logo (made of body dots + a head)
  function drawLogoSnake(cx, cy, s, t, sad) {
    ctx.save();
    ctx.translate(cx, cy);
    const seg = 11;
    for (let i = seg - 1; i >= 0; i--) {
      const a = i * 0.55 + t / 600;
      const rad = s * (0.4 + i * 0.07);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad * 0.6;
      const rr = s * (0.16 + (seg - i) / seg * 0.12);
      const g = ctx.createLinearGradient(x, y - rr, x, y + rr);
      g.addColorStop(0, C.snakeHi); g.addColorStop(1, C.snakeMid);
      ctx.beginPath(); ctx.fillStyle = g; ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = s * 0.04; ctx.strokeStyle = C.snakeLine; ctx.stroke();
      if (i === 0) {
        // eyes
        ctx.fillStyle = C.eye;
        ctx.beginPath(); ctx.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + rr * 0.4, y - rr * 0.35, rr * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.pupil;
        const py = sad ? rr * 0.05 : -rr * 0.25;
        ctx.beginPath(); ctx.arc(x - rr * 0.3, y + py, rr * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + rr * 0.4, y + py, rr * 0.14, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---- canvas helpers ----
  function roundRect(x, y, w, h, r) { roundRectPath(x, y, w, h, r); }
  function roundRectPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- boot ----
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();
  resetGame();
  requestAnimationFrame(frame);
})();
