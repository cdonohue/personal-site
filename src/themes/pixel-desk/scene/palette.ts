/**
 * Recolour an indexed PNG by rewriting its palette, never its pixels.
 *
 * The character is recoloured by key colour. Doing that on a canvas means
 * reading the decoded pixels back with getImageData, and that readback is not
 * trustworthy: browsers with canvas fingerprinting protection (Safari's
 * Advanced Fingerprinting Protection, on by default in private windows, Brave,
 * Firefox with resistFingerprinting) add a little random noise to what a page
 * reads back. A key colour nudged by one unit no longer matches, so a scatter
 * of pixels keeps its key colour — speckled trousers, a half-grey hat.
 *
 * An indexed PNG holds each colour once, in its PLTE chunk. Swapping the
 * entries there and letting the browser decode the result recolours every
 * pixel that uses an entry, exactly, with nothing read back at all.
 *
 * Pure bytes in, bytes out, so it runs and is tested under plain Node.
 */

export type RGB = [number, number, number];

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 over `bytes[start, end)`, as PNG chunks use it. */
const crc32 = (bytes: Uint8Array, start: number, end: number): number => {
  let c = 0xffffffff;
  for (let i = start; i < end; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/**
 * A copy of `png` with each palette entry equal to a `from` colour replaced by
 * its `to` colour.
 *
 * Returns null when the file is not an indexed PNG with a palette, so the
 * caller can fall back rather than silently ship the key colours. Entries that
 * match no key are left alone; keys absent from the palette change nothing.
 */
export const swapPalette = (
  png: Uint8Array,
  swaps: readonly (readonly [from: RGB, to: RGB])[],
): Uint8Array | null => {
  if (png.length < 8 || SIGNATURE.some((byte, i) => png[i] !== byte)) return null;

  const out = png.slice();
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  const table = new Map<number, RGB>();
  for (const [[r, g, b], to] of swaps) table.set((r << 16) | (g << 8) | b, to);

  let offset = 8;
  while (offset + 12 <= out.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...out.subarray(offset + 4, offset + 8));
    const data = offset + 8;

    // Colour type 3 is indexed; anything else has no palette to swap.
    if (type === 'IHDR' && out[data + 9] !== 3) return null;

    if (type === 'PLTE') {
      for (let i = data; i + 2 < data + length; i += 3) {
        const to = table.get((out[i] << 16) | (out[i + 1] << 8) | out[i + 2]);
        if (!to) continue;
        out[i] = to[0];
        out[i + 1] = to[1];
        out[i + 2] = to[2];
      }
      // The CRC covers the chunk type and data; a stale one fails to decode.
      view.setUint32(data + length, crc32(out, offset + 4, data + length));
      return out;
    }

    if (type === 'IDAT' || type === 'IEND') return null;
    offset = data + length + 4;
  }
  return null;
};
