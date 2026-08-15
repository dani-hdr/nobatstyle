import type { CollectionConfig } from 'payload'
import { ROLES } from '../utils/constants'
import { isAdmin } from '../access'
import { getAvailableSlots, getWorkingIntervals } from '../utils/availability'

/**
 * Central barber profile. Rating & reviewCount are denormalized and kept in
 * sync by an afterChange hook on the `reviews` collection so the API can sort
 * directly by rating (featured / highly rated) without aggregation.
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
    defaultColumns: ['shopName', 'user', 'city', 'rating', 'isVerified', 'isActive'],
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
      // GET /api/barbers/:id/availability?date=YYYY-MM-DD&service=:serviceId
      path: '/:id/availability',
      method: 'get',
      handler: async (req) => {
        const id = String(req.routeParams?.['id'])
        const url = new URL(req.url || '')
        const dateParam = url.searchParams.get('date')
        const serviceId = url.searchParams.get('service')

        if (!dateParam) {
          return Response.json({ error: 'date query param is required (YYYY-MM-DD)' }, { status: 400 })
        }

        let duration = 30
        if (serviceId) {
          const svc = await req.payload.findByID({ collection: 'services', id: serviceId, depth: 0 })
          duration = svc?.duration ?? 30
        }

        const date = new Date(`${dateParam}T00:00:00`)
        const [slots, workingHours] = await Promise.all([
          getAvailableSlots(req, id, date, duration),
          getWorkingIntervals(req, id, date).then((intervals) =>
            intervals.map((i) => ({
              start: `${String(Math.floor(i.start / 60)).padStart(2, '0')}:${String(i.start % 60).padStart(2, '0')}`,
              end: `${String(Math.floor(i.end / 60)).padStart(2, '0')}:${String(i.end % 60).padStart(2, '0')}`,
            })),
          ),
        ])

        return Response.json({ date: dateParam, duration, slots, workingHours })
      },
    },
    {
      // GET /api/barbers/:id/reviews — active reviews, newest first.
      path: '/:id/reviews',
      method: 'get',
      handler: async (req) => {
        const id = String(req.routeParams?.['id'])
        const res = await req.payload.find({
          collection: 'reviews',
          depth: 2,
          where: { and: [{ barber: { equals: id } }, { status: { equals: 'active' } }] },
          sort: '-createdAt',
          limit: 50,
          overrideAccess: false,
        })
        return Response.json(res)
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
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر پروفایل',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاور',
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
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      label: 'تأیید شده',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      label: 'فعال',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: 'ویژه',
      admin: {
        position: 'sidebar',
        description: 'نمایش در بخش «آرایشگران ویژه» صفحه اصلی',
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
      name: 'workingHours',
      type: 'array',
      label: 'ساعات کاری هفتگی',
      labels: { singular: 'روز', plural: 'روزهای هفته' },
      admin: {
        description: 'ساعات کاری تکراری هفتگی. هر روز شامل جهت ساعات کاری است.',
      },
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          label: 'روز',
          options: [
            { label: 'شنبه', value: 'saturday' },
            { label: 'یکشنبه', value: 'sunday' },
            { label: 'دوشنبه', value: 'monday' },
            { label: 'سه‌شنبه', value: 'tuesday' },
            { label: 'چهارشنبه', value: 'wednesday' },
            { label: 'پنجشنبه', value: 'thursday' },
            { label: 'جمعه', value: 'friday' },
          ],
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'فعال بودن روز',
        },
        {
          name: 'slots',
          type: 'array',
          label: 'بازه‌های کاری',
          labels: { singular: 'بازه کاری', plural: 'بازه‌های کاری' },
          fields: [
            { name: 'start', type: 'text', required: true, label: 'شروع' },
            { name: 'end', type: 'text', required: true, label: 'پایان' },
          ],
        },
      ],
    },
  ],
}
