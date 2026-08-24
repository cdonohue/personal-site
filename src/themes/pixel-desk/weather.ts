import type { Daylight, Weather } from './scene/toggles'

/**
 * What the visitor sees outside: conditions in Houston.
 *
 * This remains host policy rather than scene behaviour. This module fetches one
 * city-level forecast and the scene only draws the values it receives. No
 * visitor location is requested or inferred.
 */

const HOUSTON = { latitude: 29.76, longitude: -95.37 } as const
const HOUSTON_TIME_ZONE = 'America/Chicago'

/** The visitor's IANA zone, with Houston as the safe browser fallback. */
export const visitorTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || HOUSTON_TIME_ZONE
  } catch {
    return HOUSTON_TIME_ZONE
  }
}

// A new key deliberately ignores caches written for visitor-local forecasts.
const CACHE_KEY = 'desk-scene.weather.v3'

/** Weather does not turn over quickly, and the sky is set dressing. */
export const REFRESH_MS = 30 * 60 * 1000

/** Long enough to be worth waiting for, short enough not to hang the hero. */
const TIMEOUT_MS = 6000

/**
 * WMO code to one of the five conditions the art has.
 *
 * Snow is left where it belongs rather than widened to catch sleet and freezing
 * rain. A visitor somewhere cold will now see those frames honestly; inflating
 * one bucket to get more use out of the art would trade exactly the thing that
 * makes it worth having.
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

type Cached = Sky & { at: number; timeZone: string }

/**
 * "2026-08-21T06:52" to 6.87.
 *
 * Deliberately string surgery rather than `new Date()`. The API returns these
 * already in the requested zone and without an offset, so parsing them as dates
 * would reinterpret them and move the sunrise.
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

const readCache = (timeZone: string): Cached | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (
      typeof parsed?.at !== 'number' ||
      !parsed.condition ||
      parsed.timeZone !== timeZone
    ) return null
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
export const lastKnownSky = (timeZone = visitorTimeZone()): Sky | null => readCache(timeZone)

const endpointFor = (timeZone: string) =>
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${HOUSTON.latitude}&longitude=${HOUSTON.longitude}&current=weather_code` +
  `&daily=sunrise,sunset&forecast_days=1&timezone=${encodeURIComponent(timeZone)}`

const fetchSky = async (timeZone: string): Promise<Sky> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(endpointFor(timeZone), { signal: controller.signal })
    if (!response.ok) throw new Error(`weather: HTTP ${response.status}`)
    const body = (await response.json()) as {
      current?: { weather_code?: number }
      daily?: { sunrise?: string[]; sunset?: string[] }
    }
    const code = body.current?.weather_code
    if (typeof code !== 'number') throw new Error('weather: no weather_code in response')
    return { condition: conditionFor(code), daylight: daylightFrom(body.daily) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The current condition, from cache when it is fresh enough.
 *
 * Never throws and never rejects. A hero that cannot reach a weather service
 * should carry on with a clear sky, not fail — so every error path here ends at
 * a usable condition.
 */
export const currentSky = async (timeZone = visitorTimeZone()): Promise<Sky> => {
  const cached = readCache(timeZone)
  if (cached && Date.now() - cached.at < REFRESH_MS) return cached

  try {
    const sky = await fetchSky(timeZone)
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...sky, timeZone, at: Date.now() } satisfies Cached),
      )
    } catch {
      // Storage unavailable or full: the sky still works, it just refetches.
    }
    return sky
  } catch {
    // If the Houston request fails, stale beats blank. With no cache at all,
    // the scene uses clear weather and its fixed daylight curve.
    return cached ?? { condition: 'clear', daylight: null }
  }
}
