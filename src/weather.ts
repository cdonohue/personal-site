import type { Weather } from './scene/toggles'

/**
 * What the window looks out on: the real conditions where the room is.
 *
 * This is host policy rather than scene behaviour — the scene takes a condition
 * and draws it, and has no idea where it came from — so it lives out here
 * rather than in `scene/`.
 *
 * Deliberately *not* the visitor's weather. The room belongs to someone, and a
 * visitor is looking in on their day; mirroring the visitor's own sky would make
 * it a weather widget wearing a room. That choice is also what keeps this free
 * of a permission prompt: the coordinates are fixed, so nothing is ever asked of
 * whoever is looking.
 */

/**
 * Houston, not the house.
 *
 * These coordinates are committed to a public repository, and a precise home
 * location is not something to publish. The city is twenty miles from the room
 * and produces the same answer at this resolution — the five conditions below
 * cannot tell the two apart — so the fidelity cost is nil.
 */
const LATITUDE = 29.76
const LONGITUDE = -95.37

const ENDPOINT =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=weather_code`

const CACHE_KEY = 'desk-scene.weather'

/** Weather does not turn over quickly, and the sky is set dressing. */
export const REFRESH_MS = 30 * 60 * 1000

/** Long enough to be worth waiting for, short enough not to hang the hero. */
const TIMEOUT_MS = 6000

/**
 * WMO code to one of the five conditions the art has.
 *
 * Snow is left where it belongs rather than widened to catch sleet and freezing
 * rain. In Houston that means the snow frames are effectively dormant — a few
 * days a decade — which is the honest answer: the window is worth doing because
 * it tells the truth, and inflating one bucket to get more use out of the art
 * would trade exactly the thing that makes it worth having.
 *
 * Order matters. Freezing rain (66–67) falls inside the drizzle-and-rain range
 * and should read as rain, so snow is tested first and does not claim it.
 */
export const conditionFor = (code: number): Weather => {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain'
  if (code === 2 || code === 3) return 'overcast'
  // 0 clear, 1 mainly clear, and anything unrecognised.
  return 'clear'
}

type Cached = { condition: Weather; at: number }

const readCache = (): Cached | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    return typeof parsed?.at === 'number' && parsed.condition ? parsed : null
  } catch {
    return null
  }
}

/**
 * The last condition seen, however old.
 *
 * Used to paint something plausible on the first frame instead of defaulting to
 * clear and then visibly correcting itself a moment later. Stale weather from
 * the last visit is a better guess than no weather at all.
 */
export const lastKnownCondition = (): Weather | null => readCache()?.condition ?? null

/**
 * The current condition, from cache when it is fresh enough.
 *
 * Never throws and never rejects. A hero that cannot reach a weather service
 * should carry on with a clear sky, not fail — so every error path here ends at
 * a usable condition.
 */
export const currentCondition = async (): Promise<Weather> => {
  const cached = readCache()
  if (cached && Date.now() - cached.at < REFRESH_MS) return cached.condition

  try {
    // Bounded, so a hanging request cannot leave the sky stuck for the visit.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const response = await fetch(ENDPOINT, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) throw new Error(`weather: HTTP ${response.status}`)
    const body = (await response.json()) as { current?: { weather_code?: number } }
    const code = body.current?.weather_code
    if (typeof code !== 'number') throw new Error('weather: no weather_code in response')

    const condition = conditionFor(code)
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ condition, at: Date.now() } satisfies Cached),
      )
    } catch {
      // Storage unavailable or full: the sky still works, it just refetches.
    }
    return condition
  } catch {
    // Stale beats wrong: a condition from an hour ago is closer to the truth
    // than falling back to clear because the network blipped.
    return cached?.condition ?? 'clear'
  }
}
