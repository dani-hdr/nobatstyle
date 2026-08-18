/**
 * Types + mock data for the Barber single page.
 *
 * These structures mirror the shape Payload would return from the `barbers`,
 * `services`, `reviews` and `appointments` collections so the page can be wired
 * to the CMS without restructuring. All values here are placeholder/demo data;
 * `getBarberProfile` is a thin async seam where the Payload fetch will later live.
 */

export type BarberImage = {
  url: string
  alt: string
}

export type BarberStat = {
  label: string
  value: string
  hint?: string
}

/** Booking availability for the JS booking flow. Stored as JS strings for simplicity. */
export type BarberDay = {
  /** yyyy-mm-dd in the Jalali (Persian) calendar, e.g. 1404-06-03 */
  date: string
  /** Whether the barber works on this day */
  available: boolean
  slots: TimeSlot[]
}

export type TimeSlot = {
  /** e.g. '15:30' */
  time: string
  available: boolean
  label?: string
}

export type BarberService = {
  id: string
  name: string
  description?: string
  /** Duration in minutes */
  durationMinutes: number
  /** Price in Toman (nullable if not public) */
  price?: number | null
  popular?: boolean
}

export type BarberReview = {
  id: string
  customerName: string
  rating: number
  text: string
  /** ISO date */
  date: string
  avatar?: BarberImage
  verifiedBooking?: boolean
}

export type BarberProfile = {
  id: string
  slug: string
  shopName: string
  barberName: string
  rating: number
  ratingMax: number
  reviewCount: number
  verified: boolean
  city: string
  region?: string
  address: string
  /** Location coordinates for the map embed (optional until Payload wiring). */
  coordinates?: { lat: number; lng: number }
  coverImage: BarberImage
  gallery: BarberImage[]
  status: 'open' | 'away' | 'closed'
  statusNote?: string
  about?: string
  stats: BarberStat[]
  services: BarberService[]
  portfolio: BarberImage[]
  reviews: BarberReview[]
  availabilityDays: number
  bookingState: 'booking' | 'request' | 'pending'
}

export type RelatedBarber = {
  id: string
  slug: string
  shopName: string
  rating: number
  reviewCount: number
  city: string
  avatar: BarberImage
  mainService: string
  bookingState: 'booking' | 'request' | 'pending'
}

/**
 * Resolves mock image sources to locally-served brand placeholders under
 * `/public/barber`. Swapped for real Media upload URLs once wired to Payload.
 */
const img = (seed: string, _w?: number, _h?: number) => `/barber/${seed}.svg`

const portrait = (seed: string) => img(`nobat-avatar-${seed}`)

export const MOCK_BARBER: BarberProfile = {
  id: 'barber-yavanan',
  slug: 'yavanan',
  shopName: 'پیرایش جوانان',
  barberName: 'رضا ممبینی',
  rating: 7.9,
  ratingMax: 10,
  reviewCount: 87,
  verified: true,
  city: 'دزفول',
  region: 'آفرینش',
  address: 'دزفول - آفرینش - بین خیابان فجر و مدرس',
  coordinates: { lat: 32.381, lng: 48.398 },
  coverImage: { url: img('nobat-cover', 1600, 900), alt: 'پیرایش جوانان' },
  gallery: [
    { url: img('nobat-g1', 900, 1100), alt: 'نمای داخل فروشگاه' },
    { url: img('nobat-g2', 900, 1100), alt: 'محیط کار آرایشگر' },
    { url: img('nobat-g3', 900, 1100), alt: 'ابزار و تجهیزات' },
    { url: img('nobat-g4', 900, 1100), alt: 'سالن آرایش' },
  ],
  status: 'open',
  statusNote: 'تا ۲۱:۰۰ فعال است',
  about:
    'پیرایش جوانان با بیش از سه سال سابقه، آماده‌ی ارائه‌ی خدمات اصلاح و کوتاهی مو با کیفیت و رضایت مشتریان ثابت است.',
  stats: [
    { label: 'نوبت‌های مانده امروز', value: '۸' },
    { label: 'رضایت مشتری', value: '۹۷٪' },
    { label: 'مشتریان ثابت', value: '۲۳۲' },
    { label: 'سابقه فعالیت', value: 'سه سال' },
  ],
  services: [
    { id: 'svc-1', name: 'اصلاح ریش', durationMinutes: 30, price: 180_000 },
    { id: 'svc-2', name: 'اصلاح ریش + فرم دهی', durationMinutes: 45, price: 250_000, popular: true },
    { id: 'svc-3', name: 'کوتاهی مو', durationMinutes: 60, price: 220_000 },
    { id: 'svc-4', name: 'شست و شو + کوتاهی + استایل', durationMinutes: 90, price: 320_000, popular: true },
    { id: 'svc-5', name: 'حالت مو', durationMinutes: 20, price: 150_000 },
    { id: 'svc-6', name: 'سشوار + فرم دهی', durationMinutes: 25, price: 170_000 },
  ],
  portfolio: [
    { url: img('nobat-p1', 800, 1000), alt: 'نمونه کار ۱' },
    { url: img('nobat-p2', 800, 1000), alt: 'نمونه کار ۲' },
    { url: img('nobat-p3', 800, 1000), alt: 'نمونه کار ۳' },
    { url: img('nobat-p4', 800, 1000), alt: 'نمونه کار ۴' },
    { url: img('nobat-p5', 800, 1000), alt: 'نمونه کار ۵' },
    { url: img('nobat-p6', 800, 1000), alt: 'نمونه کار ۶' },
    { url: img('nobat-p7', 800, 1000), alt: 'نمونه کار ۷' },
    { url: img('nobat-p8', 800, 1000), alt: 'نمونه کار ۸' },
  ],
  reviews: [
    {
      id: 'rev-1',
      customerName: 'دانیال حیدری',
      rating: 5,
      text: 'کیفیت کار واقعا عالی بود، صبر و حوصله‌ی آرایشر هم مثال‌زدنیه. حتما دوباره میام.',
      date: '2026-08-10',
      avatar: { url: portrait('daniyal'), alt: 'دانیال حیدری' },
      verifiedBooking: true,
    },
    {
      id: 'rev-2',
      customerName: 'امیر حسینی',
      rating: 4.5,
      text: 'مطابق زمان مقرر نوبتم رو گرفتم و کار با دقت انجام شد. فقط بهتر بود قیمت‌ها در سایت دقیق باشه.',
      date: '2026-08-02',
      avatar: { url: portrait('amir'), alt: 'امیر حسینی' },
      verifiedBooking: true,
    },
    {
      id: 'rev-3',
      customerName: 'سینا کریمی',
      rating: 5,
      text: 'بهترین پیرایش محله، رضای عزیز همیشه دقیق و خوش‌برخورد هستن. پیشنهاد می‌کنم.',
      date: '2026-07-25',
      avatar: { url: portrait('sina'), alt: 'سینا کریمی' },
      verifiedBooking: false,
    },
  ],
  availabilityDays: 7,
  bookingState: 'booking',
}

export const MOCK_RELATED_BARBERS: RelatedBarber[] = [
  {
    id: 'related-1',
    slug: 'mod',
    shopName: 'پیرایش مدرن',
    rating: 8.4,
    reviewCount: 132,
    city: 'دزفول',
    avatar: { url: img('nobat-rel1', 600, 600), alt: 'پیرایش مدرن' },
    mainService: 'اصلاح ریش',
    bookingState: 'booking',
  },
  {
    id: 'related-2',
    slug: 'sepah',
    shopName: 'آرایشگاه سپاه',
    rating: 7.1,
    reviewCount: 64,
    city: 'دزفول',
    avatar: { url: img('nobat-rel2', 600, 600), alt: 'آرایشگاه سپاه' },
    mainService: 'کوتاهی مو',
    bookingState: 'request',
  },
  {
    id: 'related-3',
    slug: 'golha',
    shopName: 'پیرایش گل‌ها',
    rating: 8.9,
    reviewCount: 203,
    city: 'شوش',
    avatar: { url: img('nobat-rel3', 600, 600), alt: 'پیرایش گل‌ها' },
    mainService: 'اصلاح کامل',
    bookingState: 'booking',
  },
  {
    id: 'related-4',
    slug: 'mehrad',
    shopName: 'پیرایش مهراد',
    rating: 6.8,
    reviewCount: 41,
    city: 'اندیمشک',
    avatar: { url: img('nobat-rel4', 600, 600), alt: 'پیرایش مهراد' },
    mainService: 'حالت مو',
    bookingState: 'pending',
  },
]

/** How many services/portfolio/reviews to show before the «مشاهده همه» reveals the rest. */
export const PREVIEW_LIMITS = {
  services: 6,
  portfolio: 8,
  reviews: 3,
} as const

export function getRelatedBarbers(): RelatedBarber[] {
  // Future: `payload.find({ collection: 'barbers', where: { city: { equals: profile.city } } })`
  return MOCK_RELATED_BARBERS
}

/**
 * Resolves the barber profile for a slug. Currently returns demo data; the
 * Payload fetch (`payload.findByID`/`find` on `barbers`) will replace the
 * body here and keep the same return type.
 */
export async function getBarberProfile(slug: string): Promise<BarberProfile | null> {
  if (slug !== MOCK_BARBER.slug) return null
  return MOCK_BARBER
}

export function formatPrice(price?: number | null): string | null {
  if (price == null || Number.isNaN(price)) return null
  return `${price.toLocaleString('fa-IR')} تومان`
}

export function formatDuration(minutes: number): string {
  return `${minutes.toLocaleString('fa-IR')} دقیقه`
}
