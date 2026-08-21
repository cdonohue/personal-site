/**
 * Every toggle in the scene, live or not.
 *
 * One list so the toggle bar, the debug grid, and the plan cannot drift apart.
 * `blockedBy` entries are from ASEPRITE_CHECKLIST.md's runtime model and are
 * listed deliberately — a control that cannot be built yet is easy to forget
 * exists, and its interactions are the ones that surprise you later.
 *
 * Values are strings rather than booleans because the plan's controls are not
 * all binary: lighting is auto/day/night today, and presence will be
 * present/away/empty once there is a character to show.
 */

/**
 * Shared with vite.config.ts, which exports a day/night render for each. One
 * list so the art pipeline and the toggle cannot disagree about what exists.
 */
export const WEATHER_CONDITIONS = ['clear', 'overcast', 'fog', 'rain', 'snow'] as const;

export type Weather = (typeof WEATHER_CONDITIONS)[number];

/**
 * Sunrise and sunset as decimal hours in the room's own zone.
 *
 * Environment rather than a toggle, the same as weather: measured outside and
 * handed in. Null while nothing has been fetched, or when the fetch failed —
 * the scene falls back to a fixed curve, which is what it used before.
 */
export type Daylight = { sunrise: number; sunset: number };

export type ToggleValues = {
  presence: 'present' | 'typing' | 'away' | 'empty';
  weather: Weather;
  /** Real sunrise and sunset, when they are known. Null falls back to a curve. */
  daylight: Daylight | null;
  lighting: 'auto' | 'day' | 'night';
  roomLight: 'on' | 'off';
  /**
   * Power only. What is on the screen is `screen`, below.
   *
   * These were one field once — on/game/idle/off — which meant everything that
   * wanted to know whether there was power had to list the lit states by name,
   * and adding a scene meant finding all of them.
   */
  monitor: 'on' | 'off';
  /**
   * Which tag plays while the monitor is lit: a scene from `SCREEN_TAGS`, or a
   * screensaver from `SCREENSAVER_TAGS`.
   *
   * A string rather than a union, deliberately. The scene draws whichever tag it
   * is handed and has no view on which are scenes and which are screensavers —
   * that distinction is about whether anyone is at the desk, which is host
   * policy. An undrawn tag falls back rather than throwing.
   */
  screen: string;
  clock: '12-hour' | '24-hour';
};

export type LiveToggleId = keyof ToggleValues;

export type LiveToggle = {
  [K in LiveToggleId]: {
    id: K;
    label: string;
    options: readonly ToggleValues[K][];
    /** Shown under the control when it needs a word of explanation. */
    note?: string;
  };
}[LiveToggleId];

export type BlockedToggle = {
  id: string;
  label: string;
  states: string[];
  blockedBy: string;
};

export const LIVE_TOGGLES: LiveToggle[] = [
  {
    id: 'presence',
    label: 'Presence',
    options: ['present', 'typing', 'away', 'empty'],
    note: 'away leaves the chair, empty pushes it in',
  },
  {
    id: 'weather',
    label: 'Weather',
    options: WEATHER_CONDITIONS,
    note: 'sky seen through the glass',
  },
  {
    id: 'lighting',
    label: 'Lighting',
    options: ['auto', 'day', 'night'],
    note: 'auto follows local time',
  },
  { id: 'roomLight', label: 'Room light', options: ['on', 'off'] },
  { id: 'monitor', label: 'Monitor power', options: ['on', 'off'] },
  {
    id: 'screen',
    label: 'On screen',
    // Not exhaustive and cannot be: the scene accepts any tag in the sheet.
    // These are the ones worth stepping through by hand.
    options: ['ai-work', 'game', 'cube', 'bounce'],
    note: 'scenes and screensavers are the same field',
  },
  { id: 'clock', label: 'Clock format', options: ['12-hour', '24-hour'] },
];

export const BLOCKED_TOGGLES: BlockedToggle[] = [
  {
    id: 'headphonesMode',
    label: 'Headphones',
    states: ['hanging', 'worn'],
    blockedBy: 'headphones are baked into DESK/surface, and worn needs a character',
  },
];

export const DEFAULT_VALUES: ToggleValues = {
  presence: 'typing',
  weather: 'clear',
  daylight: null,
  lighting: 'auto',
  roomLight: 'on',
  monitor: 'on',
  // Named here rather than imported from render.ts, which imports this file.
  screen: 'ai-work',
  clock: '12-hour',
};

/**
 * Every combination of the given toggles, holding the rest at `base`.
 *
 * Deliberately not the full product any more: with weather and lighting added
 * that is 5 x 3 x 2 x 2 x 2 = 120 tiles, which is a wall of pictures rather
 * than something you can read. The debug panel slices it instead.
 */
export const permutations = (
  ids: LiveToggleId[],
  base: ToggleValues = DEFAULT_VALUES,
): ToggleValues[] => {
  let all: ToggleValues[] = [{ ...base }];
  for (const id of ids) {
    const toggle = LIVE_TOGGLES.find((candidate) => candidate.id === id);
    if (!toggle) continue;
    all = all.flatMap((values) =>
      (toggle.options as readonly string[]).map((option) => ({ ...values, [id]: option })),
    );
  }
  return all;
};

/** e.g. "night · light on · monitor on · 12-hour" */
export const describe = (values: ToggleValues): string =>
  [
    values.presence,
    values.weather,
    values.lighting,
    `light ${values.roomLight}`,
    `monitor ${values.monitor}`,
    values.clock,
  ].join(' · ');
