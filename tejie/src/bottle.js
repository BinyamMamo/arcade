import { Container, Graphics } from "pixi.js";
import { LIQUIDS } from "./colors.js";

// --- Berele (tej bottle) geometry, in local space with the mouth at (0,0)
//     and the body growing downward. Pivot for tilting == the mouth.
//     Big onion bulb, a SHORT neck, and a flared glass lip — no cork.
const LIP_HW = 17;  // flared mouth/lip half-width (widest at the rim)
const NECK_HW = 10; // straight neck half-width
const NY0 = 11;     // where the flared lip meets the neck
const NY1 = 36;     // neck bottom / shoulder start (very short neck)
const BR = 66;      // bulb radius — wide, round belly
const BCY = 132;    // bulb center y
const BB = 194;     // body bottom y

export const MAX_UNITS = 4;
const LIQ_BOTTOM = 188;
const LIQ_TOP_FULL = 54; // full level sits at the neck base, as in a real berele
const UNIT_H = (LIQ_BOTTOM - LIQ_TOP_FULL) / MAX_UNITS;

export const BOTTLE_W = BR * 2;
export const BOTTLE_H = BB;
export const MOUTH = { x: 0, y: -8 }; // stream exit point (just above rim)

// Trace the closed glass silhouette onto a Graphics (no fill/stroke applied).
function traceBody(g) {
  g.moveTo(-LIP_HW, 0);
  g.lineTo(LIP_HW, 0);
  // flared lip collar curving inward to the neck
  g.quadraticCurveTo(LIP_HW - 1, 7, NECK_HW + 1, NY0);
  g.lineTo(NECK_HW, NY1 - 6);
  // shoulder flaring out fast into the wide round belly
  g.bezierCurveTo(NECK_HW + 2, NY1 + 14, BR, 74, BR, BCY);
  // belly curving back down to a small foot
  g.bezierCurveTo(BR, 174, 42, BB, 0, BB);
  g.bezierCurveTo(-42, BB, -BR, 174, -BR, BCY);
  g.bezierCurveTo(-BR, 74, -(NECK_HW + 2), NY1 + 14, -NECK_HW, NY1 - 6);
  g.lineTo(-(NECK_HW + 1), NY0);
  g.quadraticCurveTo(-(LIP_HW - 1), 7, -LIP_HW, 0);
  g.closePath();
}

export class Bottle {
  constructor(index) {
    this.index = index;
    this.slots = []; // bottom -> top color keys
    this.selected = false;
    this.busy = false;

    this.root = new Container();
    this.root.eventMode = "static";
    this.root.cursor = "pointer";

    // contact shadow on the wood
    this.shadow = new Graphics()
      .ellipse(0, BB + 6, BR * 0.9, 14)
      .fill({ color: 0x000000, alpha: 0.38 });
    this.shadow.y = 4;

    // the bottle itself (tilts/lifts as a unit)
    this.body = new Container();
    this.root.addChild(this.shadow, this.body);

    // empty-glass backing so the unfilled part reads as dark glass, not wood
    this.glassBack = new Graphics();
    traceBody(this.glassBack);
    this.glassBack.fill({ color: 0x0d0b09, alpha: 0.55 });

    // liquid layer, clipped to the silhouette
    this.liquid = new Graphics();
    this.mask = new Graphics();
    traceBody(this.mask);
    this.mask.fill({ color: 0xffffff });
    this.liquid.mask = this.mask;

    // glass sheen + carved rim on top of the liquid
    this.sheen = new Graphics();
    this.#drawSheen();

    this.body.addChild(this.glassBack, this.liquid, this.mask, this.sheen);
    this.render();
  }

  #drawSheen() {
    const g = this.sheen;
    g.clear();
    // soft right-side roundness shadow on the bulb
    g.ellipse(34, 134, 32, 48).fill({ color: 0x000000, alpha: 0.14 });
    // bulb specular highlight (upper-left)
    g.ellipse(-32, 106, 14, 28).fill({ color: 0xffffff, alpha: 0.16 });
    g.ellipse(-37, 98, 4, 10).fill({ color: 0xffffff, alpha: 0.28 });
    // short neck highlight
    g.roundRect(-5, 16, 3, 26, 1.5).fill({ color: 0xffffff, alpha: 0.14 });
    // glint on the flared glass lip
    g.ellipse(-8, 4, 5, 2.4).fill({ color: 0xffffff, alpha: 0.3 });
    // carved warm rim catching the light
    traceBody(g);
    g.stroke({ width: 2.5, color: 0xe7cfa3, alpha: 0.16, alignment: 0.5 });
  }

  // Redraw liquid bands. `bands` defaults to whole-unit slots, but callers
  // (the pour animation) can pass fractional units for smooth transfer.
  render(bands = this.slots.map((key) => ({ key, units: 1 }))) {
    const g = this.liquid;
    g.clear();
    let y = LIQ_BOTTOM;
    for (const { key, units } of bands) {
      if (units <= 0) continue;
      const col = LIQUIDS[key];
      const h = units * UNIT_H;
      const top = y - h;
      // body
      g.rect(-BR - 14, top, (BR + 14) * 2, h).fill({ color: col.base });
      // 3D shading: lighter left, darker right
      g.rect(-BR - 14, top, BR + 4, h).fill({ color: 0xffffff, alpha: 0.05 });
      g.rect(4, top, BR + 14, h).fill({ color: 0x000000, alpha: 0.09 });
      // meniscus highlight at the surface
      g.rect(-BR - 14, top, (BR + 14) * 2, 4).fill({ color: col.top, alpha: 0.9 });
      y = top;
    }
  }

  get isFull() {
    return this.slots.length >= MAX_UNITS;
  }
  get isEmpty() {
    return this.slots.length === 0;
  }
  get top() {
    return this.slots[this.slots.length - 1] ?? null;
  }
  // number of same-colored units stacked at the top
  get topRun() {
    const t = this.top;
    if (!t) return 0;
    let n = 0;
    for (let i = this.slots.length - 1; i >= 0 && this.slots[i] === t; i--) n++;
    return n;
  }

  setPosition(x, y) {
    this.homeX = x;
    this.homeY = y;
    this.root.x = x;
    this.root.y = y;
  }
}
