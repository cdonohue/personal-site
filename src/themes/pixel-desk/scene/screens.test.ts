import assert from 'node:assert/strict'
import test from 'node:test'
import { pickPlayScreen, ROOM_VIEW_PLAY_CHANCE } from '../activity.ts'
import {
  PLAY_TAGS,
  SCREEN_TAGS,
  WORK_TAGS,
  canUseVisitorCamera,
  sourceForScreen,
} from './screens.ts'

test('the recursive room screen participates in the random play rotation', () => {
  assert.ok(PLAY_TAGS.includes('room-view'))
  assert.equal(sourceForScreen('room-view'), 'scene')
  assert.equal(sourceForScreen('game'), 'sheet')
})

test('the webcam screen is interactive rather than part of a random rotation', () => {
  assert.ok(SCREEN_TAGS.includes('webcam'))
  assert.equal(sourceForScreen('webcam'), 'camera')
  assert.ok(!WORK_TAGS.includes('webcam'))
  assert.ok(!PLAY_TAGS.includes('webcam'))
})

test('the visitor camera belongs only to an empty powered desk outside Zoom', () => {
  assert.equal(canUseVisitorCamera({ presence: 'away', screen: 'game', powered: true }), true)
  assert.equal(canUseVisitorCamera({ presence: 'present', screen: 'game', powered: true }), false)
  assert.equal(canUseVisitorCamera({ presence: 'away', screen: 'zoom-call', powered: true }), false)
  assert.equal(canUseVisitorCamera({ presence: 'away', screen: 'game', powered: false }), false)
})

test('the recursive room screen is a rare play roll', () => {
  assert.equal(ROOM_VIEW_PLAY_CHANCE, 0.05)
  assert.equal(pickPlayScreen(() => 0), 'room-view')

  const rolls = [ROOM_VIEW_PLAY_CHANCE, 0]
  assert.notEqual(pickPlayScreen(() => rolls.shift() ?? 0), 'room-view')
})
