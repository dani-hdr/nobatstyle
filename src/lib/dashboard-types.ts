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
  rating?: number | null
  reviewCount?: number | null
  city?: Ref<{ id: string; name?: string }>
  avatar?: { url?: string | null; alt?: string | null } | null
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
  customerMessage?: string | null
}

export type DashComment = {
  id: string
  content: string
  rating?: number | null
  author?: Ref<DashUser>
  status?: string
  createdAt: string
}

export type CustomerTab = 'upcoming' | 'past' | 'cancelled' | 'barbers'

export type CustomerDashboardData = {
  tab: CustomerTab
  page: number
  limit: number
  totalPages: number
  totalDocs: number
  counts: {
    upcoming: number
    past: number
    cancelled: number
    barbers: number
  }
  nextAppointment: DashAppointment | null
  appointments: DashAppointment[]
  barbers: DashBarber[]
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

export type BarberTab = 'all' | 'requests' | 'customers' | 'comments'

export type BarberDashboardData = {
  tab: BarberTab
  page: number
  limit: number
  totalPages: number
  totalDocs: number
  counts: {
    upcoming: number
    all: number
    requests: number
    customers: number
    comments: number
  }
  /** Upcoming appointments — rendered on the page, outside the tabs. */
  upcoming: DashAppointment[]
  upcomingPage: number
  upcomingLimit: number
  upcomingTotalPages: number
  upcomingTotalDocs: number
  barber: DashBarber
  appointments: DashAppointment[]
  customerRequests: DashCustomerRequest[]
  customers: DashUser[]
  comments: DashComment[]
  services: DashService[]
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
