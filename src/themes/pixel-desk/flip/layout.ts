/**
 * Content to cells: the only place that decides where a character lands.
 *
 * Pure on purpose. The board diffs one grid against the next, so the grid for
 * a page has to be a function of the page and the column count and nothing
 * else — no measuring, no DOM. That is also what makes it testable.
 */
import { normalize } from './glyphs.ts'

/**
 * How a cell is printed. `current` is the page you are on, shown on a lit flap
 * rather than in a lit letter, so it reads at a glance from across the room.
 */
export type Tone = 'ink' | 'muted' | 'accent' | 'current'

export type Run = {
  text: string
  tone: Tone
  /** Index of the source link this text belongs to, if any. */
  link?: number
}

export type Block =
  | { kind: 'text'; runs: Run[]; space: number }
  /** One row with `left` flush left and `right` flush right, if both fit. */
  | { kind: 'split'; left: Run[]; right: Run[]; space: number }

export type Cell = { ch: string; tone: Tone; link?: number }

export type Grid = Cell[][]

export const BLANK: Cell = Object.freeze({ ch: ' ', tone: 'ink' }) as Cell

/** Runs as one cell per character, already normalised onto the drum. */
const cellsOf = (runs: Run[]): Cell[] => {
  const cells: Cell[] = []
  for (const run of runs) {
    for (const ch of normalize(run.text)) cells.push({ ch, tone: run.tone, link: run.link })
  }
  // Runs are joined from DOM text, so the seams can double up spaces.
  const collapsed: Cell[] = []
  for (const cell of cells) {
    const last = collapsed[collapsed.length - 1]
    if (cell.ch === ' ' && (!last || last.ch === ' ')) continue
    collapsed.push(cell)
  }
  while (collapsed.length && collapsed[collapsed.length - 1].ch === ' ') collapsed.pop()
  return collapsed
}

/**
 * Greedy word wrap into rows no wider than `cols`.
 *
 * A space between two words takes the space's own tone, so a link's underline
 * hover does not bleed into the gap after it; a space at a line end is dropped,
 * as it would be on paper. A word longer than the board is broken where it
 * hits the edge, since there is nowhere else for it to go.
 */
export const wrap = (cells: Cell[], cols: number): Cell[][] => {
  const words: Cell[][] = []
  let word: Cell[] = []
  for (const cell of cells) {
    if (cell.ch === ' ') {
      if (word.length) words.push(word)
      word = []
    } else {
      word.push(cell)
    }
  }
  if (word.length) words.push(word)

  const rows: Cell[][] = []
  let row: Cell[] = []
  for (let w of words) {
    if (row.length && row.length + 1 + w.length > cols) {
      rows.push(row)
      row = []
    }
    if (row.length) {
      const prev = row[row.length - 1]
      // The gap belongs to a link only when both sides do.
      const joined = prev.link !== undefined && prev.link === w[0].link
      row.push(joined ? { ch: ' ', tone: prev.tone, link: prev.link } : BLANK)
    }
    while (row.length + w.length > cols) {
      const room = cols - row.length
      row.push(...w.slice(0, room))
      rows.push(row)
      row = []
      w = w.slice(room)
    }
    row.push(...w)
  }
  if (row.length) rows.push(row)
  return rows
}

const pad = (row: Cell[], cols: number): Cell[] => {
  const out = row.slice(0, cols)
  while (out.length < cols) out.push(BLANK)
  return out
}

/**
 * The whole page as a grid `cols` wide, with at least `minRows` rows.
 *
 * Blank rows before each block come from its `space`, never from trailing
 * space after the one before. Spacing is therefore stated by the thing it
 * belongs to, and a block that moves takes its gap with it.
 */
export const layout = (blocks: Block[], cols: number, minRows = 0): Grid => {
  const rows: Cell[][] = []
  for (const block of blocks) {
    if (rows.length) for (let i = 0; i < block.space; i++) rows.push([])
    if (block.kind === 'text') {
      rows.push(...wrap(cellsOf(block.runs), cols))
      continue
    }
    const left = cellsOf(block.left)
    const right = cellsOf(block.right)
    if (left.length + 1 + right.length <= cols) {
      const row = pad(left, cols)
      row.splice(cols - right.length, right.length, ...right)
      rows.push(row)
    } else {
      rows.push(...wrap(left, cols), ...wrap(right, cols))
    }
  }
  while (rows.length < minRows) rows.push([])
  return rows.map((row) => pad(row, cols))
}

/** Columns for a board this many pixels wide: a cell near 24px, within bounds. */
export const columnsFor = (width: number): number =>
  Math.max(18, Math.min(46, Math.floor(width / 24)))
