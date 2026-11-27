/**
 * The board itself: a grid of flaps that only ever moves the ones that differ.
 *
 * `render(grid)` is the whole interface. It compares the grid it is given with
 * what each cell is showing, and a cell whose letter and tone already match is
 * not touched — not redrawn, not animated. That is the point of the theme:
 * going from Uses to Projects, the masthead stays put and only the nav marker
 * and the body run, the way a station board only clatters on the lines that
 * changed.
 *
 * Drawn on one canvas the size of the window, not as an element per cell. The
 * first version was DOM flaps with 3D transforms, and a page change that turned
 * a thousand cells made a thousand compositor layers: the browser stalled for
 * well over a second before the first flap moved. Here a frame redraws only
 * the cells that are mid-turn, each from two pre-rendered sprites.
 *
 * The element the canvas sits in keeps the board's real size, so the page
 * scrolls as normal, and holds real anchors over every link.
 */
import { BLANK, type Cell, type Grid, type Tone } from './layout.ts'
import { path } from './glyphs.ts'

/** One face: half falls, half lands. Fast enough to read as a clatter. */
const STEP_MS = 70

/** A cell on its way somewhere: the faces left to show, from a start time. */
type Turn = { from: string; faces: string[]; target: Cell; start: number; step: number }

type Hit = { link: number; row: number; col: number; span: number }

export type Metrics = { cols: number; cw: number; ch: number; gap: number }

export type RenderOptions = {
  animate: boolean
  /** Link targets, indexed by `Cell.link`. */
  links: HTMLAnchorElement[]
}

type Palette = Record<
  'flap' | 'flapShade' | 'hinge' | 'ink' | 'muted' | 'accent' | 'lit' | 'litInk' | 'hot' | 'font',
  string
>

/** A `#rrggbb` colour moved toward black. Canvas cannot be relied on for color-mix. */
const darken = (hex: string, amount: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount))
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`
}

export class FlipBoard {
  readonly el: HTMLElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly hits: HTMLElement
  private m: Metrics = { cols: 0, cw: 0, ch: 0, gap: 0 }
  private rows = 0
  /** Where each cell is headed. */
  private shown: Cell[] = []
  /** What each cell is showing at rest: top letter, bottom letter, tone. */
  private faces: { t: string; b: string; tone: Tone }[] = []
  /** Cells currently turning, by index. One clock drives all of them. */
  private turns = new Map<number, Turn>()
  private hot = new Set<number>()
  private dirty = new Set<number>()
  private full = true
  private frame = 0
  private idle: (() => void)[] = []
  private generation = 0
  private linkCells = new Map<number, number[]>()
  private sprites = new Map<string, HTMLCanvasElement>()
  private palette: Palette | null = null
  private dpr = 1

  constructor(el: HTMLElement) {
    this.el = el
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'fb-canvas'
    this.ctx = this.canvas.getContext('2d')!
    this.hits = document.createElement('div')
    this.hits.className = 'fb-hits'
    el.replaceChildren(this.canvas, this.hits)

    const redraw = () => this.invalidate()
    addEventListener('scroll', redraw, { passive: true })
    addEventListener('resize', () => this.resizeCanvas())
    this.resizeCanvas()
  }

  /** Colours and face changed: throw away every sprite and draw again. */
  restyle() {
    this.palette = null
    this.sprites.clear()
    this.invalidate()
  }

  /** Light every cell of a link, for hover and for focus on its source. */
  highlight(link: number | null) {
    for (const i of this.hot) this.dirty.add(i)
    this.hot.clear()
    if (link !== null) {
      for (const i of this.linkCells.get(link) ?? []) {
        this.hot.add(i)
        this.dirty.add(i)
      }
    }
    this.schedule()
  }

  /** The first hit area of a link, so focus can bring it into view. */
  hitFor(link: number): HTMLElement | null {
    return this.hits.querySelector(`[data-link="${link}"]`)
  }

  render(grid: Grid, metrics: Metrics, { animate, links }: RenderOptions) {
    const generation = ++this.generation
    if (metrics.cols !== this.m.cols) this.reset()
    if (
      metrics.cols !== this.m.cols ||
      metrics.cw !== this.m.cw ||
      metrics.ch !== this.m.ch ||
      metrics.gap !== this.m.gap
    ) {
      this.m = metrics
      this.sprites.clear()
      this.full = true
    }
    const { cols } = metrics
    const rows = grid.length
    const want = rows * cols
    while (this.shown.length < want) {
      this.shown.push(BLANK)
      this.faces.push({ t: ' ', b: ' ', tone: 'ink' })
    }
    this.setRows(Math.max(rows, this.rows))

    const visible = this.visibleRows()
    const motion = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches
    const now = performance.now()

    const moving: { i: number; row: number; col: number; next: Cell }[] = []
    for (let i = 0; i < this.shown.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const next = i < want ? grid[row][col] : BLANK
      const current = this.shown[i]
      if (current.ch === next.ch && current.tone === next.tone) continue
      this.shown[i] = next
      if (motion && row >= visible.first && row <= visible.last) moving.push({ i, row, col, next })
      else this.snap(i, next)
    }

    // A wave down and across, roughened so it does not read as a wipe. It is
    // measured from the first cell that changes, so a lone change — the clock
    // at the far end of the masthead — starts at once instead of waiting for
    // a wave that is not there.
    const top = Math.min(...moving.map((m) => m.row))
    const left = Math.min(...moving.map((m) => m.col))
    for (const { i, row, col, next } of moving) {
      const delay = (row - top) * 22 + (col - left) * 9 + Math.random() * 110
      this.turn(i, next, now + delay)
    }

    this.hot.clear()
    this.layoutHits(grid, links)

    // Rows a shorter page no longer has run to blank first, then go.
    if (this.shown.length > want) {
      this.whenIdle(() => {
        if (generation !== this.generation) return
        this.shown.length = this.faces.length = want
        this.setRows(rows)
      })
    } else {
      this.setRows(rows)
    }
    this.schedule()
  }

  private reset() {
    this.shown = []
    this.faces = []
    this.turns.clear()
    this.hot.clear()
    this.rows = 0
  }

  private setRows(rows: number) {
    this.rows = rows
    const { cols, cw, ch, gap } = this.m
    this.el.style.width = `${cols * (cw + gap) - gap}px`
    this.el.style.height = `${Math.max(0, rows * (ch + gap) - gap)}px`
    this.invalidate()
  }

  private resizeCanvas() {
    this.dpr = Math.min(3, devicePixelRatio || 1)
    const w = document.documentElement.clientWidth
    const h = innerHeight
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.sprites.clear()
    this.invalidate()
  }

  private invalidate() {
    this.full = true
    this.schedule()
  }

  private schedule() {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick)
  }

  private whenIdle(callback: () => void) {
    if (this.turns.size) this.idle.push(callback)
    else callback()
  }

  /** Rows on screen right now, padded by a couple either side. */
  private visibleRows() {
    const pitch = this.m.ch + this.m.gap
    if (!pitch) return { first: 0, last: -1 }
    const top = this.el.getBoundingClientRect().top
    return {
      first: Math.max(0, Math.floor(-top / pitch) - 2),
      last: Math.ceil((innerHeight - top) / pitch) + 2,
    }
  }

  /** Straight to `target`, no motion: off screen, reduced motion, or resize. */
  private snap(i: number, target: Cell) {
    this.turns.delete(i)
    this.faces[i] = { t: target.ch, b: target.ch, tone: target.tone }
    this.dirty.add(i)
  }

  /**
   * Queue cell `i` to run to `target` from `start`, through every face between.
   *
   * A cell already turning is simply re-aimed: it carries on from whatever
   * letter it has reached, so a click mid-clatter never jumps a flap.
   */
  private turn(i: number, target: Cell, start: number) {
    const from = this.faces[i].t
    // A tone change on the same letter still turns one flap, so it is seen.
    const faces = from === target.ch ? [target.ch] : path(from, target.ch)
    this.turns.set(i, { from, faces, target, start, step: -1 })
  }

  /**
   * The one clock. Each frame it advances every turning cell to the face its
   * elapsed time says it should show, then draws what changed.
   */
  private tick = (now: number) => {
    this.frame = 0
    for (const [i, turn] of this.turns) {
      if (now < turn.start) continue
      const step = Math.floor((now - turn.start) / STEP_MS)
      if (step >= turn.faces.length) {
        this.snap(i, turn.target)
        continue
      }
      if (step !== turn.step) {
        turn.step = step
        const from = step === 0 ? turn.from : turn.faces[step - 1]
        // The new letter is already behind the falling flap; the old one stays
        // below until the landing flap covers it.
        this.faces[i] = { t: turn.faces[step], b: from, tone: turn.target.tone }
      }
      this.dirty.add(i)
    }

    this.draw(now)

    if (this.turns.size) {
      this.schedule()
    } else {
      for (const callback of this.idle.splice(0)) callback()
    }
  }

  // ——— drawing ———

  private readPalette(): Palette {
    const css = getComputedStyle(this.el)
    const v = (name: string) => css.getPropertyValue(name).trim()
    return {
      flap: v('--flap'),
      flapShade: v('--flap-shade'),
      hinge: v('--hinge'),
      ink: v('--ink'),
      muted: v('--muted'),
      accent: v('--accent'),
      lit: v('--lit'),
      litInk: v('--lit-ink'),
      hot: v('--hot'),
      font: v('--font-flap'),
    }
  }

  /**
   * A whole resting flap, letter and all, at device resolution. Cells draw
   * halves of these, so a frame is a handful of image copies per cell and no
   * text layout at all.
   */
  private sprite(ch: string, tone: Tone, hot: boolean): HTMLCanvasElement {
    const key = `${tone}${hot ? '!' : ''}${ch}`
    let sprite = this.sprites.get(key)
    if (sprite) return sprite
    const p = (this.palette ??= this.readPalette())
    const { cw, ch: h } = this.m
    const d = this.dpr
    sprite = document.createElement('canvas')
    sprite.width = Math.round(cw * d)
    sprite.height = Math.round(h * d)
    const g = sprite.getContext('2d')!
    g.scale(d, d)

    const lit = tone === 'current'
    const face = lit ? p.lit : hot ? p.hot : p.flap
    const shade = darken(face, lit ? 0.14 : 0.12)
    const r = Math.min(3, cw / 8)
    const half = h / 2

    const top = g.createLinearGradient(0, 0, 0, half)
    top.addColorStop(0, face)
    top.addColorStop(1, lit || hot ? shade : p.flapShade)
    g.fillStyle = top
    g.beginPath()
    g.roundRect(0, 0, cw, half, [r, r, 0, 0])
    g.fill()

    const bottom = g.createLinearGradient(0, half, 0, h)
    bottom.addColorStop(0, lit || hot ? shade : p.flapShade)
    bottom.addColorStop(1, face)
    g.fillStyle = bottom
    g.beginPath()
    g.roundRect(0, half, cw, half, [0, 0, r, r])
    g.fill()

    if (ch !== ' ') {
      g.fillStyle = lit ? p.litInk : { ink: p.ink, muted: p.muted, accent: p.accent, current: p.litInk }[tone]
      g.font = `600 ${Math.round(h * 0.7)}px ${p.font}`
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      // Centre on the cap height, so capitals sit square on the hinge.
      const cap = g.measureText('H').actualBoundingBoxAscent
      g.fillText(ch, cw / 2, half + cap / 2)
    }

    // The split between the two halves, drawn over the letter as on a real one.
    g.fillStyle = p.hinge
    g.fillRect(0, half - 0.5, cw, 1)

    if (hot) {
      g.fillStyle = p.accent
      g.fillRect(0, h - 2, cw, 2)
    }

    this.sprites.set(key, sprite)
    return sprite
  }

  private draw(now: number) {
    const { cols, cw, ch, gap } = this.m
    if (!cols) return
    const ctx = this.ctx
    const rect = this.el.getBoundingClientRect()
    const x0 = Math.round(rect.left)
    const y0 = Math.round(rect.top)
    const pitchX = cw + gap
    const pitchY = ch + gap
    const first = Math.max(0, Math.floor(-y0 / pitchY))
    const last = Math.min(this.rows - 1, Math.floor((innerHeight - y0) / pitchY))

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.imageSmoothingEnabled = true

    const cell = (i: number) => {
      const row = Math.floor(i / cols)
      if (row < first || row > last || i >= this.faces.length) return
      const x = x0 + (i % cols) * pitchX
      const y = y0 + row * pitchY
      this.drawCell(i, x, y, now)
    }

    if (this.full) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      for (let row = first; row <= last; row++) {
        for (let c = 0; c < cols; c++) cell(row * cols + c)
      }
      this.full = false
    } else {
      for (const i of this.dirty) cell(i)
    }
    this.dirty.clear()
  }

  private drawCell(i: number, x: number, y: number, now: number) {
    const { cw, ch } = this.m
    const ctx = this.ctx
    const face = this.faces[i]
    const hot = this.hot.has(i)
    const d = this.dpr
    const half = ch / 2
    const sw = Math.round(cw * d)
    const sh = Math.round(ch * d)
    const shalf = sh / 2

    ctx.clearRect(x - 1, y - 1, cw + 2, ch + 3)
    const top = this.sprite(face.t, face.tone, hot)
    const bottom = face.b === face.t ? top : this.sprite(face.b, face.tone, hot)
    ctx.drawImage(top, 0, 0, sw, shalf, x, y, cw, half)
    ctx.drawImage(bottom, 0, shalf, sw, shalf, x, y + half, cw, half)

    const turn = this.turns.get(i)
    if (!turn || turn.step < 0) return

    // Part way through a face: one flap folding about the hinge. Its height is
    // the cosine of its angle, and it darkens as it turns away from the light.
    const phase = ((now - turn.start) % STEP_MS) / STEP_MS
    if (phase < 0.5) {
      const angle = (phase / 0.5) * (Math.PI / 2)
      const h = half * Math.cos(angle)
      if (h < 0.5) return
      ctx.drawImage(bottom, 0, 0, sw, shalf, x, y + half - h, cw, h)
      ctx.fillStyle = `rgb(0 0 0 / ${0.45 * Math.sin(angle)})`
      ctx.fillRect(x, y + half - h, cw, h)
    } else {
      const angle = (1 - (phase - 0.5) / 0.5) * (Math.PI / 2)
      const h = half * Math.cos(angle)
      if (h < 0.5) return
      ctx.drawImage(top, 0, shalf, sw, shalf, x, y + half, cw, h)
      ctx.fillStyle = `rgb(0 0 0 / ${0.3 * Math.sin(angle)})`
      ctx.fillRect(x, y + half, cw, h)
    }
  }

  /**
   * Real anchors over each stretch of a link, one per row it wraps across.
   *
   * They carry the source link's href and target, so a click on the board is a
   * click on the link. They are out of the tab order: keyboard focus stays on
   * the source links, and lights these from there.
   */
  private layoutHits(grid: Grid, links: HTMLAnchorElement[]) {
    const hits: Hit[] = []
    this.linkCells.clear()
    grid.forEach((row, r) => {
      let open: Hit | null = null
      row.forEach((cell, c) => {
        if (cell.link !== undefined) {
          const list = this.linkCells.get(cell.link) ?? []
          list.push(r * row.length + c)
          this.linkCells.set(cell.link, list)
        }
        if (open && open.link === cell.link) {
          open.span++
          return
        }
        open = cell.link === undefined ? null : { link: cell.link, row: r, col: c, span: 1 }
        if (open) hits.push(open)
      })
    })

    const { cw, ch, gap } = this.m
    this.hits.replaceChildren(
      ...hits.map(({ link, row, col, span }) => {
        const source = links[link]
        const a = document.createElement('a')
        a.href = source?.href ?? '#'
        if (source?.target) a.target = source.target
        if (source?.rel) a.rel = source.rel
        a.tabIndex = -1
        a.dataset.link = String(link)
        a.style.left = `${col * (cw + gap)}px`
        a.style.top = `${row * (ch + gap)}px`
        a.style.width = `${span * (cw + gap) - gap}px`
        a.style.height = `${ch}px`
        a.addEventListener('pointerenter', () => this.highlight(link))
        a.addEventListener('pointerleave', () => this.highlight(null))
        return a
      }),
    )
  }
}
