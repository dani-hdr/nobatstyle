import DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'

/** Persian weekdays starting Saturday (شنبه). Index 0 is Saturday. */
export const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const

export type JalaliCell = {
  /** DateTime value of this day */
  date: Date
  /** Persian formatted yyyy/MM/dd used as a stable key */
  key: string
  day: number
  inMonth: boolean
  available: boolean
}

export type JalaliDayMeta = {
  key: string
  date: Date
  available: boolean
}

/** Determines whether a date is available. Demo rule: closed Fridays; otherwise open. */
function isAvailable(date: Date): boolean {
  return date.getDay() !== 5
}

/**
 * Builds the array of available date keys for the next `count` days.
 * Server/client agnostic; later this comes from the CMS schedule.
 */
export function buildAvailableDays(count: number): JalaliDayMeta[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: JalaliDayMeta[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const jo = new DateObject(d).convert(persian)
    days.push({ key: jo.format('YYYY/MM/DD'), date: d, available: isAvailable(d) })
  }
  return days
}

/**
 * Moves selection to the next available day. Returns the selection (key) or
 * undefined if none available.
 */
export function defaultAvailable(availableDays: JalaliDayMeta[]): string | undefined {
  return availableDays.find((d) => d.available)?.key
}

/**
 * Renders the current Persian month as a week grid (weeks start on Saturday).
 * Each leading/trailing day outside the month is still a cell (with `inMonth: false`).
 * When `allowedKeys` is given, only those days (yyyy/MM/dd) are selectable —
 * used to clamp the calendar to the barber's booking window.
 */
export function buildMonthGrid(now = new Date(), allowedKeys?: Set<string>): JalaliCell[] {
  const persianNow = new DateObject(now).convert(persian)
  const year = persianNow.year
  const month = persianNow.month.number
  const monthStart = new DateObject({ calendar: persian, year, month, day: 1 })
  const daysInMonth = monthStart.add(1, 'month').subtract(1, 'day').day

  const firstOfMonth = monthStart.toDate()
  const firstWeekday = (firstOfMonth.getDay() + 1) % 7 // Saturday -> 0

  const cells: JalaliCell[] = []

  // Leading days of previous month
  for (let i = 0; i < firstWeekday; i++) {
    const back = new Date(firstOfMonth)
    back.setDate(firstOfMonth.getDate() - (firstWeekday - i))
    cells.push(toCell(back, false))
  }

  // Days of this month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new DateObject({ calendar: persian, year, month, day: d }).toDate()
    cells.push(toCell(date, true))
  }

  // Pad to full weeks
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const next = new Date(last)
    next.setDate(last.getDate() + 1)
    cells.push(toCell(next, false))
  }

  if (allowedKeys) {
    for (const cell of cells) {
      cell.available = allowedKeys.has(cell.key)
    }
  }

  return cells
}

function toCell(date: Date, inMonth: boolean): JalaliCell {
  const jo = new DateObject(date).convert(persian)
  return {
    date,
    key: jo.format('YYYY/MM/DD'),
    day: jo.day,
    inMonth,
    available: isAvailable(date),
  }
}

export function formatJalali(date: Date): string {
  return new DateObject(date).convert(persian, persian_fa).format('dddd D MMMM YYYY')
}

export function formatJalaliShort(date: Date | string): string {
  const d =
    typeof date === 'string'
      ? new DateObject({ calendar: persian, locale: persian_fa, year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) }).toDate()
      : date
  return new DateObject(d).convert(persian, persian_fa).format('dddd D MMMM')
}

/**
 * Converts a Jalali day key (`yyyy/MM/dd`, Latin digits) to a Gregorian
 * `yyyy-mm-dd` string, used as the `date` param for the appointments API.
 */
export function jalaliKeyToISODate(key: string): string {
  const [y, m, d] = key.split('/').map(Number)
  return new DateObject({ calendar: persian, year: y, month: m, day: d })
    .toDate()
    .toLocaleDateString('en-CA') // yyyy-mm-dd
}

export function toFaDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export { persian, persian_fa }
