import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Rect } from '../scene/aseprite'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import { TIME_ZONE, roll, type Activity } from '../activity'
import type { ToggleValues } from '../scene/toggles'
import { REFRESH_MS, currentSky, lastKnownSky, type Sky } from '../weather'
import { chooseTheme, isDark, watchSystem } from '../theme'

/**
 * The pixel desk scene, as the home page hero.
 *
 * Most of it runs itself: what is on the monitor, whether the lamp is lit and
 * what the weather is doing all follow the real world rather than the page. The
 * objects are there to override that, not to drive it — which is why the state
 * below is two nullable overrides rather than the six raw values the prototype
 * exposed.
 */

/**
 * The scene fills its column rather than snapping to whole-number scales.
 *
 * Whole-number scaling keeps a pixel grid perfectly even, but the column is
 * 720px wide and the scene is 192, so the nearest whole step is 3x — leaving
 * 144px of dead space. Filling means a fractional scale and therefore slightly
 * uneven pixel widths; `image-rendering: pixelated` keeps the edges hard, so
 * what you lose is grid regularity rather than crispness.
 */
const SCENE_W = 192
const SCENE_H = 108

/** Touch targets below this get an invisible margin so small art stays tappable. */
const MIN_TARGET_PX = 44

/**
 * How often the hit targets resample the desk's eased height.
 *
 * Coarse on purpose. This only moves a hit box, and re-rendering React sixty
 * times a second to follow an eighteen pixel slide would be absurd; the canvas
 * is doing the actual animation.
 */
const DESK_SAMPLE_MS = 80

/*
 * The room's lamp and the page's colours are one setting, owned by `theme.ts`.
 *
 * A dark page beside a lit room is the two halves of one frame disagreeing, so
 * the switch on the wall and the system appearance write the same value and
 * both the lamp and the stylesheet read it.
 *
 * It replaced a lamp derived from dusk and presence — on when it was dark
 * outside and somebody was home. That read well on its own and cannot coexist
 * with this: one lamp cannot follow two things. What survives is the half worth
 * keeping, because the windows still run on real sunrise and sunset. The room
 * keeps its own time; only the light switch belongs to whoever is looking.
 *
 * The wash is eased, so a flip fades over about a second rather than cutting.
 */

/**
 * How far each row is inset at the corners, outermost first, in scene pixels.
 *
 * A CSS border-radius is the wrong tool here: it draws a smooth antialiased
 * curve over art that is deliberately hard-edged, so the corner ends up being
 * the one part of the frame not made of pixels. This steps instead, and because
 * the steps are scene pixels the corner scales with everything else.
 */
const CORNER_STEPS = [1]

/**
 * The stair as a clip-path polygon, in percentages so it tracks the element.
 *
 * Walks the outline clockwise from the top-left. Each row `i` of a corner spans
 * one scene pixel vertically and is inset by CORNER_STEPS[i] horizontally, which
 * is what puts every tread exactly on the pixel grid rather than between two of
 * them.
 */
const cornerClipPath = (w: number, h: number, steps: number[]) => {
  const n = steps.length
  const inset = (i: number) => steps[i] ?? 0
  const points: [number, number][] = []

  points.push([inset(0), 0], [w - inset(0), 0])
  for (let i = 0; i < n; i += 1) points.push([w - inset(i), i + 1], [w - inset(i + 1), i + 1])
  points.push([w, h - n])
  for (let i = n - 1; i >= 0; i -= 1) points.push([w - inset(i), h - 1 - i], [w - inset(i), h - i])
  points.push([inset(0), h])
  for (let i = 0; i < n; i += 1) points.push([inset(i), h - i - 1], [inset(i + 1), h - i - 1])
  points.push([0, n])
  for (let i = n - 1; i >= 0; i -= 1) points.push([inset(i), i + 1], [inset(i), i])

  return `polygon(${points
    .map(([x, y]) => `${((x / w) * 100).toFixed(4)}% ${((y / h) * 100).toFixed(4)}%`)
    .join(', ')})`
}

const SCENE_CLIP = cornerClipPath(SCENE_W, SCENE_H, CORNER_STEPS)


export default function DeskScene() {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<DeskRoom | null>(null)

  const [slices, setSlices] = useState<Map<string, Rect> | null>(null)
  /** Mirrors the scene's eased desk height, so hit targets stay under the finger. */
  const [deskOffset, setDeskOffset] = useState(0)
  const [scale, setScale] = useState(0)
  const [failed, setFailed] = useState(false)

  const [clock, setClock] = useState<ToggleValues['clock']>('12-hour')

  // Seeded from the last visit rather than a default, so the sky does not paint
  // clear and then visibly correct itself once the request lands.
  const [sky, setSky] = useState<Sky>(() => lastKnownSky() ?? { condition: 'clear', daylight: null })

  useEffect(() => {
    let cancelled = false
    const load = () => {
      currentSky().then((next) => {
        if (!cancelled) setSky(next)
      })
    }
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  /**
   * Light or dark, for the room and the page both.
   *
   * One piece of state with two writers — the switch on the wall and the system
   * appearance — rather than a preference the room follows and an override that
   * escapes it. That collapse is the point: with the switch setting a theme and
   * the theme driving the switch, anything less than one shared value is a loop.
   */
  const [dark, setDark] = useState(isDark)
  useEffect(() => watchSystem(setDark), [])

  /**
   * The room's state for this visit, rolled once and then left alone.
   *
   * It used to re-roll every minute or two, so the chair could empty or the
   * screen switch content while someone was mid-sentence. Change with no cause
   * reads as a glitch rather than as life: nothing the visitor did explains it,
   * so it pulls the eye off the words for nothing.
   *
   * A reload is the only thing that rolls again, which is also what makes the
   * variety land — between visits rather than during one.
   */
  const [activity] = useState<Activity>(() => roll(new Date()))

  const values = useMemo<Partial<ToggleValues>>(() => {
    return {
      // The environment is still real. Only the room's occupancy is rolled.
      lighting: 'auto',
      weather: sky.condition,
      daylight: sky.daylight,
      // `present` and not `typing`: there is no typing pose yet, and a missing
      // tag falls back to playing the whole sheet — which would cycle the empty
      // chair and flicker the person in and out.
      presence: activity.presence,
      // Power. What is playing is `screen`, and the roll decides which.
      monitor: 'on',
      screen: activity.screen,
      // The lamp and the page are the same fact seen twice.
      roomLight: dark ? 'off' : 'on',
      clock,
    }
  }, [activity, sky, dark, clock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: DeskRoom | null = null
    let cancelled = false

    createDeskRoom(canvas, { values, timeZone: TIME_ZONE, posture: activity.posture, outfit: activity.outfit })
      .then((created) => {
        if (cancelled) return
        scene = created
        sceneRef.current = created
        setSlices(
          new Map(
            ['light-switch', 'clock-screen', 'desk-controls', 'power-outlet']
              .map((name) => [name, created.slice(name)] as const)
              .filter((entry): entry is [string, Rect] => Boolean(entry[1])),
          ),
        )
        created.start()
      })
      .catch(() => {
        // A hero that fails to load should leave the page intact, not break it.
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      scene?.stop()
      sceneRef.current = null
    }
    // Mounted once; `values` is the initial seed and updates go through set().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sceneRef.current?.set(values)
  }, [values])

  // Follow the desk while it travels, then stop.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = sceneRef.current?.deskOffset() ?? 0
      setDeskOffset((previous) => (Math.abs(previous - current) < 0.01 ? previous : current))
    }, DESK_SAMPLE_MS)
    return () => window.clearInterval(timer)
  }, [])

  // Track the column width; the scene fills it.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const fit = () => setScale(frame.clientWidth / SCENE_W)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // Both flip from whatever is showing now, so the first click always does
  // something visible rather than re-asserting the scheduled value.

  // Working the switch is choosing a theme, which is why it writes through the
  // module rather than only into React state: the choice outlives this page.
  const toggleLight = useCallback(
    () =>
      setDark((current) => {
        chooseTheme(!current)
        return !current
      }),
    [],
  )
  if (failed) return null

  /** Slices that ride the desk, so their hit targets have to ride it too. */
  const RIDES_THE_DESK = new Set(['monitor-screen', 'clock-screen', 'desk-controls'])

  const hitBox = (slice: Rect, rides: boolean) => {
    const lift = rides ? Math.round(deskOffset) : 0
    const width = Math.max(slice.w * scale, MIN_TARGET_PX)
    const height = Math.max(slice.h * scale, MIN_TARGET_PX)
    return {
      width,
      height,
      left: (slice.x + slice.w / 2) * scale - width / 2,
      top: (slice.y - lift + slice.h / 2) * scale - height / 2,
    }
  }

  const hotspots: { slice: string; label: string; onClick: () => void }[] = [
    {
      slice: 'light-switch',
      label: 'Toggle the room light',
      onClick: toggleLight,
    },
    {
      slice: 'desk-controls',
      label: 'Raise or lower the desk',
      onClick: () => sceneRef.current?.toggleDesk(),
    },
    {
      slice: 'power-outlet',
      label: 'Unplug the desk, or plug it back in',
      onClick: () => sceneRef.current?.toggleCable(),
    },
    {
      slice: 'clock-screen',
      label: 'Switch the clock between 12 and 24 hour',
      onClick: () => setClock((current) => (current === '12-hour' ? '24-hour' : '12-hour')),
    },
  ]

  return (
    <div ref={frameRef} className="mb-16 w-full">
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: `${SCENE_W} / ${SCENE_H}`,
          opacity: scale ? 1 : 0,
          clipPath: SCENE_CLIP,
        }}
      >
        <canvas
          ref={canvasRef}
          width={SCENE_W}
          height={SCENE_H}
          className="block h-full w-full [image-rendering:pixelated]"
          role="img"
          aria-label="Pixel-art illustration of my desk, with a monitor, a clock and a window onto the weather."
        />
        {slices &&
          hotspots.map(({ slice, label, onClick }) => {
            const bounds = slices.get(slice)
            if (!bounds) return null
            return (
              <button
                key={slice}
                type="button"
                onClick={onClick}
                style={hitBox(bounds, RIDES_THE_DESK.has(slice))}
                className="absolute cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span className="sr-only">{label}</span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
