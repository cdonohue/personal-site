import type { Daylight } from './toggles.ts'

const WASH = {
  day: { on: 0, off: 0.55 },
  night: { on: 0.28, off: 0.8 },
}

export const washFor = (lightsOn: boolean, nightAmount: number): number => {
  const key = lightsOn ? 'on' : 'off'
  return WASH.day[key] + (WASH.night[key] - WASH.day[key]) * nightAmount
}

const formatters = new Map<string, Intl.DateTimeFormat>()

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export const zonedParts = (
  date: Date,
  timeZone?: string,
): { hour: number; minute: number; second: number; weekday: number } => {
  if (!timeZone) {
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: date.getDay(),
    }
  }

  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }

  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) parts[part.type] = part.value

  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday] ?? date.getDay(),
  }
}

const DAWN_LEAD = 1
const DAWN_TRAIL = 0.5
const DUSK_LEAD = 0.5
const DUSK_TRAIL = 1
const FALLBACK_DAYLIGHT: Daylight = { sunrise: 6.5, sunset: 18.5 }

const smoothstep = (value: number) => value * value * (3 - 2 * value)

export const nightAmountAt = (date: Date, timeZone?: string, daylight?: Daylight | null): number => {
  const at = zonedParts(date, timeZone)
  const hour = at.hour + at.minute / 60 + at.second / 3600
  const { sunrise, sunset } = daylight ?? FALLBACK_DAYLIGHT

  const dawnStart = sunrise - DAWN_LEAD
  const dawnEnd = sunrise + DAWN_TRAIL
  const duskStart = sunset - DUSK_LEAD
  const duskEnd = sunset + DUSK_TRAIL

  if (hour < dawnStart) return 1
  if (hour < dawnEnd) return 1 - smoothstep((hour - dawnStart) / (dawnEnd - dawnStart))
  if (hour < duskStart) return 0
  if (hour < duskEnd) return smoothstep((hour - duskStart) / (duskEnd - duskStart))
  return 1
}

export const nightAmountFor = (
  lighting: 'auto' | 'day' | 'night',
  now: Date,
  timeZone?: string,
  daylight?: Daylight | null,
): number =>
  lighting === 'auto' ? nightAmountAt(now, timeZone, daylight) : lighting === 'night' ? 1 : 0
