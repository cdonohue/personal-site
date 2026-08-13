import { useCallback, useEffect, useRef, useState } from 'react'
import type { Rect } from '../scene/aseprite'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import type { ToggleValues } from '../scene/toggles'

/**
 * The pixel desk scene, as the home page hero.
 *
 * Interactive through the objects themselves — the light switch, the monitor
 * and the clock — rather than through controls. The prototype's toggle bar was
 * for debugging and deliberately does not come across.
 *
 * Lighting runs on `auto`, so the room follows the visitor's own clock.
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

const INITIAL: Partial<ToggleValues> = {
  lighting: 'auto',
  weather: 'clear',
  roomLight: 'on',
  monitor: 'on',
  presence: 'typing',
  clock: '12-hour',
}

/** Clicking an object cycles that setting. */
const HOTSPOTS: { id: keyof ToggleValues; slice: string; label: string }[] = [
  { id: 'roomLight', slice: 'light-switch', label: 'Toggle the room light' },
  { id: 'monitor', slice: 'monitor-screen', label: 'Change what is on the monitor' },
  { id: 'clock', slice: 'clock-screen', label: 'Switch the clock between 12 and 24 hour' },
]

const CYCLES: Partial<Record<keyof ToggleValues, readonly string[]>> = {
  roomLight: ['on', 'off'],
  monitor: ['on', 'game', 'idle', 'off'],
  clock: ['12-hour', '24-hour'],
}

export default function DeskScene() {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<DeskRoom | null>(null)

  const [slices, setSlices] = useState<Map<string, Rect> | null>(null)
  const [values, setValues] = useState<Partial<ToggleValues>>(INITIAL)
  const [scale, setScale] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: DeskRoom | null = null
    let cancelled = false

    createDeskRoom(canvas, { values: INITIAL })
      .then((created) => {
        if (cancelled) return
        scene = created
        sceneRef.current = created
        setSlices(
          new Map(
            HOTSPOTS.map(({ slice }) => [slice, created.slice(slice)] as const).filter(
              (entry): entry is [string, Rect] => Boolean(entry[1]),
            ),
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
  }, [])

  useEffect(() => {
    sceneRef.current?.set(values)
  }, [values])

  // Track the column width; the scene fills it.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const fit = () => {
      // Fractional on purpose — see SCENE_W. Hotspots are positioned with the
      // same number, so they track the art exactly whatever it works out to.
      setScale(frame.clientWidth / SCENE_W)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const cycle = useCallback((id: keyof ToggleValues) => {
    const options = CYCLES[id]
    if (!options) return
    setValues((current) => {
      const at = options.indexOf(String(current[id]))
      return { ...current, [id]: options[(at + 1) % options.length] }
    })
  }, [])

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

  return (
    <div ref={frameRef} className="mb-16 w-full">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}`, opacity: scale ? 1 : 0 }}
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
          HOTSPOTS.map(({ id, slice, label }) => {
            const bounds = slices.get(slice)
            if (!bounds) return null
            return (
              <button
                key={id}
                type="button"
                onClick={() => cycle(id)}
                style={hitBox(bounds)}
                className="absolute cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span className="sr-only">{label}</span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
