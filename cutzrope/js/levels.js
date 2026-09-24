// ===================== LEVELS =====================
// All positions are normalized [0..1] — multiplied by W/H at load time.
// Each level defines: ropes, cup, stars, bubbles, bouncepads.
// Rope: { ax, ay, len } — anchor position + rope length (normalized)
// The candy always starts at the end of rope[0].

const LEVEL_DEFS = [
  // Level 1 — Single rope, straight drop
  {
    ropes: [
      { ax: 0.50, ay: 0.06, len: 0.42 }
    ],
    cup:  { x: 0.50, y: 0.82 },
    stars: [
      { x: 0.35, y: 0.52 },
      { x: 0.50, y: 0.40 },
      { x: 0.65, y: 0.52 },
    ],
    bubbles: [],
    pads: [],
  },

  // Level 2 — Two ropes, cut one to swing into cup
  {
    ropes: [
      { ax: 0.38, ay: 0.06, len: 0.38 },
      { ax: 0.62, ay: 0.06, len: 0.35 },
    ],
    cup:  { x: 0.72, y: 0.78 },
    stars: [
      { x: 0.50, y: 0.30 },
      { x: 0.60, y: 0.50 },
      { x: 0.72, y: 0.60 },
    ],
    bubbles: [],
    pads: [],
  },

  // Level 3 — Three ropes, stars in tight path
  {
    ropes: [
      { ax: 0.30, ay: 0.05, len: 0.30 },
      { ax: 0.50, ay: 0.05, len: 0.20 },
      { ax: 0.70, ay: 0.05, len: 0.30 },
    ],
    cup:  { x: 0.50, y: 0.85 },
    stars: [
      { x: 0.38, y: 0.42 },
      { x: 0.50, y: 0.55 },
      { x: 0.62, y: 0.42 },
    ],
    bubbles: [],
    pads: [],
  },

  // Level 4 — Bubble lifts candy, one rope
  {
    ropes: [
      { ax: 0.50, ay: 0.06, len: 0.28 },
    ],
    cup:  { x: 0.78, y: 0.22 },
    stars: [
      { x: 0.65, y: 0.35 },
      { x: 0.74, y: 0.26 },
      { x: 0.50, y: 0.48 },
    ],
    bubbles: [
      { x: 0.50, y: 0.68 },
    ],
    pads: [],
  },

  // Level 5 — Bounce pad + two ropes
  {
    ropes: [
      { ax: 0.28, ay: 0.06, len: 0.45 },
      { ax: 0.55, ay: 0.06, len: 0.22 },
    ],
    cup:  { x: 0.72, y: 0.72 },
    stars: [
      { x: 0.40, y: 0.40 },
      { x: 0.55, y: 0.55 },
      { x: 0.68, y: 0.58 },
    ],
    bubbles: [],
    pads: [
      { x: 0.50, y: 0.72, w: 0.12, h: 0.045 },
    ],
  },

  // Level 6 — Two bubbles, precise cuts needed
  {
    ropes: [
      { ax: 0.50, ay: 0.06, len: 0.38 },
      { ax: 0.30, ay: 0.20, len: 0.22 },
    ],
    cup:  { x: 0.20, y: 0.20 },
    stars: [
      { x: 0.30, y: 0.45 },
      { x: 0.20, y: 0.35 },
      { x: 0.50, y: 0.55 },
    ],
    bubbles: [
      { x: 0.20, y: 0.60 },
      { x: 0.40, y: 0.74 },
    ],
    pads: [],
  },

  // Level 7 — Complex: three ropes, bounce pad, bubble, stars in arcs
  {
    ropes: [
      { ax: 0.20, ay: 0.05, len: 0.38 },
      { ax: 0.50, ay: 0.05, len: 0.25 },
      { ax: 0.80, ay: 0.05, len: 0.38 },
    ],
    cup:  { x: 0.50, y: 0.78 },
    stars: [
      { x: 0.32, y: 0.55 },
      { x: 0.50, y: 0.48 },
      { x: 0.68, y: 0.55 },
    ],
    bubbles: [
      { x: 0.50, y: 0.82 },
    ],
    pads: [
      { x: 0.25, y: 0.68, w: 0.10, h: 0.04 },
      { x: 0.75, y: 0.68, w: 0.10, h: 0.04 },
    ],
  },
];

function buildLevel(def, W, H) {
  const candy = null; // created after ropes
  const ropes = [];

  // All ropes share the same candy endpoint (the last point of rope[0])
  // First create rope[0] to get the candy start position
  const r0 = def.ropes[0];
  const ax0 = r0.ax * W, ay0 = r0.ay * H;
  const len0 = r0.len * H;
  const segs0 = Math.max(8, Math.round(r0.len * 28));
  const rope0 = new Rope(ax0, ay0, ax0, ay0 + len0, segs0);
  ropes.push(rope0);

  // Candy lives at the tip of rope0
  const bean = new CoffeeBean(rope0.tip.x, rope0.tip.y);
  // Sync: make rope0's tip point be the bean's point
  // We do this by reference trick: replace tip point
  rope0.points[rope0.points.length - 1] = bean.point;
  // Fix constraints that referenced old tip
  rope0.constraints[rope0.constraints.length - 1].p2 = bean.point;

  // Additional ropes share the same candy point
  for (let i = 1; i < def.ropes.length; i++) {
    const rd = def.ropes[i];
    const ax = rd.ax * W, ay = rd.ay * H;
    const len = rd.len * H;
    const segs = Math.max(8, Math.round(rd.len * 28));
    const rope = new Rope(ax, ay, ax, ay + len, segs);
    // Replace its tip with bean.point
    rope.points[rope.points.length - 1] = bean.point;
    rope.constraints[rope.constraints.length - 1].p2 = bean.point;
    ropes.push(rope);
  }

  const cup = new TejCup(def.cup.x * W, def.cup.y * H);

  const stars = def.stars.map(s => new StarToken(s.x * W, s.y * H));

  const bubbles = (def.bubbles || []).map(b => new Bubble(b.x * W, b.y * H));

  const pads = (def.pads || []).map(p =>
    new BouncePad(p.x * W, p.y * H, p.w * W, p.h * H)
  );

  const pegs = def.ropes.map(r => new AnchorPeg(r.ax * W, r.ay * H));

  return { ropes, bean, cup, stars, bubbles, pads, pegs };
}
