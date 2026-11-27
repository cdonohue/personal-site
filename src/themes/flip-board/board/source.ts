/**
 * The page's real HTML, read as board blocks.
 *
 * The board draws nothing of its own. Every character on it comes from the
 * semantic markup Astro rendered from `content.ts`, which stays in the
 * document for screen readers, search engines and anyone without JavaScript.
 * So there is one copy of the content, and the board is a view of it.
 *
 * The markup opts in explicitly: an element with `data-board="text"` or
 * `data-board="split"` is a block, and nothing outside a block is printed.
 * Guessing blocks from tag names would make a stray wrapper div a layout
 * change, which is the sort of thing nobody notices until a page shifts.
 */
import type { Block, Run, Tone } from './layout.ts'

const TONES = new Set<Tone>(['ink', 'muted', 'accent', 'current'])

const toneOf = (el: Element, block: Element): Tone => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    // Stated tone first, so a link can opt out of looking like one.
    const tone = node.getAttribute('data-tone') as Tone | null
    if (tone && TONES.has(tone)) return tone
    if (node.matches('a[aria-current="page"]')) return 'current'
    if (node.matches('a[href]')) return 'accent'
    if (node === block) break
  }
  return 'ink'
}

/** Every text node under `root` as a run, in document order. */
const runsOf = (root: Element, block: Element, links: HTMLAnchorElement[]): Run[] => {
  const runs: Run[] = []
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || parent.closest('[data-board-skip]')) continue
    const text = (node.textContent ?? '').replace(/[\t\n\r ]+/g, ' ')
    if (!text) continue
    const anchor = parent.closest('a[href]') as HTMLAnchorElement | null
    let link: number | undefined
    if (anchor && block.contains(anchor)) {
      link = links.indexOf(anchor)
      if (link < 0) link = links.push(anchor) - 1
    }
    runs.push({ text, tone: toneOf(parent, block), link })
  }
  return runs
}

export type Source = { blocks: Block[]; links: HTMLAnchorElement[] }

export const readSource = (root: Element): Source => {
  const links: HTMLAnchorElement[] = []
  const blocks: Block[] = []
  for (const el of root.querySelectorAll('[data-board]')) {
    const space = Number(el.getAttribute('data-space') ?? 1)
    if (el.getAttribute('data-board') === 'split') {
      const [left, right] = [el.firstElementChild, el.lastElementChild]
      if (!left || !right || left === right) continue
      blocks.push({
        kind: 'split',
        left: runsOf(left, el, links),
        right: runsOf(right, el, links),
        space,
      })
    } else {
      blocks.push({ kind: 'text', runs: runsOf(el, el, links), space })
    }
  }
  return { blocks, links }
}
