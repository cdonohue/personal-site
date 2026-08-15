import { zonedParts } from './scene/render'

/**
 * What the room is doing: whether anyone is at the desk, and what is on screen.
 *
 * Host policy rather than scene behaviour, like the weather — the scene draws
 * whatever state it is handed and has no idea one of these is invented and the
 * other is measured. Kept out of the component so the model can be exercised on
 * its own; a probability curve that can only be observed by watching a hero for
 * two minutes at a time is a curve nobody will ever check.
 */

/**
 * The zone the room keeps.
 *
 * Everything the page derives from time reads this: the curve below, and the
 * clock face and dusk inside the scene. A visitor anywhere sees the room lit as
 * it actually is rather than by their own clock. It has to be a zone name and
 * never an offset, or the room is an hour wrong for eight months of the year.
 */
export const TIME_ZONE = 'America/Chicago'

/**
 * How likely someone is at the desk, by hour.
 *
 * Occupancy is a fiction and always was — nine-to-five weekdays was an invented
 * rule, not telemetry, and no desk empties at 17:00 sharp. What is real here is
 * the environment: the hour, the light and the weather all still describe the
 * world. This only decides whether the chair is full, which nothing outside the
 * page could confirm anyway.
 *
 * Weighted rather than a coin toss so the room stays plausible against its own
 * lighting. Someone can be at the desk at 3am; it is just rare.
 */
export const PRESENCE_CURVE: [hour: number, chance: number][] = [
  [0, 0.05],
  [3, 0.08],
  [6, 0.2],
  [9, 0.85],
  [13, 0.8],
  [17, 0.7],
  [19, 0.55],
  [21, 0.35],
  [23, 0.2],
  [24, 0.05],
]

/**
 * The first roll is floored well above the curve.
 *
 * A hero that opens on an empty chair and a dark screen reads as broken rather
 * than as nobody being home, and first paint is the one frame every visitor is
 * guaranteed to see. After that the curve runs honestly.
 */
export const FIRST_IMPRESSION_FLOOR = 0.8

/** How long a state holds before the next roll, in ms. */
export const DWELL_MIN = 60_000
export const DWELL_MAX = 120_000

/** Chance the screen is left running once the room empties. */
const LEFT_ON_CHANCE = 0.7
const LEFT_ON_CHANCE_LATE = 0.25

/** Chance of the work screen rather than the game, while someone is there. */
const WORKING_CHANCE = 0.75
const WORKING_CHANCE_OFF_HOURS = 0.25

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The curve read at an arbitrary hour, interpolated between its keyframes. */
export const presenceChanceAt = (hour: number): number => {
  for (let i = 1; i < PRESENCE_CURVE.length; i += 1) {
    const [prevHour, prevChance] = PRESENCE_CURVE[i - 1]
    const [nextHour, nextChance] = PRESENCE_CURVE[i]
    if (hour <= nextHour) {
      return lerp(prevChance, nextChance, (hour - prevHour) / (nextHour - prevHour))
    }
  }
  return PRESENCE_CURVE[PRESENCE_CURVE.length - 1][1]
}

/** Weekdays, nine to five, in the room's zone — now only a weighting, not a rule. */
const isWorkHours = (at: { hour: number; weekday: number }) =>
  at.weekday !== 0 && at.weekday !== 6 && at.hour >= 9 && at.hour < 17

/**
 * What the room is doing: whether anyone is there, what is on the screen, and
 * whether the screen is on at all.
 *
 * `content` is what shows *when powered*, kept separate from `powered` so that
 * clicking the monitor off and on again returns to what was already playing
 * rather than re-rolling it.
 */
export type Activity = {
  presence: 'present' | 'away'
  content: 'on' | 'game' | 'idle'
  powered: boolean
}

export const roll = (now: Date, floor = 0): Activity => {
  const at = zonedParts(now, TIME_ZONE)
  const hour = at.hour + at.minute / 60

  const present = Math.random() < Math.max(presenceChanceAt(hour), floor)
  if (present) {
    const working = Math.random() < (isWorkHours(at) ? WORKING_CHANCE : WORKING_CHANCE_OFF_HOURS)
    return { presence: 'present', content: working ? 'on' : 'game', powered: true }
  }

  // Empty room: the screensaver, or a screen that was shut off on the way out.
  const late = hour >= 23 || hour < 6
  const powered = Math.random() < (late ? LEFT_ON_CHANCE_LATE : LEFT_ON_CHANCE)
  return { presence: 'away', content: 'idle', powered }
}

export const dwellMs = () => DWELL_MIN + Math.random() * (DWELL_MAX - DWELL_MIN)
