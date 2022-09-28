import {
  parseISO,
  format,
  differenceInYears,
  differenceInMonths,
} from 'date-fns'

function shouldPluralize(count: number) {
  return count > 1
}

function pluralizeYears(numYears: number) {
  return shouldPluralize(numYears) ? 'years' : 'year'
}

function pluralizeMonths(numMonths: number) {
  return shouldPluralize(numMonths) ? 'months' : 'month'
}

export function dateFormat(
  dateString: string,
  formatString: string = 'LLL yyyy'
): string {
  const date = parseISO(dateString)
  return format(date, formatString)
}

export function dateDifference(
  dateString1: string = new Date().toISOString(),
  dateString2: string = new Date().toISOString()
) {
  const date1 = parseISO(dateString1)
  const date2 = parseISO(dateString2)
  const diffYears = differenceInYears(date1, date2)
  const diffMonths = differenceInMonths(date1, date2)
  const displayYears =
    diffYears >= 1 ? `${diffYears} ${pluralizeYears(diffYears)}` : ''
  const displayMonths =
    diffYears >= 1
      ? diffMonths % (12 * diffYears) >= 1
        ? `${diffMonths % (12 * diffYears)} ${pluralizeMonths(
            diffMonths % (12 * diffYears)
          )}`
        : ''
      : `${diffMonths} ${pluralizeMonths(diffMonths)}`
  const readableString = `${displayYears}${
    displayMonths ? `, ${displayMonths}` : ''
  }`
  return readableString
}
