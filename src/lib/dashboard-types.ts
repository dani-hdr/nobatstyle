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

export type DashComment = {
  id: string
  content: string
  rating?: number | null
  author?: Ref<DashUser>
  status?: string
  createdAt: string
}

export type CustomerDashboardData = {
  nextAppointment: DashAppointment | null
  appointments: DashAppointment[]
  pastAppointments: DashAppointment[]
  cancelledAppointments: DashAppointment[]
  notifications: DashNotification[]
}

export type DashSubscriptionState = {
  mode: 'trial' | 'active' | 'expired'
  daysLeft: number | null
  windowEndsAt: string | null
  plan: { id: string; name: string } | null
}

export type DashCustomerRequest = {
  id: string
  createdAt: string
  customer: { id: string; name: string | null; username: string | null }
}

export type BarberDashboardData = {
  barber: DashBarber
  appointments: DashAppointment[]
  newRequests: DashAppointment[]
  customerRequests?: DashCustomerRequest[]
  comments: DashComment[]
  notifications: DashNotification[]
  subscription: DashSubscriptionState
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
