// ===================== GAME CONFIG =====================
const CFG = {
  // Physics
  GRAVITY: 1400,
  DAMPING: 0.985,
  CONSTRAINT_ITERS: 24,
  ROPE_SEGS: 14,

  // Sizes (in logical 1920x1080 space)
  CANDY_R: 28,
  STAR_R: 22,
  CUP_R: 52,
  BUBBLE_R: 36,
  PEG_R: 18,

  // Colors — Ethiopian Wooden Palette
  C: {
    bgDeep:    '#0D0500',
    bgBoard:   '#1C0B03',
    woodDark:  '#3D1C02',
    woodMid:   '#6B3A1F',
    woodLight: '#A0622A',
    woodHigh:  '#D4935A',
    woodGrain: 'rgba(0,0,0,0.18)',
    ropeA:     '#C4884A',
    ropeB:     '#7A4E18',
    ropeShadow:'rgba(0,0,0,0.35)',
    nail:      '#8C7B6A',
    nailShine: '#D4C8B0',
    bean:      '#1A0800',
    beanMid:   '#5C2A10',
    beanShine: 'rgba(180,80,20,0.55)',
    tej:       '#D4A017',
    tejDark:   '#7A5800',
    tejLiquid: '#E8B824',
    tejGlass:  'rgba(220,180,80,0.28)',
    tejRim:    '#F0C84A',
    starFill:  '#DAA520',
    starShine: '#FFE04A',
    starShadow:'#7A5500',
    bubble:    'rgba(220,190,80,0.22)',
    bubbleRim: 'rgba(255,230,120,0.75)',
    ethRed:    '#C8281A',
    ethGreen:  '#147828',
    ethGold:   '#E8B020',
    particle:  '#C8844A',
    ui:        '#3D1C02',
    uiLight:   '#6B3A1F',
    uiGold:    '#C8A040',
    white:     'rgba(255,240,210,0.95)',
    glow:      'rgba(255,180,40,',
  },

  // Gameplay
  LEVELS_COUNT: 7,
  STAR_COLLECT_R: 38,
  CUP_COLLECT_R: 60,
  BUBBLE_LIFT: -600,
  BUBBLE_CAPTURE_R: 50,

  // Animation
  WIN_DELAY: 1400,
  INTRO_DUR: 900,
};
