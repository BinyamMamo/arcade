import { Application, Container, Sprite, Texture } from "pixi.js";
import { Bottle, BOTTLE_W, BOTTLE_H } from "./bottle.js";
import { generateLevel, isValidMove, isSolved } from "./game.js";
import { pour } from "./pour.js";
import { makeWoodCanvas } from "./wood.js";
import { tween, easeOutCubic } from "./tween.js";

const NUM_COLORS = 6;
const NUM_EMPTY = 2;
const COLS = 4;

const app = new Application();
await app.init({
  background: "#15110c",
  antialias: true,
  resizeTo: window,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
document.getElementById("app").appendChild(app.canvas);

// --- wood background ---------------------------------------------------------
let woodSprite = new Sprite(Texture.EMPTY);
app.stage.addChild(woodSprite);

function refreshWood() {
  const w = app.screen.width;
  const h = app.screen.height;
  woodSprite.texture?.destroy(true);
  woodSprite.texture = Texture.from(makeWoodCanvas(Math.ceil(w), Math.ceil(h)));
  woodSprite.width = w;
  woodSprite.height = h;
}

// --- world + bottles ---------------------------------------------------------
const world = new Container();
const streamLayer = new Container(); // pour streams render above everything
app.stage.addChild(world, streamLayer);

const totalBottles = NUM_COLORS + NUM_EMPTY;
const bottles = [];
for (let i = 0; i < totalBottles; i++) {
  const b = new Bottle(i);
  bottles.push(b);
  world.addChild(b.root);
  b.root.on("pointertap", () => onTap(b));
}
generateLevel(bottles, NUM_COLORS, NUM_EMPTY);

// --- layout ------------------------------------------------------------------
function layout() {
  const rows = Math.ceil(totalBottles / COLS);
  const gapX = BOTTLE_W * 0.5;
  const gapY = BOTTLE_H * 0.42;
  const cellW = BOTTLE_W + gapX;
  const cellH = BOTTLE_H + gapY;

  const boardW = COLS * cellW - gapX;
  const boardH = rows * cellH - gapY;

  bottles.forEach((b, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    // center a short last row
    const inRow = Math.min(COLS, totalBottles - r * COLS);
    const rowW = inRow * cellW - gapX;
    const offX = (boardW - rowW) / 2;
    const x = offX + c * cellW + BOTTLE_W / 2;
    const y = r * cellH + 22; // leave headroom for the cork
    b.setPosition(x, y);
  });

  // fit the board into the viewport
  const pad = 0.86;
  const scale = Math.min(
    (app.screen.width * pad) / boardW,
    (app.screen.height * pad) / (boardH + 30)
  );
  world.scale.set(scale);
  world.x = (app.screen.width - boardW * scale) / 2;
  world.y = (app.screen.height - boardH * scale) / 2;

  streamLayer.scale.set(scale);
  streamLayer.position.set(world.x, world.y);
}

app.renderer.on("resize", () => {
  refreshWood();
  layout();
});
refreshWood();
layout();

// --- input -------------------------------------------------------------------
let selected = null;
let animating = false;

function lift(bottle, up) {
  tween(app.ticker, {
    duration: 160,
    ease: easeOutCubic,
    onUpdate: (e) => {
      bottle.root.y = bottle.homeY + (up ? -18 : 0) * (up ? e : 1 - e);
    },
  });
}

async function onTap(bottle) {
  if (animating || bottle.busy) return;

  if (!selected) {
    if (bottle.isEmpty) return;
    selected = bottle;
    lift(bottle, true);
    return;
  }

  if (selected === bottle) {
    lift(bottle, false);
    selected = null;
    return;
  }

  const from = selected;
  const to = bottle;
  selected = null;

  if (!isValidMove(from, to)) {
    lift(from, false);
    return;
  }

  animating = true;
  await pour(app.ticker, streamLayer, from, to);
  animating = false;

  if (isSolved(bottles)) celebrate();
}

// dev hook: ?auto triggers the first available pour so the stream can be verified
if (new URLSearchParams(location.search).has("auto")) {
  setTimeout(async () => {
    for (const from of bottles) {
      for (const to of bottles) {
        if (isValidMove(from, to)) {
          animating = true;
          await pour(app.ticker, streamLayer, from, to);
          animating = false;
          return;
        }
      }
    }
  }, 600);
}

// subtle, text-free win flourish: a gentle staggered bob
function celebrate() {
  bottles.forEach((b, i) => {
    setTimeout(() => {
      tween(app.ticker, {
        duration: 520,
        ease: (t) => Math.sin(t * Math.PI),
        onUpdate: (e) => {
          b.root.y = b.homeY - 16 * e;
        },
      });
    }, i * 70);
  });
}
