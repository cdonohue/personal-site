import type { Daylight, Weather } from './scene/toggles'

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

/**
 * The zone the daily times come back in.
 *
 * Asking for them in the room's own zone means sunrise arrives as a wall-clock
 * time that can be used directly, rather than as an instant that has to be
 * converted back. Everything downstream already thinks in the room's hours.
 */
const ZONE = 'America/Chicago'

/**
 * One request for both. Sunrise and sunset ride along with the weather because
 * they come from the same endpoint at no extra cost — no key, no second round
 * trip, and they are cached together so they cannot disagree about the day.
 */
const ENDPOINT =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=weather_code` +
  `&daily=sunrise,sunset&forecast_days=1&timezone=${encodeURIComponent(ZONE)}`

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

/** What the window shows and how light it is outside, fetched together. */
export type Sky = { condition: Weather; daylight: Daylight | null }

type Cached = Sky & { at: number }

/**
 * "2026-08-21T06:52" to 6.87.
 *
 * Deliberately string surgery rather than `new Date()`. The API returns these
 * already in the room's zone and without an offset, so parsing them as dates
 * would reinterpret them in the *visitor's* zone and land the sunrise wherever
 * they happen to be standing.
 */
const hourOf = (iso: string | undefined): number | null => {
  const at = /T(\d{2}):(\d{2})/.exec(iso ?? '')
  if (!at) return null
  return Number(at[1]) + Number(at[2]) / 60
}

const daylightFrom = (daily: { sunrise?: string[]; sunset?: string[] } | undefined) => {
  const sunrise = hourOf(daily?.sunrise?.[0])
  const sunset = hourOf(daily?.sunset?.[0])
  // Both or neither. Half a curve is worse than the fixed one it falls back to.
  return sunrise !== null && sunset !== null ? { sunrise, sunset } : null
}

const readCache = (): Cached | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (typeof parsed?.at !== 'number' || !parsed.condition) return null
    // Entries written before sunrise and sunset were fetched are still good for
    // their weather, so they are kept rather than discarded.
    return { ...parsed, daylight: parsed.daylight ?? null }
  } catch {
    return null
  }
}

/**
 * The last sky seen, however old.
 *
 * Used to paint something plausible on the first frame instead of defaulting to
 * clear and then visibly correcting itself a moment later. Stale weather from
 * the last visit is a better guess than no weather at all, and yesterday's
 * sunset is within a couple of minutes of today's.
 */
export const lastKnownSky = (): Sky | null => readCache()

/**
 * The current condition, from cache when it is fresh enough.
 *
 * Never throws and never rejects. A hero that cannot reach a weather service
 * should carry on with a clear sky, not fail — so every error path here ends at
 * a usable condition.
 */
export const currentSky = async (): Promise<Sky> => {
  const cached = readCache()
  if (cached && Date.now() - cached.at < REFRESH_MS) return cached

  try {
    // Bounded, so a hanging request cannot leave the sky stuck for the visit.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const response = await fetch(ENDPOINT, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) throw new Error(`weather: HTTP ${response.status}`)
    const body = (await response.json()) as {
      current?: { weather_code?: number }
      daily?: { sunrise?: string[]; sunset?: string[] }
    }
    const code = body.current?.weather_code
    if (typeof code !== 'number') throw new Error('weather: no weather_code in response')

    const sky: Sky = { condition: conditionFor(code), daylight: daylightFrom(body.daily) }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...sky, at: Date.now() } satisfies Cached))
    } catch {
      // Storage unavailable or full: the sky still works, it just refetches.
    }
    return sky
  } catch {
    // Stale beats wrong: a condition from an hour ago is closer to the truth
    // than falling back to clear because the network blipped. With nothing
    // cached at all the daylight goes null, and the scene uses a fixed curve.
    return cached ?? { condition: 'clear', daylight: null }
  }
}
