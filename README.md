# Arcade

Three small browser games, each written from scratch without a game engine.

| Game | What it is | Stack |
| --- | --- | --- |
| `cutzrope/` | Cut the ropes so the coffee bean lands in the jebena | Canvas 2D, no dependencies |
| `snake-xenzia/` | The Nokia Snake clone | Canvas 2D, no dependencies |
| `tejie/` | A colour sort puzzle: pour between bottles until each holds one colour | PixiJS 8, Vite |

## Running them

`cutzrope` and `snake-xenzia` are plain static folders. Serve either one and open it:

```bash
npx serve cutzrope -l 5188
npx serve snake-xenzia -l 5189
```

`tejie` uses Vite:

```bash
cd tejie && npm install && npm run dev
```

## What is interesting in each

**Cutzrope** runs its own Verlet integration for the ropes: each rope is a chain of points
relaxed over several iterations per frame, so cutting one mid-span leaves both halves
swinging correctly. Levels are data, not code — `js/levels.js` defines ropes, the cup,
stars, bubbles and bounce pads in normalised `[0..1]` coordinates, so the same level file
lays out correctly at any canvas size.

**Snake Xenzia** draws everything on the canvas rather than loading sprites: the bevelled
arcade chrome, the LCD scanlines, the per-segment shading of the snake's body, its eyes and
tongue. Movement is interpolated between grid steps so the snake glides instead of hopping,
and the sound is synthesised with the Web Audio API.

**Tejie** generates levels that are guaranteed solvable by starting from a solved board and
replaying random *reverse* pours, which avoids the usual problem of generating a random
board and then having to prove it can be finished.

## Known issue

Tejie's production build renders nothing: the bundle loads without errors but the PixiJS
application never mounts its canvas, so the page stays empty. It runs correctly under
`npm run dev`. The deployed arcade therefore links only Cutzrope and Snake Xenzia until
that is fixed.
