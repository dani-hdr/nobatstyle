/**
 * Client-safe types for the support ticket UI (/support) backed by the
 * /api/support/tickets endpoints.
 */

export type TicketCategory =
  | 'general'
  | 'technical'
  | 'booking'
  | 'subscription'
  | 'payment'
  | 'other'

export type TicketStatus = 'open' | 'answered' | 'closed'

export type TicketPriority = 'low' | 'normal' | 'high'

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'general', label: 'عمومی' },
  { value: 'technical', label: 'مشکل فنی' },
  { value: 'booking', label: 'رزرو و نوبت' },
  { value: 'subscription', label: 'اشتراک' },
  { value: 'payment', label: 'پرداخت' },
  { value: 'other', label: 'سایر' },
]

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = TICKET_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<TicketCategory, string>,
)

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; variant: 'warning' | 'success' | 'secondary' }
> = {
  open: { label: 'باز', variant: 'warning' },
  answered: { label: 'پاسخ داده شده', variant: 'success' },
  closed: { label: 'بسته شده', variant: 'secondary' },
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'کم',
  normal: 'معمولی',
  high: 'زیاد',
}

export type TicketSummary = {
  id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  messageCount: number
  lastMessage: string | null
  lastFrom: 'user' | 'staff' | null
}

export type TicketMessage = {
  id: string
  from: 'user' | 'staff'
  body: string
  createdAt: string
}

export type TicketDetail = TicketSummary & {
  messages: TicketMessage[]
}

export type TicketMe = {
  id: string
  name?: string | null
  username?: string | null
  role: 'customer' | 'barber' | 'admin'
}
