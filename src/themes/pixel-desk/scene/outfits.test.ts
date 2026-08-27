import assert from 'node:assert/strict'
import test from 'node:test'
import { OUTFITS, keyMap, outfitFor } from './outfits.ts'

const DAY = 86_400_000

test('the wardrobe has two weeks of valid, uniquely named outfits', () => {
  assert.equal(OUTFITS.length, 14)
  assert.equal(new Set(OUTFITS.map(({ name }) => name)).size, OUTFITS.length)

  for (const outfit of OUTFITS) {
    assert.equal(keyMap(outfit).length, 9)
    for (const [, colour] of keyMap(outfit)) {
      assert.ok(colour.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255))
    }
  }
})

test('one wardrobe cycle wears every outfit exactly once', () => {
  const epoch = Date.UTC(1970, 0, 1, 12)
  const cycle = Array.from({ length: OUTFITS.length }, (_, day) =>
    outfitFor(new Date(epoch + day * DAY), 'UTC').name,
  )

  assert.equal(new Set(cycle).size, OUTFITS.length)
})

test('daily outfits hold through reloads and never repeat on consecutive days', () => {
  const epoch = Date.UTC(2026, 0, 1, 12)
  const days = Array.from({ length: 70 }, (_, day) =>
    outfitFor(new Date(epoch + day * DAY), 'America/Chicago').name,
  )

  assert.equal(
    outfitFor(new Date(epoch), 'America/Chicago'),
    outfitFor(new Date(epoch + 12 * 60 * 60 * 1000), 'America/Chicago'),
  )
  for (let day = 1; day < days.length; day += 1) assert.notEqual(days[day], days[day - 1])
})

test('reloads never reroll the outfit within the visitor calendar date', () => {
  const chicagoDates = [
    ['2026-01-15T00:00:00-06:00', '2026-01-15T23:59:59-06:00'],
    ['2026-03-08T00:00:00-06:00', '2026-03-08T23:59:59-05:00'],
    ['2026-07-15T00:00:00-05:00', '2026-07-15T23:59:59-05:00'],
    ['2026-11-01T00:00:00-05:00', '2026-11-01T23:59:59-06:00'],
  ]

  for (const [start, end] of chicagoDates) {
    const expected = outfitFor(new Date(start), 'America/Chicago')
    assert.equal(outfitFor(new Date(start), 'America/Chicago'), expected)
    assert.equal(outfitFor(new Date(end), 'America/Chicago'), expected)
  }
})

test('the offset rotation does not recycle an outfit within a week', () => {
  const epoch = Date.UTC(2026, 0, 1, 12)
  const days = Array.from({ length: 365 }, (_, day) =>
    outfitFor(new Date(epoch + day * DAY), 'America/Chicago').name,
  )

  for (let day = 1; day < days.length; day += 1) {
    for (let lag = 1; lag <= Math.min(7, day); lag += 1) {
      assert.notEqual(days[day], days[day - lag])
    }
  }
})
