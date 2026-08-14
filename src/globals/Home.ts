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
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'group',
      name: 'stats',
      label: 'آمار (نمایش عمومی)',
      fields: [
        { name: 'barbersCount', type: 'number', defaultValue: 0 },
        { name: 'appointmentsCount', type: 'number', defaultValue: 0 },
        { name: 'citiesCount', type: 'number', defaultValue: 0 },
        { name: 'customersCount', type: 'number', defaultValue: 0 },
      ],
    },
    {
      type: 'group',
      name: 'promo',
      label: 'بنر تبلیغاتی',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'link', type: 'text' },
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
