/**
 * The drum: every character a flap can show, in the order the flaps fall.
 *
 * A real split-flap unit cannot jump. To get from A to D it shows B and C on
 * the way, which is most of what makes the board sound and look like one, so
 * the order here is part of the design rather than a lookup table. Blank comes
 * first because a cleared board rests there.
 */
export const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?'\"-+/&@#()%$*·↗" as const

const INDEX = new Map<string, number>([...DRUM].map((ch, i) => [ch, i]))

/** Typography a flap set never carried, folded onto what it did. */
const FOLD: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
  '×': 'X',
  ' ': ' ',
}

/**
 * Text as a flap board would print it: upper case, accents dropped, curly
 * punctuation straightened, anything still off the drum shown as blank.
 *
 * Returns a string whose every character is on the drum, so its length is the
 * number of cells it fills.
 */
export const normalize = (text: string): string => {
  let out = ''
  for (const raw of text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()) {
    const ch = FOLD[raw] ?? raw
    for (const c of ch) out += INDEX.has(c) ? c : ' '
  }
  return out
}

/**
 * The faces a flap shows travelling from `from` to `to`, ending on `to`.
 *
 * Empty when nothing changes. A full lap is 59 faces, which at a believable
 * speed would hold a cell up for three seconds, so a long trip is shortened to
 * its last `limit` faces: the flap still visibly runs up to its letter, it just
 * starts most of the way round.
 */
export const path = (from: string, to: string, limit = 10): string[] => {
  if (from === to) return []
  const a = INDEX.get(from) ?? 0
  const b = INDEX.get(to) ?? 0
  const n = DRUM.length
  const distance = (b - a + n) % n
  const steps = Math.min(distance, limit)
  const faces: string[] = []
  for (let k = steps - 1; k >= 0; k--) faces.push(DRUM[(b - k + n) % n])
  return faces
}
