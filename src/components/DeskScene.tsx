import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Rect } from '../scene/aseprite'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import { LIVE_ON_ARRIVAL, TIME_ZONE, roll, sceneStateFor, type Activity } from '../activity'
import type { ToggleValues, Weather } from '../scene/toggles'
import { REFRESH_MS, currentCondition, lastKnownCondition } from '../weather'

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

/** A visitor's choice, or null to follow whatever the room is doing. */
type Override = 'on' | 'off' | null

export default function DeskScene() {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<DeskRoom | null>(null)

  const [slices, setSlices] = useState<Map<string, Rect> | null>(null)
  const [scale, setScale] = useState(0)
  const [failed, setFailed] = useState(false)

  // What a visitor can change. Everything else is rolled. Both of these are
  // nullable rather than plain booleans so that null means "whatever the room is
  // doing" — a boolean default would have to pick on or off and would then fight
  // the roll.
  const [powerOverride, setPowerOverride] = useState<Override>(null)
  const [lightOverride, setLightOverride] = useState<Override>(null)
  const [clock, setClock] = useState<ToggleValues['clock']>('12-hour')

  // Seeded from the last visit rather than a default, so the sky does not paint
  // clear and then visibly correct itself once the request lands.
  const [weather, setWeather] = useState<Weather>(() => lastKnownCondition() ?? 'clear')

  useEffect(() => {
    let cancelled = false
    const load = () => {
      currentCondition().then((condition) => {
        if (!cancelled) setWeather(condition)
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
  const [activity] = useState<Activity>(() => roll(new Date(), LIVE_ON_ARRIVAL))

  const values = useMemo<Partial<ToggleValues>>(() => {
    const { presence, monitor } = sceneStateFor(activity, powerOverride)

    return {
      // The environment is still real. Only the room's occupancy is rolled.
      lighting: 'auto',
      weather,
      // `present` and not `typing`: there is no typing pose yet, and a missing
      // tag falls back to playing the whole sheet — which would cycle the empty
      // chair and flicker the person in and out.
      presence,
      monitor,
      // The lamp goes off on the way out, unless someone has said otherwise. An
      // override holds for the visit rather than expiring on the next roll.
      roomLight: lightOverride ?? (presence === 'present' ? 'on' : 'off'),
      clock,
    }
  }, [activity, weather, powerOverride, lightOverride, clock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: DeskRoom | null = null
    let cancelled = false

    createDeskRoom(canvas, { values, timeZone: TIME_ZONE })
      .then((created) => {
        if (cancelled) return
        scene = created
        sceneRef.current = created
        setSlices(
          new Map(
            ['light-switch', 'monitor-screen', 'clock-screen']
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
  const flip =
    (setOverride: Dispatch<SetStateAction<Override>>, onByDefault: (now: Date) => boolean) => () =>
      setOverride((current) =>
        (current ?? (onByDefault(new Date()) ? 'on' : 'off')) === 'on' ? 'off' : 'on',
      )

  // Read through a ref so the callbacks stay stable while still flipping from
  // whatever the room is doing at the moment of the click.
  const activityRef = useRef(activity)
  activityRef.current = activity

  const toggleLight = useCallback(
    flip(setLightOverride, () => activityRef.current.presence === 'present'),
    [],
  )
  const toggleMonitor = useCallback(
    flip(setPowerOverride, () => activityRef.current.powered),
    [],
  )

  if (failed) return null

  const hitBox = (slice: Rect) => {
    const width = Math.max(slice.w * scale, MIN_TARGET_PX)
    const height = Math.max(slice.h * scale, MIN_TARGET_PX)
    return {
      width,
      height,
      left: (slice.x + slice.w / 2) * scale - width / 2,
      top: (slice.y + slice.h / 2) * scale - height / 2,
    }
  }

  const hotspots: { slice: string; label: string; onClick: () => void }[] = [
    {
      slice: 'light-switch',
      label: 'Toggle the room light',
      onClick: toggleLight,
    },
    {
      slice: 'monitor-screen',
      label: 'Turn the monitor on or off',
      onClick: toggleMonitor,
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
                style={hitBox(bounds)}
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
