// ===================== DRAW HELPERS =====================
// All drawing uses the logical coordinate system (W x H)

function drawWoodBackground(ctx, W, H) {
  // Deep dark base
  ctx.fillStyle = CFG.C.bgDeep;
  ctx.fillRect(0, 0, W, H);

  // Wood grain overlay via noise stripes
  const grainCtx = ctx;
  for (let y = 0; y < H; y += 3) {
    const n = noise(y * 0.018, 0.5);
    const alpha = 0.06 + n * 0.10;
    grainCtx.fillStyle = `rgba(120,60,10,${alpha})`;
    grainCtx.fillRect(0, y, W, 2);
  }

  // Vertical wood grain lines
  for (let x = 0; x < W; x += 18) {
    const n = noise(x * 0.04, 2.2);
    const alpha = 0.03 + n * 0.06;
    grainCtx.fillStyle = `rgba(80,30,5,${alpha})`;
    grainCtx.fillRect(x, 0, 2 + n * 6, H);
  }

  // Vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function drawEthiopianSilhouette(ctx, W, H) {
  // Lalibela-inspired rock-hewn church silhouette at bottom
  ctx.save();
  ctx.fillStyle = 'rgba(25,10,2,0.88)';
  const base = H * 0.82;

  // Left mountain / rock plateau
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, base + 30);
  ctx.lineTo(W * 0.04, base + 20);
  ctx.lineTo(W * 0.06, base - 10);
  ctx.lineTo(W * 0.09, base + 5);
  ctx.lineTo(W * 0.13, base - 40); // church tower
  ctx.lineTo(W * 0.14, base - 55);
  ctx.lineTo(W * 0.15, base - 55);
  ctx.lineTo(W * 0.155, base - 38);
  ctx.lineTo(W * 0.18, base - 25);
  ctx.lineTo(W * 0.22, base + 15);
  ctx.lineTo(W * 0.28, base);
  ctx.lineTo(W * 0.35, H);
  ctx.closePath();
  ctx.fill();

  // Right mountain / obelisk silhouette
  ctx.beginPath();
  ctx.moveTo(W * 0.65, H);
  ctx.lineTo(W * 0.68, base + 10);
  ctx.lineTo(W * 0.72, base - 20);
  ctx.lineTo(W * 0.76, base - 80); // obelisk
  ctx.lineTo(W * 0.765, base - 115);
  ctx.lineTo(W * 0.77, base - 115);
  ctx.lineTo(W * 0.775, base - 80);
  ctx.lineTo(W * 0.80, base - 60);
  ctx.lineTo(W * 0.83, base - 20);
  ctx.lineTo(W * 0.87, base + 5);
  ctx.lineTo(W * 0.92, base - 10);
  ctx.lineTo(W * 0.95, base + 20);
  ctx.lineTo(W, base + 30);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEthiopianCross(ctx, cx, cy, size, color, alpha) {
  // Classic Ethiopian Orthodox cross silhouette
  ctx.save();
  ctx.globalAlpha = alpha || 0.12;
  ctx.fillStyle = color || CFG.C.woodHigh;
  const s = size;
  ctx.translate(cx, cy);

  // Arms of the cross
  ctx.fillRect(-s * 0.15, -s * 0.5, s * 0.30, s);
  ctx.fillRect(-s * 0.5, -s * 0.15, s, s * 0.30);

  // Decorative tips (trifoil ends)
  const ends = [
    [0, -s * 0.5], [0, s * 0.5],
    [-s * 0.5, 0], [s * 0.5, 0]
  ];
  for (const [ex, ey] of ends) {
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWoodPlank(ctx, x, y, w, h, radius) {
  radius = radius !== undefined ? radius : 10;
  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // Base gradient
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, CFG.C.woodLight);
  g.addColorStop(0.3, CFG.C.woodMid);
  g.addColorStop(0.7, CFG.C.woodDark);
  g.addColorStop(1, '#1A0800');
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Grain lines
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.strokeStyle = CFG.C.woodGrain;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < h; i += 5) {
    const wave = Math.sin(i * 0.3) * 2;
    ctx.beginPath();
    ctx.moveTo(x, y + i + wave);
    ctx.lineTo(x + w, y + i - wave);
    ctx.stroke();
  }
  ctx.restore();

  // Top highlight bevel
  const hi = ctx.createLinearGradient(x, y, x, y + h * 0.28);
  hi.addColorStop(0, 'rgba(255,200,120,0.38)');
  hi.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = hi;
  roundRect(ctx, x, y, w, h * 0.28, radius);
  ctx.fill();

  // Edge shadow (bottom)
  const bot = ctx.createLinearGradient(x, y + h * 0.72, x, y + h);
  bot.addColorStop(0, 'rgba(0,0,0,0)');
  bot.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = bot;
  roundRect(ctx, x + 2, y + h * 0.72, w - 4, h * 0.28, radius);
  ctx.fill();

  ctx.restore();
}

function drawNail(ctx, x, y, r) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;

  // Nail head
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, CFG.C.nailShine);
  g.addColorStop(0.4, CFG.C.nail);
  g.addColorStop(1, '#3A3028');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Shine
  ctx.fillStyle = 'rgba(255,255,240,0.55)';
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPeg(ctx, x, y) {
  const r = CFG.PEG_R;
  drawWoodPlank(ctx, x - r * 1.6, y - r * 0.8, r * 3.2, r * 2.2, r * 0.6);
  drawNail(ctx, x, y, r * 0.9);
  // tiny Ethiopian cross engraving
  drawEthiopianCross(ctx, x, y, r * 2.8, CFG.C.woodDark, 0.22);
}

function drawRope(ctx, rope) {
  if (rope.points.length < 2) return;
  const pts = rope.points;

  // Find last active segment
  let lastActive = pts.length - 1;
  for (let i = 0; i < rope.constraints.length; i++) {
    if (rope.constraints[i].cut) { lastActive = i; break; }
  }

  // Draw shadow
  ctx.save();
  ctx.strokeStyle = CFG.C.ropeShadow;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x + 3, pts[0].y + 4);
  for (let i = 1; i <= lastActive; i++) {
    ctx.lineTo(pts[i].x + 3, pts[i].y + 4);
  }
  ctx.stroke();

  // Rope body — alternating strand look
  for (let pass = 0; pass < 2; pass++) {
    const offset = pass === 0 ? -1.5 : 1.5;
    const col = pass === 0 ? CFG.C.ropeA : CFG.C.ropeB;
    ctx.strokeStyle = col;
    ctx.lineWidth = pass === 0 ? 5 : 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x + offset, pts[0].y);
    for (let i = 1; i <= lastActive; i++) {
      ctx.lineTo(pts[i].x + (i % 2 === 0 ? offset : -offset), pts[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawCoffeeBean(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);

  // Outer glow
  const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2);
  glow.addColorStop(0, 'rgba(180,70,10,0.30)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Bean body — slightly oval
  const body = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 0, 0, 0, r);
  body.addColorStop(0, CFG.C.beanMid);
  body.addColorStop(0.5, '#2E1005');
  body.addColorStop(1, CFG.C.bean);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crease
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = r * 0.18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.72);
  ctx.bezierCurveTo(r * 0.35, -r * 0.2, r * 0.35, r * 0.2, 0, r * 0.72);
  ctx.stroke();

  // Rim highlight
  ctx.strokeStyle = 'rgba(180,80,20,0.45)';
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.92, r * 0.78, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Shine
  const shine = ctx.createRadialGradient(-r * 0.28, -r * 0.32, 0, -r * 0.1, -r * 0.1, r * 0.55);
  shine.addColorStop(0, CFG.C.beanShine);
  shine.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.38, r * 0.26, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ===================== JEBENA CHARACTER =====================
// A cute, expressive Ethiopian coffee pot (jebena) mascot — the target
// the coffee bean must reach. Fully animated: blinking, eye-tracking,
// breathing, an anticipation mouth that opens as the bean nears, and a
// happy chomp on success. st = {
//   lit, collected, collectAnim, blink(0..1), breath(-..+),
//   mouthOpen(0..1), lookX(-1..1), lookY(-1..1), chew(0..1)
// }
function drawJebena(ctx, x, y, r, st) {
  st = st || {};
  const blink   = st.blink || 0;
  const breath  = st.breath || 0;
  const mouth   = st.mouthOpen || 0;
  const lookX   = st.lookX || 0;
  const lookY   = st.lookY || 0;
  const lit     = st.lit;
  const happy   = st.collected && (st.collectAnim || 0) > 0.12;
  const t       = Date.now();

  // Terracotta clay palette — warm and friendly
  const clayLight  = '#D07A45';
  const clayMid    = '#B0552A';
  const clayDark   = '#7A3416';
  const rimGold    = '#E8B020';

  ctx.save();
  ctx.translate(x, y);

  // Soft ground shadow
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.28, r * 0.92, r * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Warm welcoming glow when active
  if (lit) {
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.7);
    gl.addColorStop(0, 'rgba(255,190,60,0.42)');
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 2.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rising steam wisps from the spout when active
  if (lit) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,240,220,0.30)';
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const ph = t * 0.0016 + i * 2.1;
      const sx = r * 1.28, sy = -r * 1.0;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let s = 0; s <= 4; s++) {
        const f = s / 4;
        ctx.lineTo(sx + Math.sin(ph + f * 4) * r * 0.18, sy - f * r * 0.9);
      }
      ctx.globalAlpha = 0.5 - i * 0.18;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Idle breathing squash-and-stretch
  ctx.scale(1 + breath, 1 - breath);

  // ---- Back handle (left) ----
  ctx.strokeStyle = clayDark;
  ctx.lineWidth = r * 0.24;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.05);
  ctx.bezierCurveTo(-r * 1.5, -r * 0.05, -r * 1.45, r * 0.75, -r * 0.62, r * 0.78);
  ctx.stroke();
  ctx.strokeStyle = clayMid;
  ctx.lineWidth = r * 0.12;
  ctx.stroke();

  // ---- Spout (right, angled up) ----
  ctx.fillStyle = clayMid;
  ctx.beginPath();
  ctx.moveTo(r * 0.50, -r * 0.30);
  ctx.quadraticCurveTo(r * 1.30, -r * 0.55, r * 1.34, -r * 1.08);
  ctx.lineTo(r * 1.04, -r * 1.04);
  ctx.quadraticCurveTo(r * 0.96, -r * 0.55, r * 0.46, -r * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = clayDark;
  ctx.beginPath();
  ctx.ellipse(r * 1.19, -r * 1.06, r * 0.16, r * 0.07, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // ---- Neck ----
  ctx.fillStyle = clayMid;
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, -r * 0.52);
  ctx.lineTo(-r * 0.24, -r * 0.98);
  ctx.lineTo(r * 0.24, -r * 0.98);
  ctx.lineTo(r * 0.32, -r * 0.52);
  ctx.closePath();
  ctx.fill();

  // ---- Lid + knob ----
  ctx.fillStyle = clayLight;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.98, r * 0.32, r * 0.18, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = clayDark;
  ctx.beginPath();
  ctx.arc(0, -r * 1.22, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = clayMid;
  ctx.beginPath();
  ctx.arc(0, -r * 1.22, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // ---- Belly body ----
  const bg = ctx.createRadialGradient(-r * 0.32, -r * 0.15, r * 0.1, 0, r * 0.25, r * 1.35);
  bg.addColorStop(0, clayLight);
  bg.addColorStop(0.55, clayMid);
  bg.addColorStop(1, clayDark);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.30, r * 0.98, r * 0.94, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly clip for shine, shadow & decorative band
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, r * 0.30, r * 0.98, r * 0.94, 0, 0, Math.PI * 2);
  ctx.clip();

  // Sheen highlight (top-left)
  ctx.fillStyle = 'rgba(255,220,170,0.32)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, -r * 0.05, r * 0.40, r * 0.52, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.05, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Painted Ethiopian-flag band near the base
  const bandY = r * 0.92;
  const bands = [['#147828', 0], [rimGold, r * 0.12], ['#C8281A', r * 0.24]];
  for (const [col, off] of bands) {
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-r, bandY + off, r * 2, r * 0.12);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ===================== FACE =====================
  const eyeY  = -r * 0.02;
  const eyeDX = r * 0.40;
  const eyeR  = r * 0.33;

  // Eyebrows — raise with anticipation
  const browLift = mouth * r * 0.16 + (happy ? r * 0.12 : 0);
  ctx.strokeStyle = clayDark;
  ctx.lineWidth = r * 0.07;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const bx = sx * eyeDX;
    ctx.beginPath();
    ctx.moveTo(bx - eyeR * 0.7, eyeY - eyeR * 0.95 - browLift);
    ctx.quadraticCurveTo(bx, eyeY - eyeR * 1.25 - browLift, bx + eyeR * 0.7, eyeY - eyeR * 0.9 - browLift);
    ctx.stroke();
  }

  for (const sx of [-1, 1]) {
    const ex = sx * eyeDX;

    if (happy) {
      // Joyful closed eyes ( ^_^ )
      ctx.strokeStyle = '#2A1607';
      ctx.lineWidth = r * 0.09;
      ctx.beginPath();
      ctx.arc(ex, eyeY + eyeR * 0.25, eyeR * 0.7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      continue;
    }

    // Eye white
    ctx.fillStyle = '#FFF8EE';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR, eyeR * 1.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil tracks the bean
    const px = ex + lookX * eyeR * 0.40;
    const py = eyeY + lookY * eyeR * 0.40;
    const pr = eyeR * (0.52 + mouth * 0.06);
    ctx.fillStyle = '#2A1607';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    // Catchlights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(px - pr * 0.32, py - pr * 0.36, pr * 0.30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(px + pr * 0.30, py + pr * 0.30, pr * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Eyelid (blink) — clay cover sliding down from top
    if (blink > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeR + 1, eyeR * 1.06 + 1, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = clayLight;
      const lidH = (eyeR * 2.2) * blink;
      ctx.fillRect(ex - eyeR - 2, eyeY - eyeR * 1.1 - 2, (eyeR + 2) * 2, lidH);
      // lid edge line
      ctx.strokeStyle = clayDark;
      ctx.lineWidth = r * 0.04;
      ctx.beginPath();
      ctx.moveTo(ex - eyeR, eyeY - eyeR * 1.1 - 2 + lidH);
      ctx.lineTo(ex + eyeR, eyeY - eyeR * 1.1 - 2 + lidH);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Rosy cheeks
  ctx.fillStyle = 'rgba(232,90,70,0.35)';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.62, r * 0.30, r * 0.16, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Mouth ----
  const my = r * 0.50;
  if (mouth < 0.06 && !happy) {
    // Gentle closed smile
    ctx.strokeStyle = '#3A1505';
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, my);
    ctx.quadraticCurveTo(0, my + r * 0.18, r * 0.22, my);
    ctx.stroke();
  } else {
    // Open, eager mouth — grows as the bean nears / big grin on win
    const open = happy ? 1 : mouth;
    const chew = st.chew || 0;
    const mw = r * (0.30 + open * 0.06);
    const mh = r * (0.10 + open * 0.34) * (1 - chew * 0.45);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, my, mw, mh, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3A1505';
    ctx.fill();
    // inner throat shadow
    ctx.clip();
    const ig = ctx.createRadialGradient(0, my + mh * 0.3, 0, 0, my + mh * 0.3, mh * 1.6);
    ig.addColorStop(0, 'rgba(0,0,0,0.6)');
    ig.addColorStop(1, 'rgba(90,30,10,0)');
    ctx.fillStyle = ig;
    ctx.fillRect(-mw, my - mh, mw * 2, mh * 2);
    // Tongue
    ctx.fillStyle = '#E0735F';
    ctx.beginPath();
    ctx.ellipse(0, my + mh * 0.55, mw * 0.7, mh * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Lip highlight
    ctx.strokeStyle = 'rgba(255,200,150,0.25)';
    ctx.lineWidth = r * 0.04;
    ctx.beginPath();
    ctx.ellipse(0, my, mw, mh, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  ctx.restore();
}

function drawStar(ctx, cx, cy, r, collected, pulse) {
  ctx.save();
  ctx.translate(cx, cy);
  const sc = collected ? 0 : (1 + Math.sin(pulse * 4) * 0.06);
  ctx.scale(sc, sc);
  ctx.rotate(pulse * 0.8);

  if (!collected) {
    // Glow
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
    gl.addColorStop(0, 'rgba(255,200,40,0.40)');
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 5-pointed wood star
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      const px = Math.cos(angle) * rad;
      const py = Math.sin(angle) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Wood gradient fill
    const wg = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
    wg.addColorStop(0, CFG.C.starShine);
    wg.addColorStop(0.5, CFG.C.starFill);
    wg.addColorStop(1, CFG.C.starShadow);
    ctx.fillStyle = wg;
    ctx.fill();

    // Carving detail
    ctx.strokeStyle = 'rgba(80,40,0,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255,240,180,0.45)';
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.22, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBubble(ctx, x, y, r, alive) {
  if (!alive) return;
  ctx.save();
  ctx.translate(x, y);

  // Outer shell
  const rim = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
  rim.addColorStop(0, 'rgba(255,220,80,0)');
  rim.addColorStop(0.8, CFG.C.bubble);
  rim.addColorStop(1, CFG.C.bubbleRim);
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner shine top-left
  ctx.fillStyle = 'rgba(255,255,200,0.38)';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.28, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Small inner shine bottom-right
  ctx.fillStyle = 'rgba(255,230,100,0.20)';
  ctx.beginPath();
  ctx.arc(r * 0.3, r * 0.32, r * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBouncepad(ctx, x, y, w, h) {
  // Wooden spring pad
  drawWoodPlank(ctx, x - w / 2, y - h / 2, w, h, 8);
  // Spring coil visual
  ctx.strokeStyle = CFG.C.nail;
  ctx.lineWidth = 3;
  const coils = 5;
  ctx.beginPath();
  for (let i = 0; i <= coils * 8; i++) {
    const t = i / (coils * 8);
    const cx2 = x + Math.cos(t * Math.PI * 2 * coils) * (w * 0.28);
    const cy2 = y - h * 0.4 + t * h * 0.8;
    i === 0 ? ctx.moveTo(cx2, cy2) : ctx.lineTo(cx2, cy2);
  }
  ctx.stroke();
}

// HUD — wooden panel at top
function drawHUD(ctx, W, H, level, starsGot, starsTotal) {
  const ph = 72, pw = 320, px = W / 2 - pw / 2, py = 10;
  drawWoodPlank(ctx, px, py, pw, ph, 14);
  drawEthiopianCross(ctx, px + 36, py + ph / 2, 40, CFG.C.woodHigh, 0.25);
  drawEthiopianCross(ctx, px + pw - 36, py + ph / 2, 40, CFG.C.woodHigh, 0.25);

  // Level indicator — carved number look
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(ph * 0.52)}px serif`;
  ctx.fillStyle = CFG.C.woodDark;
  ctx.fillText(level, W / 2 + 2, py + ph / 2 + 2);
  ctx.fillStyle = CFG.C.woodHigh;
  ctx.fillText(level, W / 2, py + ph / 2);
  ctx.restore();

  // Star slots
  const starSlotR = 16;
  const starSpacing = 48;
  const starStartX = W / 2 - starSpacing;
  const starY = py + ph + 30;
  for (let i = 0; i < starsTotal; i++) {
    const sx = starStartX + i * starSpacing;
    if (i < starsGot) {
      drawStar(ctx, sx, starY, starSlotR, false, 0);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.22;
      drawStar(ctx, sx, starY, starSlotR, false, 0);
      ctx.restore();
    }
  }
}

// Retry button (circular wood button)
function drawRetryBtn(ctx, x, y, r) {
  ctx.save();
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x, y, r);
  g.addColorStop(0, CFG.C.woodLight);
  g.addColorStop(0.6, CFG.C.woodMid);
  g.addColorStop(1, CFG.C.woodDark);
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Grain
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let a = 0; a < Math.PI * 2; a += 0.22) {
    ctx.beginPath();
    ctx.arc(x, y, r * (0.3 + (a % 0.5) * 0.4), a, a + 0.18);
    ctx.stroke();
  }

  // Retry arrow (↺)
  ctx.strokeStyle = CFG.C.woodHigh;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, Math.PI * 0.1, Math.PI * 1.85);
  ctx.stroke();
  // Arrow head
  const ang = Math.PI * 0.1;
  const ax = x + Math.cos(ang) * r * 0.45;
  const ay = y + Math.sin(ang) * r * 0.45;
  ctx.beginPath();
  ctx.moveTo(ax - 8, ay - 8);
  ctx.lineTo(ax, ay);
  ctx.lineTo(ax + 8, ay - 2);
  ctx.stroke();

  ctx.restore();
}

// Win overlay
function drawWinOverlay(ctx, W, H, anim) {
  const a = easeOut(anim);
  ctx.save();
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = '#0A0400';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;

  // Celebration banner
  const bw = W * 0.45, bh = H * 0.20;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  drawWoodPlank(ctx, bx, by, bw, bh, 18);

  // Ethiopian cross decorations on banner
  drawEthiopianCross(ctx, bx + 60, by + bh / 2, 60, CFG.C.ethGold, 0.35 * a);
  drawEthiopianCross(ctx, bx + bw - 60, by + bh / 2, 60, CFG.C.ethGold, 0.35 * a);

  // Carved checkmark / ✓
  ctx.strokeStyle = CFG.C.woodHigh;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 38, H / 2 + 2);
  ctx.lineTo(W / 2 - 10, H / 2 + 28);
  ctx.lineTo(W / 2 + 40, H / 2 - 24);
  ctx.stroke();

  ctx.restore();
}

// Fail overlay
function drawFailOverlay(ctx, W, H, anim) {
  const a = easeOut(anim);
  ctx.save();
  ctx.globalAlpha = a * 0.60;
  ctx.fillStyle = '#100000';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;

  const bw = W * 0.32, bh = H * 0.18;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  drawWoodPlank(ctx, bx, by, bw, bh, 18);

  // X mark
  ctx.strokeStyle = CFG.C.ethRed;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 32, H / 2 - 22);
  ctx.lineTo(W / 2 + 32, H / 2 + 22);
  ctx.moveTo(W / 2 + 32, H / 2 - 22);
  ctx.lineTo(W / 2 - 32, H / 2 + 22);
  ctx.stroke();

  ctx.restore();
}
