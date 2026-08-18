import { Badge } from '@/components/ui/badge'
import type { BarberProfile } from '@/lib/barber-profile'

const STATUS_META: Record<
  BarberProfile['status'],
  { label: string; variant: 'success' | 'warning' | 'secondary' }
> = {
  open: { label: 'باز', variant: 'success' },
  away: { label: 'به‌زودی فعال', variant: 'warning' },
  closed: { label: 'بسته', variant: 'secondary' },
}

export function StatusBadge({ status }: { status: BarberProfile['status'] }) {
  const meta = STATUS_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
