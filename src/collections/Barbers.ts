import type { CollectionConfig, Where } from 'payload'
import { isAdmin } from '../access'
import { ROLES } from '../utils/constants'

/**
 * Central barber profile. Rating & reviewCount are denormalized and kept in
 * sync by afterChange hooks on the `comments` collection so the API can sort
 * directly by rating (highly rated) without aggregation.
 */
export const Barbers: CollectionConfig = {
  slug: 'barbers',
  labels: {
    singular: 'آرایشگر',
    plural: 'آرایشگرها',
  },
  admin: {
    useAsTitle: 'shopName',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['shopName', 'user', 'city', 'rating'],
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      const u = req.user
      if (!u) return false
      return isAdmin({ req }) || u.role === ROLES.BARBER
    },
    update: ({ req }) => {
      const u = req.user
      if (!u) return false
      if (isAdmin({ req })) return true
      if (u.role === ROLES.BARBER) {
        // A barber may only edit their own profile.
        return { user: { equals: u.id } }
      }
      return false
    },
    delete: ({ req }) => isAdmin({ req }),
  },
  endpoints: [
    {
      // GET /api/barbers/:id/appointments — the barber's appointment windows,
      // filtered to the requested date where fromDate falls on it.
      path: '/:id/appointments',
      method: 'get',
      handler: async (req) => {
        const id = String(req.routeParams?.['id'])
        const url = new URL(req.url || '')
        const dateParam = url.searchParams.get('date')

        const where: Where = { barber: { equals: id } }
        if (dateParam) {
          const from = new Date(`${dateParam}T00:00:00.000Z`)
          const to = new Date(from)
          to.setDate(to.getDate() + 1)
          where.fromDate = {
            greater_than_equal: from.toISOString(),
            less_than: to.toISOString(),
          }
        }

        const res = await req.payload.find({
          collection: 'appointments',
          depth: 1,
          where,
          sort: 'fromDate',
          limit: 200,
          overrideAccess: false,
        })

        return Response.json({
          date: dateParam ?? null,
          appointments: res.docs.map((a) => ({
            id: a.id,
            service: a.service,
            fromDate: a.fromDate,
            toDate: a.toDate,
            status: a.status,
            available: a.status === 'available',
          })),
        })
      },
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'کاربر',
      filterOptions: ({ data }) => ({
        role: { equals: ROLES.BARBER },
      }),
      admin: {
        position: 'sidebar',
        condition: (data, siblingData, { user }) => user?.role !== ROLES.BARBER,
      },
    },
    {
      name: 'shopName',
      type: 'text',
      required: true,
      index: true,
      label: 'نام آرایشگاه',
    },
    {
      name: 'shopSlug',
      type: 'text',
      unique: true,
      required: true,
      label: 'شناسه آرایشگاه',
      admin: {
        description: 'شناسه یکتا برای آدرس پروفایل',
        condition: (data, siblingData, { user }) => user?.role !== ROLES.BARBER,
      },
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
      index: true,
      label: 'شهر',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'address',
      type: 'text',
      label: 'آدرس',
    },
    {
      name: 'location',
      type: 'point',
      label: 'موقعیت مکانی',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'about',
      type: 'textarea',
      label: 'درباره',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'شماره تماس',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاور',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری تصاویر',
      admin: {
        description: 'تصاویر گالری صفحه پروفایل آرایشگر',
      },
    },
    {
      name: 'experienceYears',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: 'سال سابقه',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'rating',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 5,
      label: 'امتیاز',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'تعداد بازخورد',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'appointments',
      type: 'join',
      collection: 'appointments',
      on: 'barber',
      hasMany: true,
      label: 'رزروهای زمانی',
      admin: {
        description: 'وقت‌هایی که این آرایشگر در یک بازه زمانی مشخص ارائه می‌دهد.',
      },
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      index: true,
      label: 'خدمات ارائه‌شده',
      admin: {
        description: 'خدماتی که این آرایشگر ارائه می‌دهد (از کاتالوگ ادمین انتخاب می‌شود).',
      },
      filterOptions: {
        isActive: { equals: true },
      },
    },
    {
      name: 'customers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      label: 'مشتریان',
      admin: {
        description:
          'کاربرانی که مشتری این آرایشگر هستند (به‌صورت خودکار هنگام رزرو اضافه می‌شوند).',
      },
    },
  ],
}
