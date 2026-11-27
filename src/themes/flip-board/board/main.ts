/**
 * Mounts the board over the page's source content and keeps it in step.
 *
 * The board is a view of the source and nothing else. Anything that changes
 * the source — a page change, the clock ticking — is picked up by one
 * MutationObserver and rendered as a diff, so there is a single path from
 * content to flaps and nothing can update the board behind its back.
 */
import { FlipBoard } from './board.ts'
import { columnsFor, layout } from './layout.ts'
import { readSource } from './source.ts'
import { startRouter } from './router.ts'

const source = document.querySelector<HTMLElement>('[data-flip-source]')
const host = document.querySelector<HTMLElement>('[data-flip-board]')

if (source && host) {
  const board = new FlipBoard(host)
  let links: HTMLAnchorElement[] = []

  /**
   * Cell sizes from the room available, and how many columns that gives.
   *
   * Whole pixels throughout, so every flap lands on the device grid and the
   * letters stay sharp; the board is centred in whatever is left over.
   */
  const measure = () => {
    const parent = getComputedStyle(host.parentElement!)
    const width =
      host.parentElement!.clientWidth - parseFloat(parent.paddingLeft) - parseFloat(parent.paddingRight)
    const cols = columnsFor(width)
    const gap = Math.max(2, Math.round(width / cols / 14))
    const cw = Math.floor((width - gap * (cols - 1)) / cols)
    const ch = Math.round(cw * 1.42)
    // Enough rows to fill the window, so a short page is still a whole board.
    const top = host.getBoundingClientRect().top + scrollY
    const minRows = Math.max(0, Math.floor((innerHeight - top - 24 + gap) / (ch + gap)))
    return { metrics: { cols, cw, ch, gap }, minRows }
  }

  const render = (animate: boolean) => {
    const { metrics, minRows } = measure()
    const read = readSource(source)
    links = read.links
    board.render(layout(read.blocks, metrics.cols, minRows), metrics, { animate, links })
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      render(true)
    })
  }

  // The clock is the one live thing in the source. It writes only when the
  // text it shows changes, so the board turns once a minute, on the digits
  // that moved.
  const tick = () => {
    for (const el of source.querySelectorAll<HTMLElement>('[data-flip-clock]')) {
      const now = new Date()
      const text = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
      if (el.textContent !== text) el.textContent = text
      el.setAttribute('datetime', now.toISOString())
    }
  }

  const begin = () => {
    document.documentElement.classList.add('fb-ready')
    tick()
    render(true)
    new MutationObserver(schedule).observe(source, {
      subtree: true,
      childList: true,
      characterData: true,
    })
    setInterval(tick, 1000)
  }

  // Letters measured before the face arrives would be drawn twice: once in
  // the fallback and again when it lands. Wait for it, but not for long.
  void Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(begin)

  let width = innerWidth
  addEventListener('resize', () => {
    // Mobile browsers resize on scroll as the toolbar hides. Only width matters.
    if (innerWidth === width) return
    width = innerWidth
    render(false)
  })

  // Light or dark, chosen or inherited: the flaps are drawn, not styled, so
  // they are redrawn in the new colours.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => board.restyle())
  new MutationObserver(() => board.restyle()).observe(document.documentElement, {
    attributeFilter: ['data-theme'],
  })
  document.fonts.addEventListener('loadingdone', () => board.restyle())

  // Keyboard focus lives on the source links; show it on the board.
  source.addEventListener('focusin', (event) => {
    const index = links.indexOf(event.target as HTMLAnchorElement)
    if (index < 0) return
    board.highlight(index)
    board.hitFor(index)?.scrollIntoView({ block: 'nearest' })
  })
  source.addEventListener('focusout', () => board.highlight(null))

  startRouter(() => {
    // The incoming page's clock is empty, as the server rendered it. Fill it
    // before the board reads the swap, or the masthead clock would run to
    // blank and back on every page change.
    tick()
    // Move focus to the page, as a full load would, so a screen reader starts
    // the new page from its top rather than from a link that no longer exists.
    source.focus({ preventScroll: true })
  })
}
