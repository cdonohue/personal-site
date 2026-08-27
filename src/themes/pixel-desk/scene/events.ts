export type SceneEventMode = 'random' | 'shooting-star' | 'ufo' | 'jigsaw' | 'off'
export type ForcedSceneEventMode = Exclude<SceneEventMode, 'random' | 'off'>

const FORCED_SCENE_EVENTS = ['shooting-star', 'ufo', 'jigsaw'] as const

/** A known `?event=` value, shared by the site and development workbench. */
export const sceneEventFromSearch = (search: string): ForcedSceneEventMode | undefined => {
  const requested = new URLSearchParams(search).get('event')
  return FORCED_SCENE_EVENTS.find((event) => event === requested)
}

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

export type JigsawFrame = {
  kind: 'jigsaw'
  phase: 'fade-in' | 'flicker' | 'reveal' | 'speak' | 'pause' | 'fade-out'
  darkness: number
  screenOpacity: number
  faceOpacity: number
}

export type SceneEventFrame = ShootingStarFrame | UfoFrame | JigsawFrame

type ShootingStarSchedule = Omit<ShootingStarFrame, 'kind' | 'progress'> & {
  kind: 'shooting-star'
  delay: number
  duration: number
}

type UfoSchedule = Pick<UfoFrame, 'kind' | 'window' | 'direction' | 'exit' | 'y'> & {
  delay: number
  duration: number
}

type JigsawSchedule = {
  kind: 'jigsaw'
  delay: number
  duration: number
}

type SceneEventSchedule = ShootingStarSchedule | UfoSchedule | JigsawSchedule

export const SHOOTING_STAR_CHANCE = 0.2
export const UFO_CHANCE = 0.05
export const JIGSAW_CHANCE = 0.01
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
export const JIGSAW_DELAY_MIN = 20_000
const JIGSAW_DELAY_MAX = 90_000
const JIGSAW_FADE_IN_DURATION = 400
const JIGSAW_FLICKER_DURATION = 600
const JIGSAW_SPEECH_PAUSE_DURATION = 1_000
// The supplied voice clip is 2.22 seconds; a small tail prevents the room
// from recovering before its final syllable finishes.
const JIGSAW_SPEECH_DURATION = 2_300
const JIGSAW_FADE_OUT_DURATION = 800
const JIGSAW_DURATION =
  JIGSAW_FADE_IN_DURATION +
  JIGSAW_FLICKER_DURATION +
  JIGSAW_SPEECH_PAUSE_DURATION +
  JIGSAW_SPEECH_DURATION +
  JIGSAW_SPEECH_PAUSE_DURATION +
  JIGSAW_FADE_OUT_DURATION
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

const jigsawSchedule = (random: () => number, forced: boolean): JigsawSchedule => ({
  kind: 'jigsaw',
  delay: forced ? FORCED_DELAY : between(random, JIGSAW_DELAY_MIN, JIGSAW_DELAY_MAX),
  duration: JIGSAW_DURATION,
})

const schedule = (
  random: () => number,
  mode: SceneEventMode,
  october: boolean,
): SceneEventSchedule | undefined => {
  if (mode === 'shooting-star') return shootingStarSchedule(random, true)
  if (mode === 'ufo') return ufoSchedule(random, true)
  if (mode === 'jigsaw') return jigsawSchedule(random, true)
  if (mode === 'off') return undefined

  const roll = random()
  if (roll < UFO_CHANCE) return ufoSchedule(random, false)
  if (roll < UFO_CHANCE + SHOOTING_STAR_CHANCE) return shootingStarSchedule(random, false)
  if (october && roll < UFO_CHANCE + SHOOTING_STAR_CHANCE + JIGSAW_CHANCE) {
    return jigsawSchedule(random, false)
  }
  return undefined
}

/**
 * A visit-scoped, one-shot piece of room choreography.
 *
 * Randomness is resolved at construction. `frameAt` is therefore deterministic
 * and safe to call from requestAnimationFrame without rerolling the event sixty
 * times a second. Natural sky events start their delay only once night is fully
 * in; room events count from the visit. Forced previews loop so they cannot be
 * missed while inspecting the URL.
 */
export class SceneEventController {
  private readonly plan?: SceneEventSchedule
  private readonly forced: boolean
  private nightStartedAt?: number
  private jigsawInteractedAt?: number
  private finished = false

  constructor(
    mode: SceneEventMode = 'random',
    random: () => number = Math.random,
    now: Date = new Date(),
  ) {
    this.forced = mode !== 'random' && mode !== 'off'
    this.plan = schedule(random, mode, now.getMonth() === 9)
  }

  jigsawSelected(): boolean {
    return this.plan?.kind === 'jigsaw'
  }

  /**
   * Arm a selected Jigsaw event with the visitor's first page interaction.
   * Its delay begins here, not at page load, so the sound is permitted and the
   * event cannot ambush the same click that enabled it.
   */
  interact(elapsed: number): void {
    if (this.plan?.kind !== 'jigsaw') return
    this.jigsawInteractedAt ??= elapsed
  }

  frameAt(
    elapsed: number,
    nightAmount: number,
    reducedMotion: boolean,
  ): SceneEventFrame | undefined {
    if (!this.plan || reducedMotion) return undefined

    let interactionElapsed = elapsed
    if (this.plan.kind === 'jigsaw') {
      if (this.jigsawInteractedAt === undefined) return undefined
      interactionElapsed = elapsed - this.jigsawInteractedAt
    }

    if (this.forced) {
      return this.frameFor(
        interactionElapsed % (this.plan.delay + this.plan.duration + FORCED_PAUSE),
      )
    }

    if (this.finished) return undefined
    let eventElapsed = interactionElapsed
    if (this.plan.kind !== 'jigsaw') {
      if (nightAmount < FULL_NIGHT) {
        this.nightStartedAt = undefined
        return undefined
      }
      this.nightStartedAt ??= elapsed
      eventElapsed = elapsed - this.nightStartedAt
    }

    if (eventElapsed > this.plan.delay + this.plan.duration) {
      this.finished = true
      return undefined
    }
    return this.frameFor(eventElapsed)
  }

  private frameFor(elapsed: number): SceneEventFrame | undefined {
    if (!this.plan) return undefined
    const progress = (elapsed - this.plan.delay) / this.plan.duration
    if (progress < 0 || progress > 1) return undefined

    if (this.plan.kind === 'jigsaw') {
      const eventElapsed = elapsed - this.plan.delay
      if (eventElapsed < JIGSAW_FADE_IN_DURATION) {
        const amount = eventElapsed / JIGSAW_FADE_IN_DURATION
        return {
          kind: 'jigsaw',
          phase: 'fade-in',
          darkness: amount,
          screenOpacity: 0,
          faceOpacity: 0,
        }
      }
      if (eventElapsed < JIGSAW_FADE_IN_DURATION + JIGSAW_FLICKER_DURATION) {
        const flickerElapsed = eventElapsed - JIGSAW_FADE_IN_DURATION
        const screenOpacity =
          flickerElapsed < 90
            ? 0.85
            : flickerElapsed < 170
              ? 0.08
              : flickerElapsed < 310
                ? 0.55
                : flickerElapsed < 390
                  ? 0
                  : flickerElapsed < 500
                    ? 0.7
                    : 1
        return { kind: 'jigsaw', phase: 'flicker', darkness: 1, screenOpacity, faceOpacity: 0 }
      }
      if (
        eventElapsed <
        JIGSAW_FADE_IN_DURATION +
          JIGSAW_FLICKER_DURATION +
          JIGSAW_SPEECH_PAUSE_DURATION
      ) {
        return {
          kind: 'jigsaw',
          phase: 'reveal',
          darkness: 1,
          screenOpacity: 1,
          faceOpacity: 1,
        }
      }
      if (
        eventElapsed <
        JIGSAW_FADE_IN_DURATION +
          JIGSAW_FLICKER_DURATION +
          JIGSAW_SPEECH_PAUSE_DURATION +
          JIGSAW_SPEECH_DURATION
      ) {
        return {
          kind: 'jigsaw',
          phase: 'speak',
          darkness: 1,
          screenOpacity: 1,
          faceOpacity: 1,
        }
      }
      if (
        eventElapsed <
        JIGSAW_FADE_IN_DURATION +
          JIGSAW_FLICKER_DURATION +
          JIGSAW_SPEECH_PAUSE_DURATION +
          JIGSAW_SPEECH_DURATION +
          JIGSAW_SPEECH_PAUSE_DURATION
      ) {
        return {
          kind: 'jigsaw',
          phase: 'pause',
          darkness: 1,
          screenOpacity: 1,
          faceOpacity: 1,
        }
      }
      const amount =
        1 -
        (eventElapsed -
          JIGSAW_FADE_IN_DURATION -
          JIGSAW_FLICKER_DURATION -
          JIGSAW_SPEECH_PAUSE_DURATION -
          JIGSAW_SPEECH_DURATION -
          JIGSAW_SPEECH_PAUSE_DURATION) /
          JIGSAW_FADE_OUT_DURATION
      return {
        kind: 'jigsaw',
        phase: 'fade-out',
        darkness: amount,
        screenOpacity: amount,
        faceOpacity: amount,
      }
    }

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
