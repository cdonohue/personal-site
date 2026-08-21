/**
 * Every value the scene takes, and what a human may set it to.
 *
 * `LIVE_TOGGLES` is the list the dev room renders a control from, so adding a
 * value here is enough to make it adjustable at /dev. It went unread for a long
 * while after the prototype's toggle bar was dropped, and drifted; it has a
 * consumer again now.
 *
 * Values are strings rather than booleans because they are not all binary:
 * lighting is auto/day/night, and presence has four states of which two are
 * still undrawn.
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

/**
 * `screen` is deliberately absent. Its options are the three tag lists in
 * render.ts, which this file cannot import without a cycle, so the dev room
 * builds that control from them directly. A copy here would be a second list of
 * screens to keep in step, which is the thing that was just removed everywhere
 * else.
 */
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
  { id: 'clock', label: 'Clock format', options: ['12-hour', '24-hour'] },
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
