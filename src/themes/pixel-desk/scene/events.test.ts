import assert from 'node:assert/strict'
import test from 'node:test'
import {
  JIGSAW_CHANCE,
  JIGSAW_DELAY_MIN,
  SHOOTING_STAR_CHANCE,
  SHOOTING_STAR_DELAY_MIN,
  UFO_CHANCE,
  SceneEventController,
  sceneEventFromSearch,
} from './events.ts'

const sequence = (...values: number[]) => () => values.shift() ?? 0

test('only known scene events can be forced from the URL', () => {
  assert.equal(sceneEventFromSearch('?event=jigsaw'), 'jigsaw')
  assert.equal(sceneEventFromSearch('?event=ufo'), 'ufo')
  assert.equal(sceneEventFromSearch('?event=made-up'), undefined)
})

test('at most one natural sky event is decided for the visit', () => {
  const misses = new SceneEventController(
    'random',
    () => UFO_CHANCE + SHOOTING_STAR_CHANCE + JIGSAW_CHANCE,
  )
  assert.equal(misses.frameAt(100_000, 1, false), undefined)

  const star = new SceneEventController('random', sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0))
  star.frameAt(0, 1, false)
  assert.equal(star.frameAt(SHOOTING_STAR_DELAY_MIN, 1, false)?.kind, 'shooting-star')

  const ufo = new SceneEventController('random', () => 0)
  ufo.frameAt(0, 1, false)
  assert.equal(ufo.frameAt(8_000, 1, false)?.kind, 'ufo')
})

test('the natural delay does not begin until the sky is fully night', () => {
  const event = new SceneEventController(
    'random',
    sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0),
  )

  assert.equal(event.frameAt(60_000, 0.94, false), undefined)
  assert.equal(event.frameAt(60_000, 1, false), undefined)
  const frame = event.frameAt(60_000 + SHOOTING_STAR_DELAY_MIN, 1, false)
  assert.equal(frame?.kind, 'shooting-star')
  if (frame?.kind !== 'shooting-star') assert.fail('expected shooting star frame')
  assert.equal(frame.progress, 0)
})

test('a natural shooting star plays once and then stays finished', () => {
  const event = new SceneEventController(
    'random',
    sequence(UFO_CHANCE, 0, 0, 0, 0, 0, 0),
  )

  event.frameAt(0, 1, false)
  assert.equal(event.frameAt(SHOOTING_STAR_DELAY_MIN + 1_501, 1, false), undefined)
  assert.equal(event.frameAt(SHOOTING_STAR_DELAY_MIN, 1, false), undefined)
})

test('the forced shooting-star preview loops but still respects reduced motion', () => {
  const event = new SceneEventController('shooting-star', () => 0)

  assert.equal(event.frameAt(0, 0, false), undefined)
  assert.ok(event.frameAt(750, 0, false))
  assert.ok(event.frameAt(750 + 3_000, 0, false))
  assert.equal(event.frameAt(750, 1, true), undefined)
})

test('the forced UFO has independent enter, hover and fast-exit phases', () => {
  const event = new SceneEventController('ufo', () => 0)

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
  const crossing = new SceneEventController('ufo', sequence(0, 0, 0))
  const climbing = new SceneEventController('ufo', sequence(0.75, 0, 0))
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

test('the natural Jigsaw event ignores daylight, blacks out, and plays once', () => {
  const event = new SceneEventController(
    'random',
    sequence(UFO_CHANCE + SHOOTING_STAR_CHANCE, 0),
    new Date(2026, 9, 1),
  )
  event.interact(0)

  assert.equal(event.frameAt(JIGSAW_DELAY_MIN - 1, 0, false), undefined)
  assert.deepEqual(event.frameAt(JIGSAW_DELAY_MIN + 400, 0, false), {
    kind: 'jigsaw',
    phase: 'flicker',
    darkness: 1,
    screenOpacity: 0.85,
    faceOpacity: 0,
  })
  assert.deepEqual(event.frameAt(JIGSAW_DELAY_MIN + 1_000, 0, false), {
    kind: 'jigsaw',
    phase: 'reveal',
    darkness: 1,
    screenOpacity: 1,
    faceOpacity: 1,
  })
  const speaking = event.frameAt(JIGSAW_DELAY_MIN + 2_000, 0, false)
  const paused = event.frameAt(JIGSAW_DELAY_MIN + 4_300, 0, false)
  assert.equal(speaking?.kind, 'jigsaw')
  assert.equal(paused?.kind, 'jigsaw')
  if (speaking?.kind !== 'jigsaw' || paused?.kind !== 'jigsaw') {
    assert.fail('expected Jigsaw frames')
  }
  assert.equal(speaking.phase, 'speak')
  assert.equal(paused.phase, 'pause')
  assert.equal(event.frameAt(JIGSAW_DELAY_MIN + 6_101, 0, false), undefined)
  assert.equal(event.frameAt(JIGSAW_DELAY_MIN + 400, 0, false), undefined)
})

test('the forced Jigsaw preview loops but reduced motion suppresses it', () => {
  const event = new SceneEventController('jigsaw', () => 0)
  event.interact(0)

  assert.equal(event.frameAt(0, 0, false), undefined)
  assert.equal(event.frameAt(900, 0, false)?.kind, 'jigsaw')
  assert.equal(event.frameAt(900, 0, true), undefined)
})

test('a selected Jigsaw event remains dormant until visitor interaction', () => {
  const event = new SceneEventController('jigsaw', () => 0)

  assert.equal(event.frameAt(10_000, 0, false), undefined)
  event.interact(10_000)
  assert.equal(event.frameAt(10_499, 0, false), undefined)
  assert.equal(event.frameAt(10_500, 0, false)?.kind, 'jigsaw')
})

test('a natural Jigsaw roll is unavailable outside October', () => {
  const event = new SceneEventController(
    'random',
    sequence(UFO_CHANCE + SHOOTING_STAR_CHANCE, 0),
    new Date(2026, 8, 30),
  )

  assert.equal(event.jigsawSelected(), false)
  event.interact(0)
  assert.equal(event.frameAt(JIGSAW_DELAY_MIN + 10_000, 0, false), undefined)
})
