export const DECOR_SLOTS = ['shelf', 'wall'] as const;

export type DecorSlot = typeof DECOR_SLOTS[number];
export type DecorEffect = 'candle-flicker';

export type DecorLayer = {
  /** Semantic part, so a body, flame, or glow can be replaced independently. */
  role: 'body' | 'flame' | 'glow';
  /** Layer name in room.aseprite and its generated room.<layer>.png export. */
  layer: string;
  /** Optional runtime treatment. Omitted layers are drawn as authored. */
  effect?: DecorEffect;
  /** Room layers receive the light wash; emissive layers return above it. */
  lighting?: 'room' | 'emissive';
};

export type DecorDefinition = {
  slot: DecorSlot;
  /** Back-to-front composition order. Body, flame and glow stay independently swappable. */
  layers: readonly DecorLayer[];
};

/**
 * The single contract for authored room decorations.
 *
 * Adding an item means adding its Aseprite layers and one entry here. Exporting,
 * loading, URL validation, and rendering all derive from this registry.
 */
export const DECOR_DEFINITIONS = {
  candle: {
    slot: 'shelf',
    layers: [
      {
        role: 'flame',
        layer: 'skull-candle-glow',
        effect: 'candle-flicker',
        lighting: 'emissive',
      },
      { role: 'body', layer: 'candle', lighting: 'emissive' },
    ],
  },
  'skull-candle': {
    slot: 'shelf',
    layers: [
      {
        role: 'flame',
        layer: 'skull-candle-glow',
        effect: 'candle-flicker',
        lighting: 'emissive',
      },
      { role: 'body', layer: 'skull-candle', lighting: 'emissive' },
    ],
  },
  snowman: {
    slot: 'shelf',
    layers: [{ role: 'body', layer: 'snowman' }],
  },
} as const satisfies Record<string, DecorDefinition>;

export type DecorId = keyof typeof DECOR_DEFINITIONS;
export type SceneDecor = Record<DecorSlot, DecorId | null>;
export type SceneDecorMode = 'auto' | Partial<SceneDecor>;

export const DEFAULT_DECOR: SceneDecor = {
  shelf: 'candle',
  wall: null,
};

const SEASONAL_DECOR: ReadonlyArray<{ month: number; slot: DecorSlot; decor: DecorId }> = [
  { month: 10, slot: 'shelf', decor: 'skull-candle' },
  { month: 12, slot: 'shelf', decor: 'snowman' },
];

const isDecorId = (value: string): value is DecorId => value in DECOR_DEFINITIONS;

const decorForSlot = (value: string | null, slot: DecorSlot): DecorId | null | undefined => {
  if (value === 'none') return null;
  if (!value || !isDecorId(value)) return undefined;
  return DECOR_DEFINITIONS[value].slot === slot ? value : undefined;
};

/**
 * URL preview overrides. `?decor=candle` remains as the shelf shorthand;
 * slot-specific parameters allow combinations such as a shelf candle and a
 * future wall poster without inventing a second parsing path.
 */
export const decorFromSearch = (search: string): Partial<SceneDecor> | undefined => {
  const params = new URLSearchParams(search);
  const result: Partial<SceneDecor> = {};

  const legacy = decorForSlot(params.get('decor'), 'shelf');
  if (legacy !== undefined) result.shelf = legacy;

  for (const slot of DECOR_SLOTS) {
    const requested = decorForSlot(params.get(`decor-${slot}`), slot);
    if (requested !== undefined) result[slot] = requested;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

export const decorForMonth = (month: number): SceneDecor => {
  const decor = { ...DEFAULT_DECOR };
  for (const rule of SEASONAL_DECOR) {
    if (rule.month === month) decor[rule.slot] = rule.decor;
  }
  return decor;
};

export const decorForDate = (date: Date, timeZone?: string): SceneDecor => {
  const month = timeZone
    ? Number(new Intl.DateTimeFormat('en-US', { timeZone, month: 'numeric' }).format(date))
    : date.getMonth() + 1;
  return decorForMonth(month);
};

export const resolveDecor = (
  date: Date,
  forced: Partial<SceneDecor> | undefined,
  timeZone?: string,
): SceneDecor => ({ ...decorForDate(date, timeZone), ...forced });

export const DECOR_ART_LAYERS = [...new Set(
  Object.values(DECOR_DEFINITIONS).flatMap(({ layers }) => layers.map(({ layer }) => layer)),
)];

const CANDLE_FLICKER = [
  { duration: 180, alpha: 0.82 },
  { duration: 70, alpha: 0.58 },
  { duration: 120, alpha: 0.96 },
  { duration: 260, alpha: 0.72 },
  { duration: 90, alpha: 0.9 },
  { duration: 80, alpha: 0.5 },
  { duration: 200, alpha: 1 },
  { duration: 140, alpha: 0.76 },
  { duration: 220, alpha: 0.88 },
] as const;

const CANDLE_FLICKER_DURATION = CANDLE_FLICKER.reduce(
  (total, frame) => total + frame.duration,
  0,
);

/**
 * Flickers the authored 20%-alpha glow at irregular intervals between 50% and
 * 100% draw alpha, producing a final visible opacity between 10% and 20%.
 */
export const candleGlowAlphaAt = (elapsed: number, reducedMotion = false): number => {
  if (reducedMotion) return 0.75;

  let at = ((elapsed % CANDLE_FLICKER_DURATION) + CANDLE_FLICKER_DURATION)
    % CANDLE_FLICKER_DURATION;

  for (const [index, frame] of CANDLE_FLICKER.entries()) {
    if (at < frame.duration) {
      const next = CANDLE_FLICKER[(index + 1) % CANDLE_FLICKER.length];
      const progress = at / frame.duration;
      const eased = progress * progress * (3 - 2 * progress);
      return frame.alpha + (next.alpha - frame.alpha) * eased;
    }
    at -= frame.duration;
  }

  return CANDLE_FLICKER[0].alpha;
};
