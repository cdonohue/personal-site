import assert from 'node:assert/strict'
import test from 'node:test'
import { DRUM, normalize, path } from './glyphs.ts'
import { layout, wrap, type Block, type Grid } from './layout.ts'

const text = (grid: Grid) => grid.map((row) => row.map((c) => c.ch).join(''))

test('normalize puts everything on the drum', () => {
  assert.equal(normalize('I’m “K–12” café…'), 'I\'M "K-12" CAFE...')
  for (const ch of normalize('Ünïcode ✓ emoji 🎉')) assert.ok(DRUM.includes(ch))
})

test('path runs up to the target and stops on it', () => {
  assert.deepEqual(path('A', 'D'), ['B', 'C', 'D'])
  assert.deepEqual(path('A', 'A'), [])
  const long = path('Z', 'Y', 10)
  assert.equal(long.length, 10)
  assert.equal(long.at(-1), 'Y')
})

test('wrap breaks on words and drops trailing spaces', () => {
  const cells = [...'THE QUICK BROWN FOX'].map((ch) => ({ ch, tone: 'ink' as const }))
  assert.deepEqual(
    wrap(cells, 10).map((r) => r.map((c) => c.ch).join('')),
    ['THE QUICK', 'BROWN FOX'],
  )
  const long = [...'ABCDEFGHIJKL'].map((ch) => ({ ch, tone: 'ink' as const }))
  assert.deepEqual(
    wrap(long, 5).map((r) => r.map((c) => c.ch).join('')),
    ['ABCDE', 'FGHIJ', 'KL'],
  )
})

test('split rows hold both ends, and stack when they cannot', () => {
  const block: Block = {
    kind: 'split',
    left: [{ text: 'Ramp', tone: 'accent', link: 0 }],
    right: [{ text: 'Engineer', tone: 'muted' }],
    space: 0,
  }
  assert.deepEqual(text(layout([block], 16)), ['RAMP    ENGINEER'])
  assert.deepEqual(text(layout([block], 10)), ['RAMP      ', 'ENGINEER  '])
})

test('the same content lays out identically, so unchanged rows never turn', () => {
  const header: Block = { kind: 'text', runs: [{ text: 'Chad Donohue', tone: 'ink' }], space: 0 }
  const a = layout([header, { kind: 'text', runs: [{ text: 'Uses', tone: 'ink' }], space: 1 }], 20, 6)
  const b = layout([header, { kind: 'text', runs: [{ text: 'Projects', tone: 'ink' }], space: 1 }], 20, 6)
  assert.equal(a.length, 6)
  assert.deepEqual(a[0], b[0])
  assert.notDeepEqual(a[2], b[2])
})

test('a space inside a link is part of the link, a space beside it is not', () => {
  const grid = layout(
    [
      {
        kind: 'text',
        runs: [
          { text: 'at ', tone: 'ink' },
          { text: 'Unit 01', tone: 'accent', link: 3 },
          { text: ' now', tone: 'ink' },
        ],
        space: 0,
      },
    ],
    20,
  )
  const links = grid[0].map((c) => c.link ?? '-').join('')
  assert.equal(links.slice(0, 15), '---3333333-----')
})
