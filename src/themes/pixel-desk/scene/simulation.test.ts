import assert from 'node:assert/strict'
import test from 'node:test'
import { SceneSimulation, type SimulationDurations } from './simulation.ts'
import { DEFAULT_VALUES, type ToggleValues } from './toggles.ts'

const durations: SimulationDurations = {
  characterHasTag: () => true,
  characterTagDuration: () => 270,
  powerTagDuration: () => 100,
}

const values = (next: Partial<ToggleValues> = {}): ToggleValues => ({
  ...DEFAULT_VALUES,
  ...next,
})

const simulation = (next: Partial<ToggleValues> = {}, reducedMotion = false) =>
  new SceneSimulation({
    values: values(next),
    reducedMotion,
    timeZone: 'UTC',
    now: new Date('2026-01-01T12:00:00Z'),
    durations,
  })

test('cable power owns a complete monitor transition in either direction', () => {
  const scene = simulation()
  const state = values()

  scene.toggleCable(0, 'present')
  assert.deepEqual(scene.step(0, new Date('2026-01-01T12:00:00Z'), state).monitor, {
    phase: 'turning-off',
    elapsed: 0,
  })
  assert.equal(scene.step(99, new Date('2026-01-01T12:00:00Z'), state).monitor.phase, 'turning-off')
  assert.equal(scene.step(100, new Date('2026-01-01T12:00:00Z'), state).monitor.phase, 'off')

  scene.toggleCable(100, 'present')
  assert.equal(scene.step(100, new Date('2026-01-01T12:00:00Z'), state).monitor.phase, 'turning-on')
  assert.equal(scene.step(200, new Date('2026-01-01T12:00:00Z'), state).monitor.phase, 'lit')
})

test('the unplug reaction waits before starting and then uses sprite timing', () => {
  const scene = simulation()
  const state = values()

  scene.toggleCable(0, 'present')
  assert.equal(scene.step(319, new Date('2026-01-01T12:00:00Z'), state).characterOneShot, undefined)
  assert.deepEqual(scene.step(320, new Date('2026-01-01T12:00:00Z'), state).characterOneShot, {
    tag: 'surprised',
    elapsed: 0,
  })
  assert.equal(scene.step(590, new Date('2026-01-01T12:00:00Z'), state).characterOneShot, undefined)
})

test('an empty reduced-motion room moves the desk without moving the chair', () => {
  const scene = simulation({ presence: 'away' }, true)
  const state = values({ presence: 'away' })

  scene.toggleDesk(0, 'away')
  const frame = scene.step(0, new Date('2026-01-01T12:00:00Z'), state)

  assert.equal(frame.posture, 'standing')
  assert.equal(frame.deskOffset, 14)
  assert.equal(frame.chairShift, 0)
  assert.equal(frame.characterOneShot, undefined)
})

test('standing choreography begins with the person and then the chair', () => {
  const scene = simulation()
  const state = values()

  scene.toggleDesk(0, 'present')
  assert.deepEqual(scene.step(0, new Date('2026-01-01T12:00:00Z'), state).characterOneShot, {
    tag: 'stand-up',
    elapsed: 0,
  })
  assert.equal(scene.step(149, new Date('2026-01-01T12:00:00Z'), state).chairOneShot, undefined)
  assert.deepEqual(scene.step(150, new Date('2026-01-01T12:00:00Z'), state).chairOneShot, {
    tag: 'shove',
    elapsed: 0,
  })
})
