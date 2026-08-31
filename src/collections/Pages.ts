import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { isAdmin } from '../access'

/**
 * Simple admin-managed content pages (تماس با ما، درباره ما، قوانین و...).
 * Public visitors only see published pages; the frontend renders them under
 * their own URL (e.g. /contact) via the dynamic `[slug]` route.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'صفحه',
    plural: 'صفحات',
  },
  admin: {
    useAsTitle: 'title',
    group: 'تنظیمات',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: ({ req }) => {
      if (isAdmin({ req })) return true
      return { status: { equals: 'published' } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'عنوان',
    },
    slugField(),
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'محتوا',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      index: true,
      label: 'وضعیت',
      admin: {
        position: 'sidebar',
      },
      options: [
        { label: 'منتشر شده', value: 'published' },
        { label: 'پیش‌نویس', value: 'draft' },
      ],
    },
  ],
}
