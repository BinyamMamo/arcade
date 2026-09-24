// Procedural dark-wood background texture, drawn to an offscreen canvas so
// Pixi can use it as a Texture. Warm grain + plank seams + vignette give the
// "carved wood, dark mode" feel without any image assets.

function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function makeWoodCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // base warm-dark gradient
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#241a10");
  g.addColorStop(0.5, "#1b130b");
  g.addColorStop(1, "#0f0a06");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // flowing vertical grain
  ctx.globalAlpha = 0.06;
  for (let x = 0; x < w; x += 3) {
    const wobble = Math.sin(x * 0.015) * 18 + noise2D(x, 0) * 10;
    const shade = noise2D(x * 0.3, 7) > 0.5 ? "#3a2a18" : "#0a0703";
    ctx.strokeStyle = shade;
    ctx.lineWidth = 1 + noise2D(x, 3) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x + wobble, -10);
    ctx.lineTo(x + wobble * 0.6, h + 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // a few horizontal plank seams for depth
  const planks = 4;
  for (let i = 1; i < planks; i++) {
    const y = (h / planks) * i + (noise2D(i, 1) - 0.5) * 30;
    const seam = ctx.createLinearGradient(0, y - 4, 0, y + 4);
    seam.addColorStop(0, "rgba(0,0,0,0)");
    seam.addColorStop(0.45, "rgba(0,0,0,0.55)");
    seam.addColorStop(0.55, "rgba(120,86,48,0.18)");
    seam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = seam;
    ctx.fillRect(0, y - 4, w, 8);
  }

  // vignette to settle edges into darkness
  const r = Math.max(w, h) * 0.75;
  const vg = ctx.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
