import type { PayloadRequest } from 'payload'

export type TimeRange = { start: number; end: number }

export const SLOT_STEP = 15 // minutes

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0)
  return h * 60 + m
}

export function toHHMM(mins: number): string {
  const clamped = Math.max(0, Math.round(mins))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function dateToWeekday(date: Date): string {
  switch (date.getDay()) {
    case 0:
      return 'friday'
    case 1:
      return 'saturday'
    case 2:
      return 'sunday'
    case 3:
      return 'monday'
    case 4:
      return 'tuesday'
    case 5:
      return 'wednesday'
    case 6:
      return 'thursday'
    default:
      return 'saturday'
  }
}

function toDayISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function dayRange(date: Date): { from: string; to: string } {
  const from = new Date(date)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

function intersects(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start
}

/**
 * Compute the working intervals for a barber on a given date after applying
 * recurring workingHours and overriding availabilityExceptions.
 */
export async function getWorkingIntervals(
  req: PayloadRequest,
  barberId: string,
  date: Date,
): Promise<TimeRange[]> {
  const barber = await req.payload.findByID({
    collection: 'barbers',
    id: barberId,
    depth: 0,
  })

  const weekday = dateToWeekday(date)
  const day = Array.isArray(barber.workingHours)
    ? barber.workingHours.find((d) => d.day === weekday && d.enabled)
    : undefined

  const intervals: TimeRange[] = []
  if (day?.slots?.length) {
    for (const slot of day.slots) {
      const start = toMinutes(slot.start)
      const end = toMinutes(slot.end)
      if (end > start) intervals.push({ start, end })
    }
  }

  // Apply one-day exceptions.
  const { from, to } = dayRange(date)
  const exceptions = await req.payload.find({
    collection: 'availabilityExceptions',
    depth: 0,
    limit: 10,
    where: {
      and: [
        { barber: { equals: barberId } },
        { date: { greater_than_equal: from } },
        { date: { less_than: to } },
      ],
    },
  })

  for (const ex of exceptions.docs) {
    if (ex.allDay) {
      return []
    }
    const blocked = (ex.slots || []).map((s) => ({ start: toMinutes(s.start), end: toMinutes(s.end) }))
    let result = intervals
    for (const b of blocked) {
      result = subtractIntervals(result, b)
    }
    return result
  }

  return intervals
}

export function subtractIntervals(base: TimeRange[], removed: TimeRange): TimeRange[] {
  const out: TimeRange[] = []
  for (const r of base) {
    if (!intersects(r, removed)) {
      out.push(r)
      continue
    }
    if (removed.start > r.start) out.push({ start: r.start, end: removed.start })
    if (removed.end < r.end) out.push({ start: removed.end, end: r.end })
  }
  return out
}

/**
 * Read existing confirmed/pending/completed appointments for a barber on a date
 * as occupied intervals.
 */
export async function getBookedIntervals(req: PayloadRequest, barberId: string, date: Date): Promise<TimeRange[]> {
  const { from, to } = dayRange(date)
  const res = await req.payload.find({
    collection: 'appointments',
    depth: 0,
    limit: 100,
    where: {
      and: [
        { barber: { equals: barberId } },
        { date: { greater_than_equal: from } },
        { date: { less_than: to } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
  })
  return res.docs
    .filter((a) => a.startTime && a.endTime)
    .map((a) => ({
      start: toMinutes(a.startTime!),
      end: toMinutes(a.endTime!),
    }))
}

/**
 * Produce available start times for a service of `duration` minutes on a date,
 * aligned to SLOT_STEP. Used by the public availability endpoint. Past slots
 * (before `now`) are excluded.
 */
export async function getAvailableSlots(
  req: PayloadRequest,
  barberId: string,
  date: Date,
  duration: number,
): Promise<{ start: string; end: string }[]> {
  const intervals = await getWorkingIntervals(req, barberId, date)
  const booked = await getBookedIntervals(req, barberId, date)

  const slots: { start: string; end: string }[] = []
  const isToday = toDayISO(date) === toDayISO(new Date())

  for (const interval of intervals) {
    for (let t = interval.start; t + duration <= interval.end; t += SLOT_STEP) {
      const candidate: TimeRange = { start: t, end: t + duration }
      if (booked.some((b) => intersects(candidate, b))) continue
      if (isToday && t <= minutesNow()) continue
      if (t < interval.start || t + duration > interval.end) continue
      slots.push({ start: toHHMM(t), end: toHHMM(t + duration) })
    }
  }
  return slots
}

/**
 * True when a requested booking does not conflict with existing appointments or
 * working hours. Used to re-validate bookings server-side at submit time.
 */
export async function isSlotAvailable(
  req: PayloadRequest,
  barberId: string,
  date: Date,
  startHHMM: string,
  duration: number,
): Promise<boolean> {
  const intervals = await getWorkingIntervals(req, barberId, date)
  const requested: TimeRange = { start: toMinutes(startHHMM), end: toMinutes(startHHMM) + duration }

  const inside = intervals.some((i) => requested.start >= i.start && requested.end <= i.end)
  if (!inside) return false

  const booked = await getBookedIntervals(req, barberId, date)
  return !booked.some((b) => intersects(requested, b))
}

function minutesNow(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
