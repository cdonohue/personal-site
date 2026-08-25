import { nightAmountFor, washFor } from './lighting.ts'
import {
  CHAIR_EXIT,
  CHAIR_SHOVE_TAG,
  DESK_MAX,
  DESK_RAISED,
  POSTURE_TAG,
  STARTLE_TAG,
  type Posture,
} from './state.ts'
import type { ToggleValues } from './toggles.ts'

export type MonitorPhase = 'lit' | 'off' | 'turning-on' | 'turning-off'

const EASING = 0.18
const CABLE_FALL_EASING = 0.22
const REACTION_DELAY = 320
const REACTION_MIN = 120
const DESK_STIFFNESS = 0.02
const DESK_DAMPING_UP = 0.15
const DESK_DAMPING_DOWN = 0.31
const POSTURE_FALLBACK_MS = 290

const STAND_PLAN = {
  person: { at: 0 },
  chair: { at: 150, for: 630 },
  desk: 60,
}

const SIT_PLAN = {
  chair: { at: 0, for: 630 },
  person: { at: 540 },
  desk: 520,
}

const shove = (progress: number) => progress * (2 - progress)
const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

type Move = { to: Posture; since: number }
type Reaction = { phase: 'noticing' | 'surprised'; since: number; tag: string }

export type SimulationDurations = {
  characterHasTag(tag: string): boolean
  characterTagDuration(tag: string): number
  powerTagDuration(tag: 'power-on' | 'power-off'): number
}

export type SimulationFrame = {
  night: number
  wash: number
  monitor: { phase: MonitorPhase; elapsed: number }
  deskOffset: number
  cableFall: number
  chairShift: number
  posture: Posture
  powered: boolean
  characterOneShot?: { tag: string; elapsed: number }
  chairOneShot?: { tag: string; elapsed: number }
}

export type SceneSimulationOptions = {
  values: ToggleValues
  posture?: Posture
  reducedMotion: boolean
  timeZone?: string
  now: Date
  durations: SimulationDurations
}

/**
 * Deterministic scene evolution.
 *
 * It owns no clock and schedules no frame. A host supplies timestamps, current
 * values and wall time; identical inputs produce identical transitions. Canvas
 * drawing, asset loading and requestAnimationFrame remain outside it.
 */
export class SceneSimulation {
  private readonly reducedMotion: boolean
  private readonly timeZone?: string
  private readonly durations: SimulationDurations

  private night: number
  private wash: number
  private monitor: { phase: MonitorPhase; since: number }
  private deskRaised = false
  private desk = 0
  private deskVelocity = 0
  private posture: Posture = 'seated'
  private move: Move | null = null
  private pending: Posture | null = null
  private chairShift = 0
  private cablePlugged = true
  private powerLostAt: number | null = null
  private cableFall = 0
  private reaction: Reaction | null = null

  constructor(options: SceneSimulationOptions) {
    this.reducedMotion = options.reducedMotion
    this.timeZone = options.timeZone
    this.durations = options.durations
    this.night = nightAmountFor(
      options.values.lighting,
      options.now,
      options.timeZone,
      options.values.daylight,
    )
    this.wash = washFor(options.values.roomLight === 'on', this.night)
    this.monitor = {
      phase: options.values.monitor === 'off' ? 'off' : 'lit',
      since: 0,
    }
    if (options.posture === 'standing') this.arriveAt('standing', options.values.presence)
  }

  private postureDuration(to: Posture) {
    const tag = POSTURE_TAG[to]
    return this.durations.characterHasTag(tag)
      ? this.durations.characterTagDuration(tag)
      : POSTURE_FALLBACK_MS
  }

  private planFor(to: Posture) {
    return to === 'standing' ? STAND_PLAN : SIT_PLAN
  }

  private planTotal(to: Posture) {
    const plan = this.planFor(to)
    return Math.max(plan.person.at + this.postureDuration(to), plan.chair.at + plan.chair.for)
  }

  private settleInto(to: Posture, presence: ToggleValues['presence']) {
    this.posture = to
    this.move = null
    this.pending = null
    this.chairShift = to === 'standing' && presence === 'present' ? CHAIR_EXIT : 0
    this.deskRaised = to === 'standing'
  }

  private arriveAt(to: Posture, presence: ToggleValues['presence']) {
    this.settleInto(to, presence)
    this.desk = to === 'standing' ? DESK_RAISED : 0
    this.deskVelocity = 0
  }

  step(time: number, now: Date, values: ToggleValues): SimulationFrame {
    const nightTarget = nightAmountFor(values.lighting, now, this.timeZone, values.daylight)
    this.night = this.reducedMotion ? nightTarget : this.night + (nightTarget - this.night) * EASING
    const washTarget = washFor(values.roomLight === 'on', this.night)
    this.wash = this.reducedMotion ? washTarget : this.wash + (washTarget - this.wash) * EASING

    if (this.reaction) {
      const inPhase = time - this.reaction.since
      if (this.reaction.phase === 'noticing' && inPhase >= REACTION_DELAY) {
        const wanted = STARTLE_TAG[this.posture]
        this.reaction = {
          phase: 'surprised',
          since: time,
          tag: this.durations.characterHasTag(wanted) ? wanted : STARTLE_TAG.seated,
        }
      } else if (this.reaction.phase === 'surprised') {
        const hold = Math.max(
          this.durations.characterHasTag(this.reaction.tag)
            ? this.durations.characterTagDuration(this.reaction.tag)
            : 0,
          REACTION_MIN,
        )
        if (inPhase >= hold) this.reaction = null
      }
    }

    const fallTarget = this.cablePlugged ? 0 : 1
    this.cableFall = this.reducedMotion
      ? fallTarget
      : this.cableFall + (fallTarget - this.cableFall) * CABLE_FALL_EASING
    if (Math.abs(fallTarget - this.cableFall) < 0.01) this.cableFall = fallTarget

    let characterOneShot: SimulationFrame['characterOneShot']
    let chairOneShot: SimulationFrame['chairOneShot']

    if (this.move && this.cablePlugged) {
      const plan = this.planFor(this.move.to)
      const total = this.planTotal(this.move.to)
      const inMove = time - this.move.since

      if (inMove >= plan.desk) this.deskRaised = this.move.to === 'standing'

      const travel = clamp01((inMove - plan.chair.at) / plan.chair.for)
      this.chairShift =
        this.move.to === 'standing'
          ? CHAIR_EXIT * shove(travel)
          : CHAIR_EXIT * (1 - shove(travel))

      const inPerson = inMove - plan.person.at
      if (inPerson >= 0) characterOneShot = { tag: POSTURE_TAG[this.move.to], elapsed: inPerson }

      const inChair = inMove - plan.chair.at
      if (this.move.to === 'standing' && inChair >= 0) {
        chairOneShot = { tag: CHAIR_SHOVE_TAG, elapsed: inChair }
      }

      if (inMove >= total) {
        const arrived = this.move.to
        const next = this.pending
        this.settleInto(arrived, values.presence)
        if (next && next !== arrived) this.move = { to: next, since: time }
      }
    }

    const deskTarget = this.deskRaised ? DESK_RAISED : 0
    if (!this.cablePlugged) {
      this.deskVelocity = 0
    } else if (this.reducedMotion) {
      this.desk = deskTarget
      this.deskVelocity = 0
    } else {
      const damping = this.deskRaised ? DESK_DAMPING_UP : DESK_DAMPING_DOWN
      this.deskVelocity += (deskTarget - this.desk) * DESK_STIFFNESS - this.deskVelocity * damping
      this.desk = Math.max(0, Math.min(DESK_MAX, this.desk + this.deskVelocity))
      if (Math.abs(deskTarget - this.desk) < 0.05 && Math.abs(this.deskVelocity) < 0.05) {
        this.desk = deskTarget
        this.deskVelocity = 0
      }
    }

    const wantOn = values.monitor !== 'off' && this.cablePlugged
    if (wantOn && (this.monitor.phase === 'off' || this.monitor.phase === 'turning-off')) {
      this.monitor = { phase: 'turning-on', since: time }
    } else if (!wantOn && this.monitor.phase !== 'off' && this.monitor.phase !== 'turning-off') {
      this.monitor = { phase: 'turning-off', since: time }
    }

    const monitorElapsed = time - this.monitor.since
    if (this.reducedMotion) {
      this.monitor.phase = wantOn ? 'lit' : 'off'
    } else if (
      this.monitor.phase === 'turning-on' &&
      monitorElapsed >= this.durations.powerTagDuration('power-on')
    ) {
      this.monitor.phase = 'lit'
    } else if (
      this.monitor.phase === 'turning-off' &&
      monitorElapsed >= this.durations.powerTagDuration('power-off')
    ) {
      this.monitor.phase = 'off'
    }

    if (!characterOneShot && this.reaction?.phase === 'surprised') {
      characterOneShot = { tag: this.reaction.tag, elapsed: time - this.reaction.since }
    }

    return {
      night: this.night,
      wash: this.wash,
      monitor: { phase: this.monitor.phase, elapsed: monitorElapsed },
      deskOffset: this.desk,
      cableFall: this.cableFall,
      chairShift: this.chairShift,
      posture: this.posture,
      powered: this.cablePlugged,
      characterOneShot,
      chairOneShot,
    }
  }

  toggleDesk(time: number, presence: ToggleValues['presence']) {
    // The controls and lift motor share the outlet with the rest of the desk.
    // Reject the command here, where every host enters the simulation, rather
    // than relying on a particular UI to disable its hotspot.
    if (!this.cablePlugged) return false

    const target: Posture = (this.move?.to ?? this.posture) === 'standing' ? 'seated' : 'standing'
    if (presence !== 'present' || this.reducedMotion) {
      this.settleInto(target, presence)
      return true
    }
    if (this.move) {
      this.pending = target
      return true
    }
    if (target !== this.posture) this.move = { to: target, since: time }
    return true
  }

  toggleCable(time: number, presence: ToggleValues['presence']) {
    this.cablePlugged = !this.cablePlugged
    if (!this.cablePlugged) {
      this.powerLostAt = time
      this.deskVelocity = 0
      if (presence === 'present' && !this.reaction && !this.move) {
        this.reaction = { phase: 'noticing', since: time, tag: STARTLE_TAG.seated }
      }
    } else if (this.powerLostAt !== null) {
      // Preserve the remaining choreography instead of letting wall-clock time
      // elapse behind the frozen desk and completing it on the first powered frame.
      if (this.move) this.move.since += time - this.powerLostAt
      this.powerLostAt = null
    }
  }

  cableUnplugged() {
    return !this.cablePlugged
  }

  deskOffset() {
    return this.desk
  }

  setPosture(to: Posture, presence: ToggleValues['presence']) {
    this.arriveAt(to, presence)
  }
}
