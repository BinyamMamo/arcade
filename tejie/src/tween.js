// Minimal promise-based tween helper driven by the Pixi ticker.

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t) => t * t * t;

export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Drive a value from 0..1 over `duration` ms, calling `onUpdate(t)` each frame.
 * Resolves when complete.
 */
export function tween(ticker, { duration, ease = easeInOutCubic, onUpdate, onComplete }) {
  return new Promise((resolve) => {
    let elapsed = 0;
    const step = (t) => {
      elapsed += t.deltaMS;
      const raw = Math.min(elapsed / duration, 1);
      onUpdate(ease(raw), raw);
      if (raw >= 1) {
        ticker.remove(step);
        onComplete?.();
        resolve();
      }
    };
    ticker.add(step);
  });
}

export const wait = (ticker, ms) =>
  tween(ticker, { duration: ms, ease: (t) => t, onUpdate: () => {} });
