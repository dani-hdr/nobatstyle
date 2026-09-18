import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Admin-configurable homepage content. Selection of popular services is done
 * here by reference so the frontend only reads the API.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  label:'صفحه ی اصلی',
  admin: {
    group: 'تنظیمات',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'group',
      name: 'hero',
      label: 'Hero',
      fields: [
        { name: 'title', type: 'text', label: 'عنوان' },
        { name: 'subtitle', type: 'textarea', label: 'زیرعنوان' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر' },
      ],
    },
    {
      type: 'group',
      name: 'stats',
      label: 'آمار (نمایش عمومی)',
      fields: [
        { name: 'barbersCount', type: 'number', defaultValue: 0, label: 'تعداد آرایشگرها' },
        { name: 'appointmentsCount', type: 'number', defaultValue: 0, label: 'تعداد رزروها' },
        { name: 'citiesCount', type: 'number', defaultValue: 0, label: 'تعداد شهرها' },
        { name: 'customersCount', type: 'number', defaultValue: 0, label: 'تعداد مشتریان' },
      ],
    },
    {
      name: 'whyUs',
      type: 'array',
      label: 'چرا ما؟',
      labels: { singular: 'دلیل', plural: 'دلایل' },
      admin: {
        description: 'دلایلی که چرا مشتریان باید از ما استفاده کنند.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'عنوان' },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'آیکون',
        },
        { name: 'description', type: 'textarea', label: 'توضیحات' },
      ],
    },
  ],
}
