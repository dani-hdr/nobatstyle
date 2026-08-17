import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Global service catalog created by admins. Barbers do not create services;
 * they reference a catalog service and set their own appointment window via the
 * `appointments` array on the `barbers` collection.
 */
export const Services: CollectionConfig = {
  slug: 'services',
  labels: {
    singular: 'خدمت',
    plural: 'خدمات',
  },
  admin: {
    useAsTitle: 'name',
    group: 'آرایشگاه‌ها',
    defaultColumns: ['name', 'icon', 'isActive', 'createdAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام خدمت',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات',
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'آیکون',
      admin: {
        description: 'تصویر / آیکون خدمت',
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
  ],
}
