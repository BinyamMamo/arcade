// Liquid palette. Warm, saturated tones that read well on dark wood.
// `tej` (golden honey wine) leads — the Ethiopian anchor color.
export const LIQUIDS = {
  tej:     { base: 0xf4b41a, top: 0xffd86b, edge: 0xc8860a }, // golden tej
  berbere: { base: 0xd1422a, top: 0xf06b4e, edge: 0x9c2614 }, // chili red
  enset:   { base: 0x4f9d3a, top: 0x7fc862, edge: 0x356b25 }, // false-banana green
  nile:    { base: 0x2f7fd1, top: 0x5fa8f0, edge: 0x1c548f }, // blue
  mint:    { base: 0x29c2a3, top: 0x5fe6cc, edge: 0x178a72 }, // teal
  abyssal: { base: 0x3a3d8f, top: 0x6064c8, edge: 0x232560 }, // indigo
  rose:    { base: 0xe06a99, top: 0xf79cbf, edge: 0xb04470 }, // pink
  saffron: { base: 0xe98a2b, top: 0xffb158, edge: 0xb35f12 }, // amber-orange
};

export const COLOR_KEYS = Object.keys(LIQUIDS);
