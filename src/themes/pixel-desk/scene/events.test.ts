import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SHOOTING_STAR_CHANCE,
  SHOOTING_STAR_DELAY_MIN,
  UFO_CHANCE,
  SkyEventController,
} from './events.ts'

const sequence = (...values: number[]) => () => values.shift() ?? 0

test('at most one natural sky event is decided for the visit', () => {
  const misses = new SkyEventController('random', () => UFO_CHANCE + SHOOTING_STAR_CHANCE)
  assert.equal(misses.frameAt(100_000, 1, false), undefined)

  const star = new SkyEventController('random', sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0))
  star.frameAt(0, 1, false)
  assert.equal(star.frameAt(SHOOTING_STAR_DELAY_MIN, 1, false)?.kind, 'shooting-star')

  const ufo = new SkyEventController('random', () => 0)
  ufo.frameAt(0, 1, false)
  assert.equal(ufo.frameAt(8_000, 1, false)?.kind, 'ufo')
})

test('the natural delay does not begin until the sky is fully night', () => {
  const event = new SkyEventController(
    'random',
    sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0),
  )

  assert.equal(event.frameAt(60_000, 0.94, false), undefined)
  assert.equal(event.frameAt(60_000, 1, false), undefined)
  assert.equal(event.frameAt(60_000 + SHOOTING_STAR_DELAY_MIN, 1, false)?.progress, 0)
})

test('a natural shooting star plays once and then stays finished', () => {
  const event = new SkyEventController(
    'random',
    sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0),
  )

  event.frameAt(0, 1, false)
  assert.equal(event.frameAt(SHOOTING_STAR_DELAY_MIN + 1_501, 1, false), undefined)
  assert.equal(event.frameAt(SHOOTING_STAR_DELAY_MIN, 1, false), undefined)
})

test('the forced shooting-star preview loops but still respects reduced motion', () => {
  const event = new SkyEventController('shooting-star', () => 0)

  assert.equal(event.frameAt(0, 0, false), undefined)
  assert.ok(event.frameAt(750, 0, false))
  assert.ok(event.frameAt(750 + 3_000, 0, false))
  assert.equal(event.frameAt(750, 1, true), undefined)
})

test('the forced UFO has independent enter, hover and fast-exit phases', () => {
  const event = new SkyEventController('ufo', () => 0)

  assert.deepEqual(event.frameAt(700, 0, false), {
    kind: 'ufo',
    elapsed: 200,
    phase: 'enter',
    progress: 0.25,
    window: 'left',
    direction: 1,
    exit: 'cross-right',
    y: 31,
  })
  const hover = event.frameAt(1_500, 0, false)
  const exit = event.frameAt(4_000, 0, false)
  assert.equal(hover?.kind, 'ufo')
  assert.equal(exit?.kind, 'ufo')
  if (hover?.kind !== 'ufo' || exit?.kind !== 'ufo') assert.fail('expected UFO frames')
  assert.equal(hover.phase, 'hover')
  assert.equal(exit.phase, 'exit')
})

test('only a rightbound UFO in the left window crosses the room', () => {
  const crossing = new SkyEventController('ufo', sequence(0, 0, 0))
  const climbing = new SkyEventController('ufo', sequence(0.75, 0, 0))
  const crossingExit = crossing.frameAt(4_000, 1, false)
  const climbingExit = climbing.frameAt(4_000, 1, false)

  assert.equal(crossingExit?.kind, 'ufo')
  assert.equal(climbingExit?.kind, 'ufo')
  if (crossingExit?.kind !== 'ufo' || climbingExit?.kind !== 'ufo') {
    assert.fail('expected UFO frames')
  }
  assert.equal(crossingExit.exit, 'cross-right')
  assert.equal(climbingExit.exit, 'up')
})
