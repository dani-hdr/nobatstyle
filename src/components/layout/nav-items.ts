export type NavItem = {
  href: string
  label: string
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'خانه' },
  { href: '/barbers', label: 'آرایشگرها' },
]
