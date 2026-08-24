import { PLAY_TAGS, SCREENSAVER_TAGS, WORK_TAGS, zonedParts } from './scene/render'
import { outfitFor, type Outfit } from './scene/outfits'

/**
 * What the room is doing: whether anyone is at the desk, and what is on screen.
 *
 * Host policy rather than scene behaviour, like the weather — the scene draws
 * whatever state it is handed and has no idea one of these is invented and the
 * other is measured. Kept out of the component so the model can be exercised on
 * its own; a probability curve that can only be observed by watching a hero for
 * two minutes at a time is a curve nobody will ever check.
 */

/** Weekdays, nine to five, in the chosen zone. Inside this, the desk is manned. */
const WORK_START = 9
const WORK_END = 17

/**
 * How likely someone is at the desk **outside** working hours.
 *
 * Inside them it is not a probability at all: the desk is occupied, full stop.
 * This curve only covers evenings, nights and weekends, which is why every
 * value on it is small. It is a room somebody might wander back into, not a
 * second working day.
 *
 * Weighted by hour rather than flat so it stays plausible against its own
 * lighting. Someone can be at the desk at 3am; it is just rare. The bulge in the
 * evening is where an off-hours visitor is most likely to find anyone, and the
 * daytime figure is really about weekends.
 */
export const PRESENCE_CURVE: [hour: number, chance: number][] = [
  [0, 0.03],
  [6, 0.05],
  [9, 0.18],
  [17, 0.2],
  [19, 0.25],
  [22, 0.12],
  [24, 0.03],
]

/** Chance of a work screen rather than a game, while someone is there. */
const WORKING_CHANCE = 0.75
const WORKING_CHANCE_OFF_HOURS = 0.25

const pick = <T>(from: readonly T[]): T => from[Math.floor(Math.random() * from.length)]

/**
 * Chance the desk is already up when you arrive.
 *
 * Rolled independently of whether anyone is there, because the desk keeps its
 * height either way — it is furniture, not a posture. An empty room at standing
 * height is somebody who stood up and walked off, which is the commonest way a
 * sit-stand desk is actually found.
 *
 * A third is about what someone with one of these spends standing. Higher and
 * the seated pose, which is the drawing the page is built around, stops being
 * the thing you usually see.
 */
const STANDING_CHANCE = 0.3

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

export const isWorkHours = (at: { hour: number; weekday: number }) =>
  at.weekday !== 0 && at.weekday !== 6 && at.hour >= WORK_START && at.hour < WORK_END

/**
 * What the room is doing: whether anyone is there, and what is on the screen.
 *
 * Nothing here says whether the screen is *on*. It always is, as far as the
 * schedule is concerned; the only thing that darkens it is the plug leaving the
 * wall, and that is the scene's business rather than this model's.
 */
export type Activity = {
  presence: 'present' | 'away'
  /**
   * The tag on the monitor: a scene while somebody is there, a screensaver
   * while they are not.
   *
   * One field, because the monitor does not distinguish between them — it plays
   * whatever tag it is handed. Which kind it gets is the only part that is
   * policy, and it is decided here.
   */
  screen: string
  /**
   * How the room is found, not how it got that way.
   *
   * The scene animates between the two when a visitor works the desk control,
   * but on arrival it is simply already one or the other — nobody stands up in
   * an empty room to explain why the desk is high.
   */
  posture: 'seated' | 'standing'
  /**
   * What they are wearing.
   *
   * Derived from the date rather than rolled, which is the whole difference:
   * one outfit a day, the same for everybody looking on that day, and a reload
   * cannot change it. The other three fields here are chance; this one is a
   * calendar.
   */
  outfit: Outfit
}

export const roll = (now: Date, timeZone?: string): Activity => {
  const at = zonedParts(now, timeZone)
  const hour = at.hour + at.minute / 60

  // Independent of everything below it. The desk is where it was left, which
  // has no bearing on whether anyone came back to it.
  const posture = Math.random() < STANDING_CHANCE ? 'standing' : 'seated'

  const outfit = outfitFor(now, timeZone)

  // Working hours are a guarantee rather than a weighting. Outside them the
  // curve takes over, and every value on it is small.
  const working = isWorkHours(at)
  if (working || Math.random() < presenceChanceAt(hour)) {
    // Being at the desk during working hours does not oblige anyone to be
    // working. A game at two on a Tuesday is a better joke than a rule; it is
    // just less likely than the alternative.
    const chance = working ? WORKING_CHANCE : WORKING_CHANCE_OFF_HOURS
    const screen = pick(Math.random() < chance ? WORK_TAGS : PLAY_TAGS)
    return { presence: 'present', screen, posture, outfit }
  }

  // An empty room starts with a random screensaver, and the automatic choice
  // varies between visits rather than changing underneath somebody. The page
  // may advance from that choice when the visitor clicks the monitor; that is
  // an explained change rather than an ambient glitch.
  //
  // The screen is never simply off. The only thing that darkens it is the plug
  // coming out of the wall, which is a visitor's doing rather than a schedule's.
  return { presence: 'away', screen: pick(SCREENSAVER_TAGS), posture, outfit }
}
