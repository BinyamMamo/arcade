import { COLOR_KEYS } from "./colors.js";
import { MAX_UNITS } from "./bottle.js";

// How many consecutive top units of `from` can move onto `to`.
export function pourableCount(from, to) {
  if (from.isEmpty || from.busy || to.busy || from === to) return 0;
  if (to.isFull) return 0;
  if (!to.isEmpty && to.top !== from.top) return 0;
  const space = MAX_UNITS - to.slots.length;
  return Math.min(from.topRun, space);
}

export function isValidMove(from, to) {
  return pourableCount(from, to) > 0;
}

export function isSolved(bottles) {
  return bottles.every(
    (b) => b.isEmpty || (b.isFull && b.slots.every((c) => c === b.top))
  );
}

// Build a guaranteed-solvable scramble by starting solved and replaying random
// *reverse* pours. Reverse pours never create an unsolvable state.
export function generateLevel(bottles, numColors, emptyBottles) {
  const total = numColors + emptyBottles;
  const colors = COLOR_KEYS.slice(0, numColors);

  for (const b of bottles) b.slots = [];
  // solved state: first `numColors` bottles are single-color full
  colors.forEach((c, i) => {
    bottles[i].slots = Array(MAX_UNITS).fill(c);
  });

  // scramble with reverse moves: take a top unit and drop it on another bottle
  const moves = 200;
  for (let m = 0; m < moves; m++) {
    const from = bottles[(Math.random() * total) | 0];
    const to = bottles[(Math.random() * total) | 0];
    if (from === to || from.isEmpty || to.isFull) continue;
    // reverse pour ignores color matching to maximize mixing
    to.slots.push(from.slots.pop());
  }

  if (isSolved(bottles)) return generateLevel(bottles, numColors, emptyBottles);
  for (const b of bottles) b.render();
}
