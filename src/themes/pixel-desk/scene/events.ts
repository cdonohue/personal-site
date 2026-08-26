export type SkyEventMode = 'random' | 'shooting-star' | 'ufo' | 'off'

export type ShootingStarFrame = {
  kind: 'shooting-star'
  progress: number
  window: 'left' | 'right'
  direction: 1 | -1
  startY: number
  fall: number
  trailLength: number
}

export type UfoFrame = {
  kind: 'ufo'
  elapsed: number
  phase: 'enter' | 'hover' | 'exit'
  progress: number
  window: 'left' | 'right'
  direction: 1 | -1
  exit: 'cross-right' | 'up'
  y: number
}

export type SkyEventFrame = ShootingStarFrame | UfoFrame

type ShootingStarSchedule = Omit<ShootingStarFrame, 'kind' | 'progress'> & {
  kind: 'shooting-star'
  delay: number
  duration: number
}

type UfoSchedule = Pick<UfoFrame, 'kind' | 'window' | 'direction' | 'exit' | 'y'> & {
  delay: number
  duration: number
}

type SkyEventSchedule = ShootingStarSchedule | UfoSchedule

export const SHOOTING_STAR_CHANCE = 0.2
export const UFO_CHANCE = 0.05
export const SHOOTING_STAR_DELAY_MIN = 5_000
export const SHOOTING_STAR_DELAY_MAX = 30_000
const SHOOTING_STAR_DURATION_MIN = 1_000
const SHOOTING_STAR_DURATION_MAX = 1_500
const UFO_DELAY_MIN = 8_000
const UFO_DELAY_MAX = 35_000
const UFO_ENTER_DURATION = 800
const UFO_HOVER_DURATION = 2_400
const UFO_EXIT_DURATION = 600
const UFO_DURATION = UFO_ENTER_DURATION + UFO_HOVER_DURATION + UFO_EXIT_DURATION
const FULL_NIGHT = 0.95
const FORCED_DELAY = 500
const FORCED_PAUSE = 1_500

const between = (random: () => number, min: number, max: number) =>
  min + random() * (max - min)

const shootingStarSchedule = (
  random: () => number,
  forced: boolean,
): ShootingStarSchedule => ({
    kind: 'shooting-star',
    delay: forced ? FORCED_DELAY : between(random, SHOOTING_STAR_DELAY_MIN, SHOOTING_STAR_DELAY_MAX),
    duration: between(random, SHOOTING_STAR_DURATION_MIN, SHOOTING_STAR_DURATION_MAX),
    window: random() < 0.5 ? 'left' : 'right',
    direction: random() < 0.5 ? 1 : -1,
    startY: between(random, 22, 28),
    fall: between(random, 34, 42),
    trailLength: Math.round(between(random, 4, 7)),
  })

const ufoSchedule = (random: () => number, forced: boolean): UfoSchedule => {
  const window = random() < 0.5 ? 'left' : 'right'
  const direction = random() < 0.5 ? 1 : -1
  return {
    kind: 'ufo',
    delay: forced ? FORCED_DELAY : between(random, UFO_DELAY_MIN, UFO_DELAY_MAX),
    duration: UFO_DURATION,
    window,
    direction,
    exit: window === 'left' && direction === 1 ? 'cross-right' : 'up',
    y: between(random, 31, 43),
  }
}

const schedule = (random: () => number, mode: SkyEventMode): SkyEventSchedule | undefined => {
  if (mode === 'shooting-star') return shootingStarSchedule(random, true)
  if (mode === 'ufo') return ufoSchedule(random, true)
  if (mode === 'off') return undefined

  const roll = random()
  if (roll < UFO_CHANCE) return ufoSchedule(random, false)
  if (roll < UFO_CHANCE + SHOOTING_STAR_CHANCE) return shootingStarSchedule(random, false)
  return undefined
}

/**
 * A visit-scoped, one-shot piece of sky choreography.
 *
 * Randomness is resolved at construction. `frameAt` is therefore deterministic
 * and safe to call from requestAnimationFrame without rerolling the event sixty
 * times a second. Natural events start their delay only once night is fully in;
 * the forced preview loops so it cannot be missed while inspecting the URL.
 */
export class SkyEventController {
  private readonly plan?: SkyEventSchedule
  private readonly forced: boolean
  private nightStartedAt?: number
  private finished = false

  constructor(mode: SkyEventMode = 'random', random: () => number = Math.random) {
    this.forced = mode === 'shooting-star' || mode === 'ufo'
    this.plan = schedule(random, mode)
  }

  frameAt(elapsed: number, nightAmount: number, reducedMotion: boolean): SkyEventFrame | undefined {
    if (!this.plan || reducedMotion) return undefined

    if (this.forced) {
      return this.frameFor(elapsed % (this.plan.delay + this.plan.duration + FORCED_PAUSE))
    }

    if (this.finished) return undefined
    if (nightAmount < FULL_NIGHT) {
      this.nightStartedAt = undefined
      return undefined
    }

    this.nightStartedAt ??= elapsed
    const nightElapsed = elapsed - this.nightStartedAt
    if (nightElapsed > this.plan.delay + this.plan.duration) {
      this.finished = true
      return undefined
    }
    return this.frameFor(nightElapsed)
  }

  private frameFor(elapsed: number): SkyEventFrame | undefined {
    if (!this.plan) return undefined
    const progress = (elapsed - this.plan.delay) / this.plan.duration
    if (progress < 0 || progress > 1) return undefined

    if (this.plan.kind === 'ufo') {
      const eventElapsed = elapsed - this.plan.delay
      if (eventElapsed < UFO_ENTER_DURATION) {
        return {
          kind: 'ufo',
          elapsed: eventElapsed,
          phase: 'enter',
          progress: eventElapsed / UFO_ENTER_DURATION,
          window: this.plan.window,
          direction: this.plan.direction,
          exit: this.plan.exit,
          y: this.plan.y,
        }
      }
      if (eventElapsed < UFO_ENTER_DURATION + UFO_HOVER_DURATION) {
        return {
          kind: 'ufo',
          elapsed: eventElapsed,
          phase: 'hover',
          progress: (eventElapsed - UFO_ENTER_DURATION) / UFO_HOVER_DURATION,
          window: this.plan.window,
          direction: this.plan.direction,
          exit: this.plan.exit,
          y: this.plan.y,
        }
      }
      return {
        kind: 'ufo',
        elapsed: eventElapsed,
        phase: 'exit',
        progress:
          (eventElapsed - UFO_ENTER_DURATION - UFO_HOVER_DURATION) / UFO_EXIT_DURATION,
        window: this.plan.window,
        direction: this.plan.direction,
        exit: this.plan.exit,
        y: this.plan.y,
      }
    }

    return {
      kind: 'shooting-star',
      progress,
      window: this.plan.window,
      direction: this.plan.direction,
      startY: this.plan.startY,
      fall: this.plan.fall,
      trailLength: this.plan.trailLength,
    }
  }
}
