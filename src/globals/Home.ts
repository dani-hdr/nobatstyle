import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Admin-configurable promotional / landing content. Selection of featured and
 * popular items is done here by reference so the frontend only reads the API.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  admin: {
    group: 'صفحه اصلی',
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
      type: 'group',
      name: 'promo',
      label: 'بنر تبلیغاتی',
      fields: [
        { name: 'title', type: 'text', label: 'عنوان' },
        { name: 'body', type: 'textarea', label: 'متن' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر' },
        { name: 'link', type: 'text', label: 'لینک' },
      ],
    },
    {
      name: 'popularServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: {
        description: 'خدمات منتخب جهت نمایش در بخش محبوب',
      },
    },
  ],
}
