/**
 * Puts every piece of page text on a flap board, and keeps it there across
 * page changes.
 *
 * Each board is a pair: a `[data-flip-source="name"]` holding the real
 * markup, and a `[data-flip-board="name"]` that draws it. The board element is
 * carried from page to page by Astro's client router (`transition:persist`),
 * while the source arrives fresh with each page. So on every page load the
 * board diffs the new source against what it is already showing, and only the
 * letters that differ turn: the masthead holds still except for the nav, and
 * the body runs where the words changed.
 *
 * The router, rather than one of our own, because the home page carries the
 * desk scene as a React island and Astro already knows how to mount and
 * unmount islands as pages swap.
 */
import { FlipBoard } from './board.ts'
import { columnsFor, layout } from './layout.ts'
import { readSource } from './source.ts'

type Mounted = {
  board: FlipBoard
  links: HTMLAnchorElement[]
  source: HTMLElement | null
  observer: MutationObserver | null
}

const mounted = new WeakMap<HTMLElement, Mounted>()

/**
 * Cell sizes from the column the boards sit in, in whole pixels so every flap
 * lands on the device grid. Every board on a page shares them, so the
 * masthead's letters line up with the body's.
 */
const measure = (host: HTMLElement) => {
  const parent = host.parentElement!
  const style = getComputedStyle(parent)
  const width = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const cols = columnsFor(width)
  const gap = Math.max(2, Math.round(width / cols / 12))
  const cw = Math.floor((width - gap * (cols - 1)) / cols)
  const ch = Math.round(cw * 1.4)
  return { cols, cw, ch, gap }
}

const render = (host: HTMLElement, animate: boolean) => {
  const state = mounted.get(host)
  if (!state?.source) return
  const metrics = measure(host)
  const read = readSource(state.source)
  state.links = read.links
  state.board.render(layout(read.blocks, metrics.cols), metrics, { animate, links: read.links })
}

const boards = () => [...document.querySelectorAll<HTMLElement>('[data-flip-board]')]

/** Pair each board with this page's source and draw it. */
const attach = () => {
  for (const host of boards()) {
    let state = mounted.get(host)
    if (!state) {
      state = { board: new FlipBoard(host), links: [], source: null, observer: null }
      mounted.set(host, state)
    }
    state.observer?.disconnect()
    const name = host.dataset.flipBoard
    const source = document.querySelector<HTMLElement>(`[data-flip-source="${name}"]`)
    state.source = source
    if (!source) continue

    // Anything that rewrites the source later is drawn the same way.
    let queued = false
    state.observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        render(host, true)
      })
    })
    state.observer.observe(source, { subtree: true, childList: true, characterData: true })

    // Keyboard focus lives on the source links; show it on the board.
    const current = state
    source.addEventListener('focusin', (event) => {
      const index = current.links.indexOf(event.target as HTMLAnchorElement)
      if (index < 0) return
      current.board.highlight(index)
      current.board.hitFor(index)?.scrollIntoView({ block: 'nearest' })
    })
    source.addEventListener('focusout', () => current.board.highlight(null))

    render(host, true)
  }
}

const restyle = () => {
  for (const host of boards()) mounted.get(host)?.board.restyle()
}

/**
 * Every page load, the first and each swap after it. Boards are laid out at
 * once, so the page does not jump when they appear; letters drawn before the
 * pixel face arrives are redrawn in it when it does.
 */
document.addEventListener('astro:page-load', () => {
  ;(window as { __flipReady?: boolean }).__flipReady = true
  document.documentElement.classList.add('flip-ready')
  attach()
})

let width = innerWidth
addEventListener('resize', () => {
  // Mobile browsers resize on scroll as the toolbar hides. Only width matters.
  if (innerWidth === width) return
  width = innerWidth
  for (const host of boards()) render(host, false)
})

// Light or dark, chosen or inherited: the flaps are drawn, not styled, so they
// are redrawn in the new colours. The room's light switch lands here too.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', restyle)
new MutationObserver(restyle).observe(document.documentElement, {
  attributeFilter: ['data-theme'],
})
document.fonts.addEventListener('loadingdone', restyle)
