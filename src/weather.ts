import type { Daylight, Weather } from './scene/toggles'

/**
 * What the visitor sees outside: conditions at their current location.
 *
 * This remains host policy rather than scene behaviour. The browser supplies a
 * location, this module turns it into weather and daylight, and the
 * scene only draws the values it receives.
 */

type Coordinates = { latitude: number; longitude: number }

/** City-level fallback, deliberately not a precise home location. */
const HOUSTON: Coordinates = { latitude: 29.76, longitude: -95.37 }
const HOUSTON_TIME_ZONE = 'America/Chicago'

/** The visitor's IANA zone, with Houston as the safe browser fallback. */
export const visitorTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || HOUSTON_TIME_ZONE
  } catch {
    return HOUSTON_TIME_ZONE
  }
}

const CACHE_KEY = 'desk-scene.weather.v2'

/** Weather does not turn over quickly, and the sky is set dressing. */
export const REFRESH_MS = 30 * 60 * 1000

/** Long enough to be worth waiting for, short enough not to hang the hero. */
const TIMEOUT_MS = 6000
const LOCATION_TIMEOUT_MS = 5000

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

type Cached = Sky & Coordinates & { at: number; timeZone: string }

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

const readCache = (timeZone: string, coordinates?: Coordinates): Cached | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (
      typeof parsed?.at !== 'number' ||
      !parsed.condition ||
      parsed.timeZone !== timeZone ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number'
    ) return null
    if (
      coordinates &&
      (Math.abs(parsed.latitude - coordinates.latitude) > 0.25 ||
        Math.abs(parsed.longitude - coordinates.longitude) > 0.25)
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

let coordinatesPromise: Promise<Coordinates> | null = null

/** Ask once per page load. Denial, absence and timeout all resolve to Houston. */
const visitorCoordinates = (): Promise<Coordinates> => {
  if (coordinatesPromise) return coordinatesPromise
  coordinatesPromise = new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(HOUSTON)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(HOUSTON),
      { enableHighAccuracy: false, maximumAge: REFRESH_MS, timeout: LOCATION_TIMEOUT_MS },
    )
  })
  return coordinatesPromise
}

const endpointFor = ({ latitude, longitude }: Coordinates, timeZone: string) =>
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${latitude}&longitude=${longitude}&current=weather_code` +
  `&daily=sunrise,sunset&forecast_days=1&timezone=${encodeURIComponent(timeZone)}`

const fetchSky = async (coordinates: Coordinates, timeZone: string): Promise<Sky> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(endpointFor(coordinates, timeZone), { signal: controller.signal })
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
  const coordinates = await visitorCoordinates()
  const cached = readCache(timeZone, coordinates)
  if (cached && Date.now() - cached.at < REFRESH_MS) return cached

  try {
    let source = coordinates
    let sky: Sky
    try {
      sky = await fetchSky(source, timeZone)
    } catch (error) {
      if (
        source.latitude === HOUSTON.latitude &&
        source.longitude === HOUSTON.longitude
      ) throw error
      source = HOUSTON
      sky = await fetchSky(source, timeZone)
    }
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...sky, ...source, timeZone, at: Date.now() } satisfies Cached),
      )
    } catch {
      // Storage unavailable or full: the sky still works, it just refetches.
    }
    return sky
  } catch {
    // If both the local and Houston requests fail, stale beats blank. With no
    // cache at all, the scene uses clear weather and its fixed daylight curve.
    return cached ?? { condition: 'clear', daylight: null }
  }
}
