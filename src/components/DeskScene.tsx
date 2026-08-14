import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Rect } from '../scene/aseprite'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import { nightAmountAt } from '../scene/render'
import type { ToggleValues } from '../scene/toggles'

/**
 * The pixel desk scene, as the home page hero.
 *
 * Most of it runs itself: what is on the monitor and whether the lamp is lit
 * follow a schedule and the visitor's own clock. The objects are there to
 * override that, not to drive it — which is why the state below is two nullable
 * overrides rather than the six raw values the prototype exposed.
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

/** How often the derived state is re-checked against the clock. */
const TICK_MS = 30_000

/** Weekdays, nine to five. */
const isWorkHours = (now: Date) => {
  const day = now.getDay()
  if (day === 0 || day === 6) return false
  const hour = now.getHours() + now.getMinutes() / 60
  return hour >= 9 && hour < 17
}

/**
 * Past halfway into the night ramp. nightAmountAt is a smooth 0..1 curve, so
 * this crosses partway through dusk rather than snapping at a fixed hour, and
 * it agrees with the lighting the scene is already drawing.
 *
 * This doubles as "nobody is here": the lamp going off and the chair emptying
 * are the same moment, so they read as one person leaving rather than two
 * unrelated timers.
 */
const isNight = (now: Date) => nightAmountAt(now) > 0.5

/**
 * The hours the machine sleeps too, and the monitor goes dark rather than
 * running a screensaver.
 *
 * Later than the lamp and the empty chair on purpose. The room emptying at dusk
 * and the screen going out at bedtime are two different departures, and
 * collapsing them would skip straight from working to a dead desk — losing the
 * lit screensaver glowing in a dark room, which is the best-looking state here.
 */
const SLEEP_FROM = 23
const SLEEP_UNTIL = 6

/** A visitor's choice, or null to follow the hour. */
type Override = 'on' | 'off' | null

const isSleeping = (now: Date) => {
  const hour = now.getHours() + now.getMinutes() / 60
  // Wraps past midnight, so this is an or rather than a range.
  return hour >= SLEEP_FROM || hour < SLEEP_UNTIL
}

export default function DeskScene() {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<DeskRoom | null>(null)

  const [slices, setSlices] = useState<Map<string, Rect> | null>(null)
  const [scale, setScale] = useState(0)
  const [failed, setFailed] = useState(false)

  // What a visitor can change. Everything else is derived. Both of these are
  // nullable rather than plain booleans so that null means "whatever the hour
  // says" — a boolean default would have to pick on or off and would then fight
  // the schedule at one end of the day or the other.
  const [powerOverride, setPowerOverride] = useState<Override>(null)
  const [lightOverride, setLightOverride] = useState<Override>(null)
  const [clock, setClock] = useState<ToggleValues['clock']>('12-hour')

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  const values = useMemo<Partial<ToggleValues>>(() => {
    const away = isNight(now)
    const working = isWorkHours(now)

    // What the monitor shows follows whoever is in the chair: work during
    // office hours, the game in the evening and at weekends, and a screensaver
    // once the room is empty. Powering it off wins over all three, so away has
    // exactly two states — screensaver or dark.
    const showing = working ? 'on' : away ? 'idle' : 'game'
    // Not `powerOverride ?? !isSleeping(now)`: the override is the string
    // 'off', which is truthy, so ?? would hand a truthy value to the test below
    // and the monitor could never be switched off.
    const powered = powerOverride ? powerOverride === 'on' : !isSleeping(now)

    return {
      lighting: 'auto',
      weather: 'clear',
      // `present` and not `typing`: there is no typing pose yet, and a missing
      // tag falls back to playing the whole sheet — which would cycle the empty
      // chair and flicker the person in and out.
      presence: away ? 'away' : 'present',
      monitor: powered ? showing : 'off',
      // Dark outside means the lamp is off, unless someone has said otherwise.
      // An override holds for the visit rather than expiring on the next tick.
      roomLight: lightOverride ?? (away ? 'off' : 'on'),
      clock,
    }
  }, [now, powerOverride, lightOverride, clock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: DeskRoom | null = null
    let cancelled = false

    createDeskRoom(canvas, { values })
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
    (
      setOverride: Dispatch<SetStateAction<Override>>,
      onByDefault: (now: Date) => boolean,
    ) =>
    () =>
      setOverride((current) =>
        (current ?? (onByDefault(new Date()) ? 'on' : 'off')) === 'on'
          ? 'off'
          : 'on',
      )

  const toggleLight = useCallback(
    flip(setLightOverride, (now) => !isNight(now)),
    [],
  )
  const toggleMonitor = useCallback(
    flip(setPowerOverride, (now) => !isSleeping(now)),
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
      onClick: () =>
        setClock((current) => (current === '12-hour' ? '24-hour' : '12-hour')),
    },
  ]

  return (
    <div ref={frameRef} className="mb-16 w-full">
      <div
        className="relative w-full overflow-hidden rounded-md"
        style={{
          aspectRatio: `${SCENE_W} / ${SCENE_H}`,
          opacity: scale ? 1 : 0,
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
