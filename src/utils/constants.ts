export const ROLES = {
  CUSTOMER: 'customer',
  BARBER: 'barber',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'مشتری',
  barber: 'آرایشگر',
  admin: 'مدیر',
}

export const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[keyof typeof APPOINTMENT_STATUSES]

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'در انتظار تأیید',
  confirmed: 'تأیید شده',
  completed: 'انجام شده',
  cancelled: 'لغو شده',
}

export const REVIEW_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const

/**
 * Status metadata for dynamic statuses. The machine value is stable; the
 * label is a display string the frontend can render without duplicating logic.
 */
export const STATUS_META = {
  appointment: {
    pending: { statusLabel: 'در انتظار تأیید', color: 'amber' },
    confirmed: { statusLabel: 'تأیید شده', color: 'green' },
    completed: { statusLabel: 'انجام شده', color: 'blue' },
    cancelled: { statusLabel: 'لغو شده', color: 'red' },
  },
} as const
