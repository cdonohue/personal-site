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
 * The room is never handed to a visitor completely dark.
 *
 * An empty chair is fine, and after midnight it is the truth. An empty chair
 * in front of a dead monitor is not: nothing moves, nothing is lit, and the
 * hero reads as broken rather than as quiet. So the guarantee is about the
 * screen, not the chair.
 *
 * This replaced a floor on presence itself, which had to be high enough to
 * avoid that dark state and therefore drowned the hourly curve — 80% occupied
 * at three in the morning, against a dark window. Guaranteeing only the screen
 * lets the curve run honestly at every hour while still never opening on
 * nothing.
 */
export const LIVE_ON_ARRIVAL = true

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

export const roll = (now: Date, mustBeLit = false): Activity => {
  const at = zonedParts(now, TIME_ZONE)
  const hour = at.hour + at.minute / 60

  // Straight off the curve. Nothing overrides this any more.
  if (Math.random() < presenceChanceAt(hour)) {
    const working = Math.random() < (isWorkHours(at) ? WORKING_CHANCE : WORKING_CHANCE_OFF_HOURS)
    return { presence: 'present', content: working ? 'on' : 'game', powered: true }
  }

  // Empty room: the screensaver, or a screen shut off on the way out — unless
  // this is the frame the visitor arrives on, which is never allowed to be dark.
  const late = hour >= 23 || hour < 6
  const powered = mustBeLit || Math.random() < (late ? LEFT_ON_CHANCE_LATE : LEFT_ON_CHANCE)
  return { presence: 'away', content: 'idle', powered }
}

/**
 * The final scene state, once a visitor's monitor toggle is taken into account.
 *
 * Enforces the one rule the roll cannot: nobody sits at a dark screen or watches
 * their own screensaver. The roll never produces that pairing, but a visitor
 * switching the monitor off while someone is at the desk would, so the person
 * gets up instead. Turn it back on and they come back.
 *
 * Separate from `roll` and exported so the invariant can be checked directly
 * rather than by watching the hero and hoping.
 */
export const sceneStateFor = (
  activity: Activity,
  powerOverride: 'on' | 'off' | null,
): { presence: Activity['presence']; monitor: 'on' | 'game' | 'idle' | 'off' } => {
  const powered = powerOverride ? powerOverride === 'on' : activity.powered
  const monitor = powered ? activity.content : 'off'
  const worthSittingAt = monitor === 'on' || monitor === 'game'
  return {
    presence: activity.presence === 'present' && worthSittingAt ? 'present' : 'away',
    monitor,
  }
}
