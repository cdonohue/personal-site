import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Rect } from '../scene/aseprite'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import { FIRST_IMPRESSION_FLOOR, TIME_ZONE, dwellMs, roll, type Activity } from '../activity'
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

  // The room's own comings and goings. Rolled once now, then again on a dwell
  // timer, so a visitor who stays a while sees it change rather than sitting on
  // one frozen state.
  const [activity, setActivity] = useState<Activity>(() => roll(new Date(), FIRST_IMPRESSION_FLOOR))

  useEffect(() => {
    let timer = 0
    const schedule = () => {
      // A fresh interval each time, because the dwell itself is random — a fixed
      // setInterval would make the room change on a metronome.
      timer = window.setTimeout(() => {
        setActivity(roll(new Date()))
        schedule()
      }, dwellMs())
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])

  const values = useMemo<Partial<ToggleValues>>(() => {
    // Not `powerOverride ?? activity.powered`: the override is the string
    // 'off', which is truthy, so ?? would hand a truthy value to the test below
    // and the monitor could never be switched off.
    const powered = powerOverride ? powerOverride === 'on' : activity.powered

    return {
      // The environment is still real. Only the room's occupancy is rolled.
      lighting: 'auto',
      weather,
      // `present` and not `typing`: there is no typing pose yet, and a missing
      // tag falls back to playing the whole sheet — which would cycle the empty
      // chair and flicker the person in and out.
      presence: activity.presence,
      monitor: powered ? activity.content : 'off',
      // The lamp goes off on the way out, unless someone has said otherwise. An
      // override holds for the visit rather than expiring on the next roll.
      roomLight: lightOverride ?? (activity.presence === 'present' ? 'on' : 'off'),
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
