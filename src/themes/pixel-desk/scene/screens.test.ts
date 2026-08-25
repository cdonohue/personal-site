import assert from 'node:assert/strict'
import test from 'node:test'
import { pickPlayScreen, ROOM_VIEW_PLAY_CHANCE } from '../activity.ts'
import { PLAY_TAGS, sourceForScreen } from './screens.ts'

test('the recursive room screen participates in the random play rotation', () => {
  assert.ok(PLAY_TAGS.includes('room-view'))
  assert.equal(sourceForScreen('room-view'), 'scene')
  assert.equal(sourceForScreen('game'), 'sheet')
})

test('the recursive room screen is a rare play roll', () => {
  assert.equal(ROOM_VIEW_PLAY_CHANCE, 0.05)
  assert.equal(pickPlayScreen(() => 0), 'room-view')

  const rolls = [ROOM_VIEW_PLAY_CHANCE, 0]
  assert.notEqual(pickPlayScreen(() => rolls.shift() ?? 0), 'room-view')
})
