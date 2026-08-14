import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { isAdmin } from '../access'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    group: 'جغرافیا',
    defaultColumns: ['name', 'slug', 'isActive'],
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
      label: 'نام شهر',
    },
    slugField({ useAsSlug: 'name' }),
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
