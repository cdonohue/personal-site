/**
 * What the figure is wearing.
 *
 * The art is drawn once and recoloured at load. Every recolourable part carries
 * its own key colour in `character.png`, and an outfit is a map from those keys
 * to whatever it should actually be — so a new outfit is an entry in the list
 * below and nothing else. No re-export, no second sheet, and the download does
 * not grow with the wardrobe.
 *
 * The keys sit one unit apart from each other where two parts happen to look
 * the same, which is invisible on any display and is what lets the base art
 * double as the default outfit. Editing `character.aseprite` shows you exactly
 * what ships when the default comes up.
 */

/** One colour per recolourable part. Shades are named, never derived. */
export type Outfit = {
  name: string;
  hat: { top: string; edge: string; strap: string };
  /**
   * `logo` names a stencil in `art/logo-<art>.png` and the colour to print it
   * in. Optional, and most outfits will not have one.
   *
   * The ink is per outfit rather than baked into the drawing for the obvious
   * reason: a fixed-colour logo disappears the day you make a shirt that
   * colour. One drawing therefore works on light and dark shirts both.
   */
  shirt: { fill: string; shade: string; logo?: { art: string; ink: string } };
  pants: { fill: string; shade: string };
  shoes: { fill: string; shade: string };
};

/**
 * The key colours in `character.png`, in the order an outfit supplies them.
 *
 * These are the art contract. Change one here and it must change in the sprite
 * on the same commit, or that part silently stops being recoloured — the
 * remap simply never matches, and the base colour ships instead.
 *
 * Skin, the skin highlight and the startle marks are deliberately absent. They
 * are not clothing, and nothing should be able to tint them by accident.
 */
const KEYS = [
  [239, 239, 239], // hat top
  [170, 170, 170], // hat edge
  [52, 52, 52], // hat strap — one off the shoes, which is the whole trick
  [223, 223, 223], // shirt fill
  [154, 154, 154], // shirt shade
  [32, 32, 32], // pants fill
  [33, 33, 33], // pants shade
  [53, 53, 53], // shoe fill
  [54, 54, 54], // shoe shade
] as const;

const partsOf = (outfit: Outfit) => [
  outfit.hat.top,
  outfit.hat.edge,
  outfit.hat.strap,
  outfit.shirt.fill,
  outfit.shirt.shade,
  outfit.pants.fill,
  outfit.pants.shade,
  outfit.shoes.fill,
  outfit.shoes.shade,
];

/**
 * The wardrobe.
 *
 * `default` reproduces the drawing exactly: the pants shade and the shoe shade
 * are given the same colour as their fills, so the edge pixels that exist for
 * light garments stay invisible while the trousers are near black. That is what
 * "the base art is the default outfit" means in practice.
 */
export const OUTFITS: Outfit[] = [
  {
    name: 'default',
    hat: { top: '#efefef', edge: '#aaaaaa', strap: '#353535' },
    shirt: { fill: '#dfdfdf', shade: '#9a9a9a' },
    pants: { fill: '#202020', shade: '#202020' },
    shoes: { fill: '#353535', shade: '#353535' },
  },
  {
    name: 'powder-blue',
    hat: { top: '#ded7c8', edge: '#9e9688', strap: '#41342e' },
    shirt: { fill: '#91abc3', shade: '#60788f' },
    pants: { fill: '#49352c', shade: '#2e211c' },
    shoes: { fill: '#302622', shade: '#1e1816' },
  },
  {
    name: 'olive-tobacco',
    hat: { top: '#c7b38b', edge: '#8c7857', strap: '#35382d' },
    shirt: { fill: '#687052', shade: '#454b37' },
    pants: { fill: '#694a35', shade: '#432f23' },
    shoes: { fill: '#352922', shade: '#211a16' },
  },
  {
    name: 'oxblood-chocolate',
    hat: { top: '#c8c0b4', edge: '#8e857a', strap: '#422a2b' },
    shirt: { fill: '#7d3442', shade: '#50212b' },
    pants: { fill: '#49342c', shade: '#2e211c' },
    shoes: { fill: '#29201d', shade: '#191412' },
  },
  {
    name: 'butter-brown',
    hat: { top: '#29374b', edge: '#182435', strap: '#d4b85f' },
    shirt: { fill: '#d8be68', shade: '#957d3d' },
    pants: { fill: '#4b372d', shade: '#30231d' },
    shoes: { fill: '#2d2521', shade: '#1c1714' },
  },
  {
    name: 'rust-indigo',
    hat: { top: '#28364a', edge: '#172336', strap: '#ae603f' },
    shirt: { fill: '#b85f3e', shade: '#773b28' },
    pants: { fill: '#29374c', shade: '#192335' },
    shoes: { fill: '#49352b', shade: '#2e211b' },
  },
  {
    name: 'teal-plum',
    hat: { top: '#d5ccba', edge: '#988e7c', strap: '#2b3d3c' },
    shirt: { fill: '#397878', shade: '#254f50' },
    pants: { fill: '#453441', shade: '#2c222b' },
    shoes: { fill: '#30272b', shade: '#1e191b' },
  },
  {
    name: 'cream-denim',
    hat: { top: '#786048', edge: '#4f3e30', strap: '#d7cab3' },
    shirt: { fill: '#d9cfb9', shade: '#998e78' },
    pants: { fill: '#38536f', shade: '#26394d' },
    shoes: { fill: '#4a372b', shade: '#2f231c' },
  },
  {
    name: 'camel-charcoal',
    hat: { top: '#d8d0c2', edge: '#998f80', strap: '#403932' },
    shirt: { fill: '#b08759', shade: '#765a3c' },
    pants: { fill: '#3c4042', shade: '#282b2d' },
    shoes: { fill: '#292321', shade: '#191615' },
  },
  {
    name: 'chartreuse-charcoal',
    hat: { top: '#41474c', edge: '#292f34', strap: '#a1b83a' },
    shirt: { fill: '#a8bf3f', shade: '#6f7f29' },
    pants: { fill: '#41464b', shade: '#292e32' },
    shoes: { fill: '#282728', shade: '#191819' },
  },
  {
    name: 'red-grape',
    hat: { top: '#d1c4ae', edge: '#93856e', strap: '#52334f' },
    shirt: { fill: '#c64e40', shade: '#823229' },
    pants: { fill: '#5a365f', shade: '#3a233e' },
    shoes: { fill: '#34252f', shade: '#21181e' },
  },
  {
    name: 'cobalt-orange',
    hat: { top: '#d0b168', edge: '#94783d', strap: '#2e4780' },
    shirt: { fill: '#3c63b3', shade: '#284279' },
    pants: { fill: '#a75532', shade: '#6c3722' },
    shoes: { fill: '#352823', shade: '#211a16' },
  },
  {
    name: 'virtual-pink-navy',
    hat: { top: '#293852', edge: '#19263d', strap: '#c35c87' },
    shirt: { fill: '#c65d89', shade: '#843d5b' },
    pants: { fill: '#293952', shade: '#1a2639' },
    shoes: { fill: '#302832', shade: '#1e191f' },
  },
  {
    name: 'irish-green-plum',
    hat: { top: '#d1c39f', edge: '#948560', strap: '#315e43' },
    shirt: { fill: '#3f8d5b', shade: '#295d3d' },
    pants: { fill: '#503850', shade: '#342434' },
    shoes: { fill: '#30272e', shade: '#1e191d' },
  },
];

const hex = (value: string): [number, number, number] => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
];

/**
 * The substitution an outfit performs, as key colour to replacement.
 *
 * Exported because it is the part worth checking. The pixel loop below is a
 * lookup and cannot really be wrong; whether `KEYS` still lines up with what is
 * drawn, and whether an outfit's colours are the ones intended, is exactly the
 * kind of thing that goes stale silently.
 */
export const keyMap = (outfit: Outfit): [from: RGB, to: RGB][] => {
  const parts = partsOf(outfit).map(hex);
  return KEYS.map((key, index) => [[...key] as RGB, parts[index]]);
};

export type RGB = [number, number, number];

/**
 * Which calendar day it is for the visitor, as an integer that steps by one.
 *
 * The outfit changes at midnight in the same zone as the clock and activity
 * schedule. `en-CA` because it formats as YYYY-MM-DD and nothing else does.
 */
const dayNumber = (date: Date, timeZone?: string): number => {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

/** Integer mixer, so neighbouring days do not give neighbouring outfits. */
const mix = (value: number): number => {
  let h = Math.imul(value ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

/**
 * The wardrobe shuffled into a fresh order every `n` days.
 *
 * A block rather than an independent draw per day, because independent draws
 * clump: with four outfits, one day in four repeats yesterday, and a change
 * that changes nothing reads as the feature being broken rather than as
 * chance. A permutation gives every outfit exactly one turn per cycle and can
 * never repeat inside one.
 *
 * The two halves stay on separate rails while their internal order changes.
 * With fourteen outfits, that makes each rail one week long: an outfit in the
 * first rail cannot appear in the second week, nor vice versa. The next
 * fortnight shuffles both rails again, so the sequence is offset without ever
 * falling back to a fixed Monday-through-Sunday uniform.
 */
const orderFor = (block: number, n: number): number[] => {
  const shuffle = (order: number[], salt: number): number[] => {
    let seed = mix(block ^ salt);
    for (let i = order.length - 1; i > 0; i -= 1) {
      seed = mix(seed);
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };

  const split = Math.ceil(n / 2);
  const first = Array.from({ length: split }, (_, i) => i);
  const second = Array.from({ length: n - split }, (_, i) => i + split);
  return [...shuffle(first, 0x51f15e), ...shuffle(second, 0xa17eaf)];
};

/**
 * One outfit a day, the same one for everybody looking on that day.
 *
 * Derived from the date rather than rolled and stored, which is what makes it
 * hold still: a reload cannot change it, two visitors on the same local date
 * see the same thing, and no state has to be kept anywhere. It turns over at
 * midnight for the visitor.
 *
 * Fewer than three outfits cannot be shuffled into anything — with two, the
 * only sequence that never repeats is strict alternation — so they just take
 * turns.
 */
export const outfitFor = (date: Date, timeZone?: string): Outfit => {
  const n = OUTFITS.length;
  const day = dayNumber(date, timeZone);
  if (n < 3) return OUTFITS[((day % n) + n) % n];

  const block = Math.floor(day / n);
  const position = ((day % n) + n) % n;
  const order = orderFor(block, n);

  return OUTFITS[order[position]];
};

/**
 * Print a stencil in one colour.
 *
 * The logo art is treated as a mask: alpha is the shape and everything opaque
 * becomes the ink, so it can be drawn in whatever colour is convenient and
 * never needs a key. At the size this lands — fourteen pixels across — a second
 * colour would not survive anyway, so the simplification costs nothing real.
 */
export const inkStencil = (
  source: HTMLImageElement | HTMLCanvasElement,
  colour: string,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0);
  // source-in keeps the fill inside the drawn pixels, so the transparent rest
  // stays transparent — the same trick the night wash uses on the character.
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = colour;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

/**
 * Repaint a sheet's key colours, once, into a canvas the runtime draws from.
 *
 * Exact matches only. A near miss means the art and `KEYS` have drifted, and
 * the honest failure is that part keeping its drawn colour rather than the
 * whole figure being tinted by a tolerance nobody chose.
 */
export const recolour = (
  source: HTMLImageElement | HTMLCanvasElement,
  outfit: Outfit,
  target?: HTMLCanvasElement,
): HTMLCanvasElement => {
  // Repainting the same canvas rather than making a new one is what lets an
  // outfit be swapped live: the sheet holds this canvas, so the next frame
  // picks up the change with nothing rebuilt. Always painted from the pristine
  // source, never from the last result, or the substitutions compound.
  const canvas = target ?? document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;

  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0);

  // Packed into one integer per colour so the inner loop is a map lookup
  // rather than nine comparisons across 79,000 pixels.
  const table = new Map<number, RGB>();
  for (const [[r, g, b], to] of keyMap(outfit)) table.set((r << 16) | (g << 8) | b, to);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const to = table.get((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    if (!to) continue;
    data[i] = to[0];
    data[i + 1] = to[1];
    data[i + 2] = to[2];
  }
  context.putImageData(pixels, 0, 0);

  return canvas;
};
