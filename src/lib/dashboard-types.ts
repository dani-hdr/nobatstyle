/**
 * Client-safe types for the dashboard REST payloads returned by
 * /api/customer/dashboard and /api/barber/dashboard (raw Payload docs,
 * depth-1 populated relationships arrive as objects or ids).
 */

export type Ref<T> = T | string | number | null | undefined

export type DashUser = {
  id: string
  name?: string | null
  username?: string | null
  avatar?: { url?: string | null; alt?: string | null } | string | number | null
}

export type DashBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  reviewCount?: number | null
  isVerified?: boolean
  city?: Ref<{ id: string; name?: string }>
}

export type DashService = {
  id: string
  name?: string
}

export type DashAppointment = {
  id: string
  service?: Ref<DashService>
  barber?: Ref<DashBarber>
  customer?: Ref<DashUser>
  fromDate: string
  toDate: string
  status: 'available' | 'reserved' | 'cancelled'
}

export type DashNotification = {
  id: string
  type?: 'appointment' | 'message' | 'system' | 'subscription' | string
  title?: string | null
  body?: string | null
  readAt?: string | null
  createdAt: string
}

export type DashReview = {
  id: string
  rating: number
  comment?: string | null
  customer?: Ref<DashUser>
  createdAt: string
}

export type CustomerDashboardData = {
  nextAppointment: DashAppointment | null
  appointments: DashAppointment[]
  pastAppointments: DashAppointment[]
  cancelledAppointments: DashAppointment[]
  notifications: DashNotification[]
}

export type BarberDashboardData = {
  barber: DashBarber
  appointments: DashAppointment[]
  newRequests: DashAppointment[]
  reviews: DashReview[]
  notifications: DashNotification[]
  statistics: {
    completedCount: number
    rating: number
    reviewCount: number
  }
}

/** Persian date/time helpers shared by both dashboards. */
export function faDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function faTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
