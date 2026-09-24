import { Graphics, Point } from "pixi.js";
import { LIQUIDS } from "./colors.js";
import { pourableCount } from "./game.js";
import { tween, easeInOutCubic } from "./tween.js";

// Build a tapering ribbon polygon along a quadratic arc p0->p1.
function ribbon(p0, cp, p1, w0, w1, t) {
  const N = 16;
  const left = [];
  const right = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const iu = 1 - u;
    const x = iu * iu * p0.x + 2 * iu * u * cp.x + u * u * p1.x;
    const y = iu * iu * p0.y + 2 * iu * u * cp.y + u * u * p1.y;
    const dx = 2 * iu * (cp.x - p0.x) + 2 * u * (p1.x - cp.x);
    const dy = 2 * iu * (cp.y - p0.y) + 2 * u * (p1.y - cp.y);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const wob = Math.sin(u * 9 + t * 14) * 0.7;
    const w = (w0 + (w1 - w0) * u) * 0.5 + wob;
    left.push(x + nx * w, y + ny * w);
    right.push(x - nx * w, y - ny * w);
  }
  // right side reversed so the polygon winds correctly
  const r = [];
  for (let i = right.length - 2; i >= 0; i -= 2) r.push(right[i], right[i + 1]);
  return [...left, ...r];
}

export async function pour(ticker, streamLayer, from, to) {
  const k = pourableCount(from, to);
  if (!k) return false;

  const color = from.top;
  const col = LIQUIDS[color];
  from.busy = to.busy = true;

  const dir = Math.sign(to.homeX - from.homeX) || 1;
  const liftX = to.homeX - dir * 6;
  const liftY = to.homeY - 78;
  const tilt = dir * 0.5;

  const startX = from.root.x;
  const startY = from.root.y;

  // 1. lift + tilt toward destination
  await tween(ticker, {
    duration: 360,
    ease: easeInOutCubic,
    onUpdate: (e) => {
      from.root.x = startX + (liftX - startX) * e;
      from.root.y = startY + (liftY - startY) * e;
      from.body.rotation = tilt * e;
      from.shadow.alpha = 0.38 * (1 - e);
    },
  });

  // 2. transfer with a flowing stream
  const fromBase = from.slots.slice(0, from.slots.length - k);
  const toStart = [...to.slots];

  const spout = from.body.toGlobal(new Point(dir * 9, -2));
  const target = to.body.toGlobal(new Point(0, 2));
  const cp = new Point((spout.x + target.x) / 2, (spout.y + target.y) / 2 + 28);

  const stream = new Graphics();
  streamLayer.addChild(stream);

  let life = 0;
  await tween(ticker, {
    duration: 180 + k * 220,
    ease: (t) => t,
    onUpdate: (e, raw) => {
      life += 0.016;
      const remaining = k * (1 - e);
      const fromBands = fromBase.map((key) => ({ key, units: 1 }));
      from.render(remaining > 0.001 ? [...fromBands, { key: color, units: remaining }] : fromBands);
      to.render([...toStart.map((key) => ({ key, units: 1 })), { key: color, units: k * e }]);

      // fade the stream in at the start and out at the very end
      const flow = Math.min(1, raw * 6) * Math.min(1, (1 - raw) * 6);
      stream.clear();
      const body = ribbon(spout, cp, target, 8, 5, life);
      stream.poly(body).fill({ color: col.base, alpha: 0.95 * flow });
      const core = ribbon(spout, cp, target, 3.2, 2, life + 1.5);
      stream.poly(core).fill({ color: col.top, alpha: 0.85 * flow });
    },
  });

  stream.destroy();

  // commit state
  from.slots = fromBase;
  to.slots = [...toStart, ...Array(k).fill(color)];
  from.render();
  to.render();

  // 3. return home (to true resting position, not the lifted selection spot)
  await tween(ticker, {
    duration: 300,
    ease: easeInOutCubic,
    onUpdate: (e) => {
      from.root.x = liftX + (from.homeX - liftX) * e;
      from.root.y = liftY + (from.homeY - liftY) * e;
      from.body.rotation = tilt * (1 - e);
      from.shadow.alpha = 0.38 * e;
    },
  });

  from.body.rotation = 0;
  from.busy = to.busy = false;
  return true;
}
