import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { OUTFITS, keyMap } from './outfits.ts'
import { swapPalette } from './palette.ts'

const character = new Uint8Array(
  fs.readFileSync(new URL('../../../../themes/pixel-desk/art/character.png', import.meta.url)),
)

/** The PLTE entries and the chunk's stored CRC, read straight from the bytes. */
const palette = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  let offset = 8
  while (offset < png.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    if (type === 'PLTE') {
      const entries: string[] = []
      for (let i = 0; i < length; i += 3) {
        const [r, g, b] = png.subarray(offset + 8 + i, offset + 11 + i)
        entries.push(`${r},${g},${b}`)
      }
      return entries
    }
    offset += 12 + length
  }
  throw new Error('no PLTE')
}

test('every clothing key is a palette entry in character.png', () => {
  // The palette path can only recolour colours the palette holds. A key that
  // is not there would silently ship in its key colour.
  const entries = palette(character)
  for (const [[r, g, b]] of keyMap(OUTFITS[0])) {
    assert.equal(entries.filter((entry) => entry === `${r},${g},${b}`).length, 1, `${r},${g},${b}`)
  }
})

test('swapPalette puts each outfit colour in place of its key', () => {
  for (const outfit of OUTFITS) {
    const swapped = swapPalette(character, keyMap(outfit))
    assert.ok(swapped, outfit.name)
    const entries = palette(swapped)
    for (const [, [r, g, b]] of keyMap(outfit)) {
      assert.ok(entries.includes(`${r},${g},${b}`), `${outfit.name}: ${r},${g},${b}`)
    }
    // Same size, same pixels: only palette bytes and that chunk's CRC move.
    assert.equal(swapped.length, character.length)
  }
})

test('swapPalette leaves the source untouched and refuses non-PNG input', () => {
  const before = character.slice()
  swapPalette(character, keyMap(OUTFITS[1]))
  assert.deepEqual(character, before)
  assert.equal(swapPalette(new Uint8Array([1, 2, 3]), []), null)
})
